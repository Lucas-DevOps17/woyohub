import { SupabaseClient } from "@supabase/supabase-js";
import { calculateSkillLevel } from "./progression";

export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<{ newUnlocks: any[] }> {
  // 1. Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, current_streak, longest_streak")
    .eq("id", userId)
    .single();

  if (!profile) return { newUnlocks: [] };

  // 2. Get course & project counts
  const { count: completedCourses } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { count: completedProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { count: lessonsCompleted } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    // In a real join we'd make sure it belongs to user, but since courses have user_id,
    // let's do a quick xp_logs check instead for 'lesson' since counting lessons with join is complex
    .eq("completed", true);
  // Actually, let's count lesson xp logs
  const { count: lessonXpLogs } = await supabase
    .from("xp_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source_type", "lesson");

  // 3. Get skills leveled up
  const { data: skills } = await supabase
    .from("user_skills")
    .select("level")
    .eq("user_id", userId)
    .gt("level", 0);
  const leveledSkillsCount = skills?.length || 0;

  // 4. Get all achievements
  const { data: achievements } = await supabase.from("achievements").select("*");
  if (!achievements) return { newUnlocks: [] };

  // 5. Get already unlocked achievements
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  const unlockedIds = new Set(unlocked?.map(a => a.achievement_id) || []);

  const newUnlocks: any[] = [];

  // 6. Evaluate milestones
  for (const ach of achievements) {
    if (unlockedIds.has(ach.id)) continue;

    let fulfills = false;
    switch (ach.requirement_type) {
      case "lessons_completed":
        fulfills = (lessonXpLogs || 0) >= ach.requirement_value;
        break;
      case "courses_completed":
        fulfills = (completedCourses || 0) >= ach.requirement_value;
        break;
      case "projects_completed":
        fulfills = (completedProjects || 0) >= ach.requirement_value;
        break;
      case "streak_days":
        fulfills = profile.longest_streak >= ach.requirement_value;
        break;
      case "total_xp":
        fulfills = profile.total_xp >= ach.requirement_value;
        break;
      case "skills_leveled":
        fulfills = leveledSkillsCount >= ach.requirement_value;
        break;
    }

    if (fulfills) {
      newUnlocks.push({
        user_id: userId,
        achievement_id: ach.id,
      });
    }
  }

  // 7. Insert new unlocks
  if (newUnlocks.length > 0) {
    await supabase.from("user_achievements").insert(newUnlocks);
    
    // Also award the XP rewards seamlessly!
    let bonusXp = 0;
    for (const u of newUnlocks) {
      const ach = achievements.find(a => a.id === u.achievement_id);
      if (ach && ach.xp_reward > 0) {
        bonusXp += ach.xp_reward;
        // Insert log
        await supabase.from("xp_logs").insert({
          user_id: userId,
          source_type: "achievement",
          source_id: ach.id,
          amount: ach.xp_reward,
        });
      }
    }

    if (bonusXp > 0) {
       await supabase.rpc("increment_user_xp", {
         p_user_id: userId,
         p_xp_amount: bonusXp,
       });
    }
    
    // We return the actual achievement objects for the toast
    const unlockedAchievements = achievements.filter(a => newUnlocks.some(u => u.achievement_id === a.id));
    return { newUnlocks: unlockedAchievements };
  }

  return { newUnlocks: [] };
}
