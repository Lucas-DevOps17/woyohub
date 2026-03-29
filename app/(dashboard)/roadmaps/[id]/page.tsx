import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel } from "@/types";
import {
  RoadmapWorkflowCanvas,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/components/roadmaps/roadmap-workflow-canvas";

function normalizeSkillJoin(
  skill: unknown
): { name: string; icon: string | null } | null {
  if (!skill) return null;
  const row = Array.isArray(skill) ? skill[0] : skill;
  if (!row || typeof row !== "object") return null;
  const s = row as { name?: string; icon?: string | null };
  if (!s.name) return null;
  return { name: s.name, icon: s.icon ?? null };
}

export default async function RoadmapDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!roadmap) {
    notFound();
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: skills } = await supabase.from("skills").select("id, name, icon, category").order("name");

  const { data: nodeRows } = await supabase
    .from("roadmap_nodes")
    .select("id, title, description, skill_id, x, y, skill:skills(name, icon)")
    .eq("roadmap_id", params.id)
    .order("y", { ascending: true })
    .order("x", { ascending: true });

  const { data: edgeRows } = await supabase
    .from("roadmap_edges")
    .select("id, source_node_id, target_node_id")
    .eq("roadmap_id", params.id);

  const ids = (nodeRows ?? []).map((n) => n.id);
  let states: { node_id: string; completed: boolean }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("user_roadmap_node_state")
      .select("node_id, completed")
      .eq("user_id", user.id)
      .in("node_id", ids);
    states = data ?? [];
  }
  const stateMap = new Map(states.map((s) => [s.node_id, s.completed]));

  const initialNodes: WorkflowNode[] = (nodeRows ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    skill_id: n.skill_id,
    x: n.x,
    y: n.y,
    completed: stateMap.get(n.id) ?? false,
    skill: normalizeSkillJoin(n.skill),
  }));

  const initialEdges: WorkflowEdge[] = (edgeRows ?? []).map((e) => ({
    id: e.id,
    source_node_id: e.source_node_id,
    target_node_id: e.target_node_id,
  }));

  const ownerId = (roadmap as { user_id?: string | null }).user_id ?? null;
  const isOwner = ownerId === user.id;
  const level = calculateLevel(profile?.total_xp || 0);

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <RoadmapWorkflowCanvas
        roadmapId={roadmap.id}
        roadmapTitle={roadmap.title}
        isOwner={isOwner}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        skills={skills ?? []}
      />
    </>
  );
}
