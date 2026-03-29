import { SupabaseClient } from "@supabase/supabase-js";

export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<{ newUnlocks: any[] }> {
  // 1. Get raw counts and info
  const [{ data: profile }, { count: coursesEnrolled }, { count: coursesCompleted }, { count: projectsAdded }, { count: projectsCompleted }, { count: logsCount }, { data: logsData }, { count: roadmapsEnrolled }, { count: roadmapsCompleted }, { count: nodesCompleted }, { data: skillsData }] = await Promise.all([
    supabase.from("profiles").select("total_xp, level, current_streak, longest_streak").eq("id", userId).single(),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    supabase.from("learning_logs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("learning_logs").select("summary, created_at").eq("user_id", userId),
    supabase.from("user_roadmaps").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_roadmaps").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_active", false), // Simplification: we'll just check roadmaps where the user has 100% completed them or assume this applies. Alternatively, we can check overall completion later.
    supabase.from("user_roadmap_node_state").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    supabase.from("user_skills").select("level").eq("user_id", userId)
  ]);

  if (!profile) return { newUnlocks: [] };

  const totalWords = (logsData || []).reduce((acc, log) => acc + (log.summary?.split(/\s+/).length || 0), 0);
  const maxSkillLevel = Math.max(...(skillsData || []).map(s => s.level), 0);
  const skillsTracked = skillsData?.length || 0;

  // Compute special heuristics
  let nightOwl = false;
  let earlyBird = false;
  let deepFocus = false;
  const logsPerDay = new Map<string, number>();

  (logsData || []).forEach(log => {
    const d = new Date(log.created_at);
    const hour = d.getHours();
    if (hour >= 0 && hour < 4) nightOwl = true;
    if (hour >= 4 && hour < 6) earlyBird = true;
    if ((log.summary?.split(/\s+/).length || 0) >= 500) deepFocus = true;

    const dateStr = d.toISOString().split("T")[0];
    logsPerDay.set(dateStr, (logsPerDay.get(dateStr) || 0) + 1);
  });
  
  let marathon = Array.from(logsPerDay.values()).some(count => count >= 5);

  // 2. Fetch achievements and unlocked
  const { data: achievements } = await supabase.from("achievements").select("*");
  if (!achievements) return { newUnlocks: [] };

  const { data: unlocked } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", userId);
  const unlockedIds = new Set(unlocked?.map(a => a.achievement_id) || []);

  const newUnlockIds: string[] = [];

  // 3. Evaluate milestones
  for (const ach of achievements) {
    if (unlockedIds.has(ach.id)) continue;

    let fulfills = false;
    switch (ach.requirement_type) {
      case "total_xp": fulfills = profile.total_xp >= ach.requirement_value; break;
      case "level": fulfills = profile.level >= ach.requirement_value; break;
      case "streak_days": fulfills = profile.longest_streak >= ach.requirement_value; break;
      case "courses_enrolled": fulfills = (coursesEnrolled || 0) >= ach.requirement_value; break;
      case "courses_completed": fulfills = (coursesCompleted || 0) >= ach.requirement_value; break;
      case "logs_count": fulfills = (logsCount || 0) >= ach.requirement_value; break;
      case "logs_words": fulfills = totalWords >= ach.requirement_value; break;
      case "projects_added": fulfills = (projectsAdded || 0) >= ach.requirement_value; break;
      case "projects_completed": fulfills = (projectsCompleted || 0) >= ach.requirement_value; break;
      case "roadmaps_enrolled": fulfills = (roadmapsEnrolled || 0) >= ach.requirement_value; break;
      case "roadmaps_completed": fulfills = (roadmapsCompleted || 0) >= ach.requirement_value; break; // Approximation
      case "nodes_completed": fulfills = (nodesCompleted || 0) >= ach.requirement_value; break;
      case "skills_tracked": fulfills = skillsTracked >= ach.requirement_value; break;
      case "skill_max_level": fulfills = maxSkillLevel >= ach.requirement_value; break;
      case "special_night_owl": fulfills = nightOwl; break;
      case "special_early_bird": fulfills = earlyBird; break;
      case "special_marathon": fulfills = marathon; break;
      case "special_deep_focus": fulfills = deepFocus; break;
    }

    if (fulfills) {
      newUnlockIds.push(ach.id);
    }
  }

  if (newUnlockIds.length > 0) {
    const { data: persistedIds, error } = await supabase.rpc("award_achievements_atomic", {
      p_user_id: userId,
      p_achievement_ids: newUnlockIds,
    });

    if (error) {
      throw error;
    }

    const insertedIds = new Set((persistedIds as string[] | null) || []);
    const unlockedAchievements = achievements.filter((a) => insertedIds.has(a.id));
    return { newUnlocks: unlockedAchievements };
  }

  return { newUnlocks: [] };
}
