import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel } from "@/types";
import { RoadmapsClient } from "@/components/roadmaps/roadmaps-client";

export default async function RoadmapsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", user.id)
    .order("title");
  const { data: userRoadmaps } = await supabase
    .from("user_roadmaps")
    .select("roadmap_id, is_active")
    .eq("user_id", user.id);

  const roadmapIds = (roadmaps ?? []).map((r) => r.id);
  type RsRow = {
    roadmap_id: string;
    skill_id: string;
    required_level: number;
    order_index: number;
  };
  let rsRows: RsRow[] = [];
  if (roadmapIds.length > 0) {
    const { data } = await supabase
      .from("roadmap_skills")
      .select("roadmap_id, skill_id, required_level, order_index")
      .in("roadmap_id", roadmapIds)
      .order("order_index");
    rsRows = data ?? [];
  }

  const skillsByRoadmap: Record<string, { skill_id: string; required_level: number }[]> = {};
  for (const row of rsRows) {
    if (!skillsByRoadmap[row.roadmap_id]) skillsByRoadmap[row.roadmap_id] = [];
    skillsByRoadmap[row.roadmap_id].push({
      skill_id: row.skill_id,
      required_level: row.required_level,
    });
  }

  const { data: customSkills } = await supabase
    .from("skills")
    .select("id, name, icon, category")
    .eq("user_id", user.id)
    .order("name");
  const skills = customSkills ?? [];

  const activeRoadmapId =
    (userRoadmaps ?? []).find((ur: { is_active: boolean }) => ur.is_active)?.roadmap_id ?? null;
  const enrolledRoadmapIds = (userRoadmaps ?? []).map((ur: { roadmap_id: string }) => ur.roadmap_id);

  const level = calculateLevel(profile?.total_xp || 0);

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <RoadmapsClient
        roadmaps={(roadmaps ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          icon: r.icon,
          difficulty: r.difficulty,
          estimated_hours: r.estimated_hours,
          user_id: (r as { user_id?: string | null }).user_id ?? null,
        }))}
        skills={skills}
        skillsByRoadmap={skillsByRoadmap}
        activeRoadmapId={activeRoadmapId}
        enrolledRoadmapIds={enrolledRoadmapIds}
        userId={user.id}
      />
    </>
  );
}
