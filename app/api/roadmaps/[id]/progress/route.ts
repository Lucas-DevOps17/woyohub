import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Calculate roadmap progress based on skill levels.
 * progress = SUM(LEAST(user_level / required_level, 1)) / COUNT(skills) * 100
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roadmapId = params.id;

  // Get all skills required for this roadmap with their required levels
  const { data: roadmapSkills } = await supabase
    .from("roadmap_skills")
    .select("skill_id, required_level, skill:skills(name, icon)")
    .eq("roadmap_id", roadmapId)
    .order("order_index");

  if (!roadmapSkills || roadmapSkills.length === 0) {
    return NextResponse.json({ progress: 0, skills: [] });
  }

  // Get user's current levels for these skills
  const skillIds = roadmapSkills.map((rs) => rs.skill_id);
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select("skill_id, level, xp")
    .eq("user_id", user.id)
    .in("skill_id", skillIds);

  const userSkillMap = new Map(
    (userSkills || []).map((us) => [us.skill_id, { level: us.level, xp: us.xp }])
  );

  // Calculate progress per skill
  let totalProgress = 0;
  const skillProgress = roadmapSkills.map((rs) => {
    const userSkill = userSkillMap.get(rs.skill_id);
    const userLevel = userSkill?.level || 0;
    const progress = Math.min(userLevel / rs.required_level, 1);
    totalProgress += progress;

    const skillData = Array.isArray(rs.skill) ? rs.skill[0] : rs.skill;
    return {
      skill_id: rs.skill_id,
      name: skillData?.name || "Unknown",
      icon: skillData?.icon || "",
      required_level: rs.required_level,
      user_level: userLevel,
      user_xp: userSkill?.xp || 0,
      progress: Math.round(progress * 100),
    };
  });

  const overallProgress = Math.round((totalProgress / roadmapSkills.length) * 100);

  // Find next recommended action (skill with lowest progress that's not maxed)
  const nextAction = skillProgress
    .filter((s) => s.progress < 100)
    .sort((a, b) => a.progress - b.progress)[0];

  return NextResponse.json({
    progress: overallProgress,
    total_skills: roadmapSkills.length,
    completed_skills: skillProgress.filter((s) => s.progress === 100).length,
    skills: skillProgress,
    next_action: nextAction
      ? {
          skill_id: nextAction.skill_id,
          name: nextAction.name,
          icon: nextAction.icon,
          user_level: nextAction.user_level,
          required_level: nextAction.required_level,
        }
      : null,
  });
}
