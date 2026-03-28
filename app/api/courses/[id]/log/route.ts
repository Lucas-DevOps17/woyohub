import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const XP_PER_LOG = 10;
const XP_PER_SKILL = 10;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = params.id;

  let body: {
    units_completed: number;
    summary: string;
    skill_ids?: string[];
    new_skill_name?: string;
    new_skill_icon?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    units_completed,
    summary,
    skill_ids = [],
    new_skill_name,
    new_skill_icon,
  } = body;

  if (!units_completed || units_completed < 1) {
    return NextResponse.json(
      { error: "units_completed must be at least 1" },
      { status: 400 }
    );
  }
  if (!summary?.trim()) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  // Validate course ownership + get current progress
  const { data: course } = await supabase
    .from("courses")
    .select("id, completed_units, total_units, status")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const currentCompleted = course.completed_units || 0;
  const total = course.total_units || 1;
  const remaining = total - currentCompleted;

  if (remaining <= 0) {
    return NextResponse.json({ error: "Course is already complete" }, { status: 400 });
  }

  // Clamp units to remaining — never over-complete
  const safeUnits = Math.min(units_completed, remaining);
  const finalSkillIds = [...skill_ids];

  // Handle optional new skill creation
  if (new_skill_name?.trim()) {
    const { data: newSkill, error: skillInsertError } = await supabase
      .from("skills")
      .insert({
        name: new_skill_name.trim(),
        icon: new_skill_icon?.trim() || "🔷",
        category: "custom",
        description: null,
      })
      .select("id")
      .single();

    if (skillInsertError) {
      return NextResponse.json({ error: skillInsertError.message }, { status: 400 });
    }
    finalSkillIds.push(newSkill.id);
  }

  // Insert learning log
  const { data: log, error: logError } = await supabase
    .from("learning_logs")
    .insert({
      user_id: user.id,
      course_id: courseId,
      content: summary.trim(),
      units_completed: safeUnits,
    })
    .select("id")
    .single();

  if (logError || !log) {
    return NextResponse.json(
      { error: logError?.message || "Failed to create log" },
      { status: 400 }
    );
  }

  // Update course progress
  const newCompleted = currentCompleted + safeUnits;
  const { error: courseUpdateError } = await supabase
    .from("courses")
    .update({
      completed_units: newCompleted,
      status: newCompleted >= total ? "completed" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (courseUpdateError) {
    return NextResponse.json({ error: courseUpdateError.message }, { status: 400 });
  }

  // Link skills to this log
  if (finalSkillIds.length > 0) {
    await supabase.from("learning_log_skills").insert(
      finalSkillIds.map((skillId) => ({
        learning_log_id: log.id,
        skill_id: skillId,
      }))
    );
  }

  // Insert XP log
  await supabase.from("xp_logs").insert({
    user_id: user.id,
    source_type: "learning_log",
    source_id: log.id,
    amount: XP_PER_LOG,
    skill_id: finalSkillIds[0] || null,
  });

  // Award XP to each tagged skill
  for (const skillId of finalSkillIds) {
    const { data: existing } = await supabase
      .from("user_skills")
      .select("xp, level")
      .eq("user_id", user.id)
      .eq("skill_id", skillId)
      .single();

    if (existing) {
      const newXp = existing.xp + XP_PER_SKILL;
      await supabase
        .from("user_skills")
        .update({ xp: newXp, level: Math.floor(newXp / 100) })
        .eq("user_id", user.id)
        .eq("skill_id", skillId);
    } else {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
        xp: XP_PER_SKILL,
        level: 0,
      });
    }
  }

  // Update profile total_xp via RPC, fallback to direct update
  const { error: rpcError } = await supabase.rpc("increment_user_xp", {
    p_user_id: user.id,
    p_xp_amount: XP_PER_LOG,
  });

  if (rpcError) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_xp: (profile.total_xp || 0) + XP_PER_LOG })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({
    success: true,
    xpAwarded: XP_PER_LOG,
    log_id: log.id,
    units_completed: safeUnits,
    new_completed: newCompleted,
  });
}
