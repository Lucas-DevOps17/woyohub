// ============================================
// WOYOhub Progression System
// ============================================
// Server-side XP award functions with idempotency checks.
// All functions assume RLS is handled by the caller (server client with auth).

import { SupabaseClient } from "@supabase/supabase-js";

export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  COURSE_COMPLETE: 50,
  PROJECT_COMPLETE: 100,
  DAILY_LOGIN: 5,
  ROADMAP_NODE_COMPLETE: 10,
} as const;

/**
 * Calculate skill level from XP (same formula as profiles)
 */
export const calculateSkillLevel = (xp: number): number => {
  return Math.floor(xp / 100);
};

/**
 * Award XP for completing a lesson.
 * Idempotent: checks if lesson already completed.
 */
export async function awardLessonXP(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  courseId: string
): Promise<{ success: boolean; error?: string; xpAwarded?: number }> {
  // Check if lesson already completed
  const { data: lesson } = await supabase
    .from("lessons")
    .select("completed")
    .eq("id", lessonId)
    .single();

  if (lesson?.completed) {
    return { success: false, error: "Lesson already completed" };
  }

  // Get course info for skill_id
  const { data: course } = await supabase
    .from("courses")
    .select("skill_id, total_units, completed_units")
    .eq("id", courseId)
    .single();

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  // Mark lesson as completed
  const { error: lessonError } = await supabase
    .from("lessons")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", lessonId);

  if (lessonError) {
    return { success: false, error: lessonError.message };
  }

  // Increment course completed_units
  const newCompletedUnits = (course.completed_units || 0) + 1;
  const { error: courseError } = await supabase
    .from("courses")
    .update({
      completed_units: newCompletedUnits,
      status: newCompletedUnits >= (course.total_units || 1) ? "completed" : "active",
    })
    .eq("id", courseId);

  if (courseError) {
    return { success: false, error: courseError.message };
  }

  // Award XP
  const xpAmount = XP_REWARDS.LESSON_COMPLETE;

  // Insert XP log
  const { error: xpLogError } = await supabase.from("xp_logs").insert({
    user_id: userId,
    source_type: "lesson",
    source_id: lessonId,
    amount: xpAmount,
    skill_id: course.skill_id,
  });

  if (xpLogError) {
    return { success: false, error: xpLogError.message };
  }

  // Update user_skills (upsert)
  if (course.skill_id) {
    const { data: existingSkill } = await supabase
      .from("user_skills")
      .select("xp, level")
      .eq("user_id", userId)
      .eq("skill_id", course.skill_id)
      .single();

    if (existingSkill) {
      const newXp = existingSkill.xp + xpAmount;
      const { error: skillError } = await supabase
        .from("user_skills")
        .update({
          xp: newXp,
          level: calculateSkillLevel(newXp),
        })
        .eq("user_id", userId)
        .eq("skill_id", course.skill_id);

      if (skillError) {
        return { success: false, error: skillError.message };
      }
    } else {
      const { error: insertError } = await supabase.from("user_skills").insert({
        user_id: userId,
        skill_id: course.skill_id,
        xp: xpAmount,
        level: calculateSkillLevel(xpAmount),
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }
  }

  // Update profile total_xp
  const { error: profileError } = await supabase.rpc("increment_user_xp", {
    p_user_id: userId,
    p_xp_amount: xpAmount,
  });

  if (profileError) {
    // Fallback: direct update if RPC doesn't exist
    await supabase
      .from("profiles")
      .update({ total_xp: supabase.rpc("total_xp + " + xpAmount) as unknown as number })
      .eq("id", userId);
  }

  // Check for course completion bonus
  if (newCompletedUnits >= (course.total_units || 1)) {
    await awardCourseXP(supabase, userId, courseId, course.skill_id);
  }

  return { success: true, xpAwarded: xpAmount };
}

/**
 * Award XP for completing a course (bonus).
 */
export async function awardCourseXP(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  skillId: string | null
): Promise<{ success: boolean; error?: string; xpAwarded?: number }> {
  // Check if already awarded
  const { data: existingLog } = await supabase
    .from("xp_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", "course")
    .eq("source_id", courseId)
    .single();

  if (existingLog) {
    return { success: false, error: "Course XP already awarded" };
  }

  const xpAmount = XP_REWARDS.COURSE_COMPLETE;

  const { error: xpLogError } = await supabase.from("xp_logs").insert({
    user_id: userId,
    source_type: "course",
    source_id: courseId,
    amount: xpAmount,
    skill_id: skillId,
  });

  if (xpLogError) {
    return { success: false, error: xpLogError.message };
  }

  // Update user_skills
  if (skillId) {
    const { data: existingSkill } = await supabase
      .from("user_skills")
      .select("xp, level")
      .eq("user_id", userId)
      .eq("skill_id", skillId)
      .single();

    if (existingSkill) {
      const newXp = existingSkill.xp + xpAmount;
      await supabase
        .from("user_skills")
        .update({
          xp: newXp,
          level: calculateSkillLevel(newXp),
        })
        .eq("user_id", userId)
        .eq("skill_id", skillId);
    } else {
      await supabase.from("user_skills").insert({
        user_id: userId,
        skill_id: skillId,
        xp: xpAmount,
        level: calculateSkillLevel(xpAmount),
      });
    }
  }

  // Update profile
  await supabase.rpc("increment_user_xp", {
    p_user_id: userId,
    p_xp_amount: xpAmount,
  });

  return { success: true, xpAwarded: xpAmount };
}

/**
 * Award XP for completing a project.
 * Distributes XP across linked skills.
 */
export async function awardProjectXP(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string; xpAwarded?: number }> {
  // Check if already awarded
  const { data: existingLog } = await supabase
    .from("xp_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", "project")
    .eq("source_id", projectId)
    .single();

  if (existingLog) {
    return { success: false, error: "Project XP already awarded" };
  }

  // Get linked skills
  const { data: projectSkills } = await supabase
    .from("project_skills")
    .select("skill_id")
    .eq("project_id", projectId);

  const totalXp = XP_REWARDS.PROJECT_COMPLETE;
  const skillCount = projectSkills?.length || 1;
  const xpPerSkill = Math.floor(totalXp / skillCount);

  // Insert XP log (total amount)
  const { error: xpLogError } = await supabase.from("xp_logs").insert({
    user_id: userId,
    source_type: "project",
    source_id: projectId,
    amount: totalXp,
    skill_id: projectSkills?.[0]?.skill_id || null,
  });

  if (xpLogError) {
    return { success: false, error: xpLogError.message };
  }

  // Distribute XP across skills
  for (const ps of projectSkills || []) {
    const { data: existingSkill } = await supabase
      .from("user_skills")
      .select("xp, level")
      .eq("user_id", userId)
      .eq("skill_id", ps.skill_id)
      .single();

    if (existingSkill) {
      const newXp = existingSkill.xp + xpPerSkill;
      await supabase
        .from("user_skills")
        .update({
          xp: newXp,
          level: calculateSkillLevel(newXp),
        })
        .eq("user_id", userId)
        .eq("skill_id", ps.skill_id);
    } else {
      await supabase.from("user_skills").insert({
        user_id: userId,
        skill_id: ps.skill_id,
        xp: xpPerSkill,
        level: calculateSkillLevel(xpPerSkill),
      });
    }
  }

  // Update profile
  await supabase.rpc("increment_user_xp", {
    p_user_id: userId,
    p_xp_amount: totalXp,
  });

  return { success: true, xpAwarded: totalXp };
}

/**
 * Award daily login XP.
 * Checks last_activity_date for idempotency.
 */
export async function awardDailyLoginXP(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string; xpAwarded?: number; isStreakDay?: boolean }> {
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_activity_date, current_streak, longest_streak, total_xp, streak_freeze_count")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  const lastActivity = profile.last_activity_date
    ? new Date(profile.last_activity_date).toISOString().split("T")[0]
    : null;

  // Already logged in today
  if (lastActivity === today) {
    return { success: true, xpAwarded: 0, isStreakDay: false };
  }

  const xpAmount = XP_REWARDS.DAILY_LOGIN;
  let newStreak = 1;
  let isNewStreakDay = false;

  // Calculate streak
  if (lastActivity) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastActivity === yesterdayStr) {
      // Consecutive day
      newStreak = (profile.current_streak || 0) + 1;
      isNewStreakDay = true;
    } else {
      // Streak broken, check if we can use a freeze
      const missedDaysTime = Math.max(0, new Date().getTime() - new Date(lastActivity).getTime());
      const missedDays = Math.floor(missedDaysTime / (1000 * 3600 * 24)) - 1; // 1 missed day = diff is 2

      if (missedDays > 0 && (profile.streak_freeze_count || 0) >= missedDays) {
        // Auto-consume freez(e)
        newStreak = (profile.current_streak || 0) + 1;
        isNewStreakDay = true;
        // Deduct freezes
        profile.streak_freeze_count -= missedDays;
      } else {
        // Break streak
        newStreak = 1;
      }
    }
  }

  const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

  // Insert XP log
  const { error: xpLogError } = await supabase.from("xp_logs").insert({
    user_id: userId,
    source_type: "daily_login",
    source_id: null,
    amount: xpAmount,
    skill_id: null,
  });

  if (xpLogError) {
    return { success: false, error: xpLogError.message };
  }

  // Update profile
  const { error: profileError } = await supabase.from("profiles").update({
    total_xp: (profile.total_xp || 0) + xpAmount,
    level: Math.floor(((profile.total_xp || 0) + xpAmount) / 100),
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_activity_date: today,
    streak_freeze_count: profile.streak_freeze_count,
  }).eq("id", userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true, xpAwarded: xpAmount, isStreakDay: isNewStreakDay };
}

/**
 * Award XP when a roadmap workflow node is marked complete (skill-linked).
 * Idempotent: one log per (user, node_id).
 */
export async function awardRoadmapNodeCompletionXP(
  supabase: SupabaseClient,
  userId: string,
  nodeId: string
): Promise<{ success: boolean; error?: string; xpAwarded?: number }> {
  // Check if already awarded
  const { data: existingLog } = await supabase
    .from("xp_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("source_type", "roadmap_node")
    .eq("source_id", nodeId)
    .maybeSingle();

  if (existingLog) {
    return { success: false, error: "Roadmap node XP already awarded" };
  }

  // Get linked skills from the new junction table
  const { data: nodeSkills } = await supabase
    .from("roadmap_node_skills")
    .select("skill_id")
    .eq("node_id", nodeId);

  const totalXp = XP_REWARDS.ROADMAP_NODE_COMPLETE;
  const skillCount = nodeSkills?.length || 1;
  const xpPerSkill = Math.floor(totalXp / skillCount);

  // Still insert one XP log
  const { error: xpLogError } = await supabase.from("xp_logs").insert({
    user_id: userId,
    source_type: "roadmap_node",
    source_id: nodeId,
    amount: totalXp,
    skill_id: nodeSkills?.[0]?.skill_id || null, // Best effort primary skill tracking
  });

  if (xpLogError) {
    return { success: false, error: xpLogError.message };
  }

  // Distribute XP across all linked skills
  for (const ns of nodeSkills || []) {
    const { data: existingSkill } = await supabase
      .from("user_skills")
      .select("xp, level")
      .eq("user_id", userId)
      .eq("skill_id", ns.skill_id)
      .maybeSingle();

    if (existingSkill) {
      const newXp = existingSkill.xp + xpPerSkill;
      const { error: skillError } = await supabase
        .from("user_skills")
        .update({
          xp: newXp,
          level: calculateSkillLevel(newXp),
        })
        .eq("user_id", userId)
        .eq("skill_id", ns.skill_id);

      if (skillError) {
        // We log error but don't abort loop
        console.error("Failed to update skill XP:", skillError);
      }
    } else {
      const { error: insertError } = await supabase.from("user_skills").insert({
        user_id: userId,
        skill_id: ns.skill_id,
        xp: xpPerSkill,
        level: calculateSkillLevel(xpPerSkill),
      });

      if (insertError) {
        console.error("Failed to insert skill XP:", insertError);
      }
    }
  }

  // Award total to profile
  const { error: rpcError } = await supabase.rpc("increment_user_xp", {
    p_user_id: userId,
    p_xp_amount: totalXp,
  });

  if (rpcError) {
    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", userId).single();
    const total = profile?.total_xp ?? 0;
    await supabase
      .from("profiles")
      .update({
        total_xp: total + totalXp,
        level: Math.floor((total + totalXp) / 100),
      })
      .eq("id", userId);
  }

  return { success: true, xpAwarded: totalXp };
}
