import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Progress: graph mode (roadmap_nodes + user completion) if nodes exist;
 * else legacy roadmap_skills vs user_skills levels.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roadmapId = params.id;

  const { data: nodesRaw } = await supabase
    .from("roadmap_nodes")
    .select("id, title, description, skill_id, x, y, skill:skills!roadmap_nodes_skill_id_fkey(name, icon), node_skills:roadmap_node_skills(skill_id, skill:skills(name, icon))")
    .eq("roadmap_id", roadmapId)
    .order("y", { ascending: true })
    .order("x", { ascending: true });

  const nodesList = nodesRaw ?? [];

  if (nodesList.length > 0) {
    const nodeIds = nodesList.map((n) => n.id);
    const { data: states } = await supabase
      .from("user_roadmap_node_state")
      .select("node_id, completed")
      .eq("user_id", user.id)
      .in("node_id", nodeIds);

    const stateMap = new Map((states ?? []).map((s) => [s.node_id, s.completed]));

    const nodes = nodesList.map((n) => {
      const skillData = Array.isArray(n.skill) ? n.skill[0] : n.skill;
      const completed = stateMap.get(n.id) ?? false;
      return {
        node_id: n.id,
        title: n.title,
        description: n.description,
        skill_id: n.skill_id,
        name: skillData?.name ?? n.title,
        icon: skillData?.icon ?? "",
        x: n.x,
        y: n.y,
        completed,
        progress: completed ? 100 : 0,
      };
    });

    const completedCount = nodes.filter((n) => n.completed).length;
    const overallProgress = Math.round((completedCount / nodes.length) * 100);

    const { data: edges } = await supabase
      .from("roadmap_edges")
      .select("source_id, target_id")
      .eq("roadmap_id", roadmapId);

    // Dependencies mapping
    const dependencies = new Map<string, string[]>(); // target -> array of sources
    for (const e of edges ?? []) {
      if (!dependencies.has(e.target_id)) {
        dependencies.set(e.target_id, []);
      }
      dependencies.get(e.target_id)!.push(e.source_id);
    }

    // A node is available if it is incomplete AND all its sources are completed
    const availableNodes = nodes.filter((n) => {
      if (n.completed) return false;
      const deps = dependencies.get(n.node_id) || [];
      return deps.every((depId) => stateMap.get(depId) === true); // completed
    });

    const nextIncomplete = availableNodes.sort((a, b) => a.y - b.y || a.x - b.x)[0] || 
                           nodes.filter((n) => !n.completed).sort((a, b) => a.y - b.y || a.x - b.x)[0];


    return NextResponse.json({
      mode: "graph",
      progress: overallProgress,
      total_skills: nodes.length,
      completed_skills: completedCount,
      nodes,
      skills: [],
      next_action: nextIncomplete
        ? {
            node_id: nextIncomplete.node_id,
            skill_id: nextIncomplete.skill_id,
            name: nextIncomplete.title,
            icon: nextIncomplete.icon,
            user_level: nextIncomplete.completed ? 1 : 0,
            required_level: 1,
          }
        : null,
    });
  }

  const { data: roadmapSkills } = await supabase
    .from("roadmap_skills")
    .select("skill_id, required_level, skill:skills(name, icon)")
    .eq("roadmap_id", roadmapId)
    .order("order_index");

  if (!roadmapSkills || roadmapSkills.length === 0) {
    return NextResponse.json({
      mode: "skills",
      progress: 0,
      skills: [],
      nodes: [],
      total_skills: 0,
      completed_skills: 0,
      next_action: null,
    });
  }

  const skillIds = roadmapSkills.map((rs) => rs.skill_id);
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select("skill_id, level, xp")
    .eq("user_id", user.id)
    .in("skill_id", skillIds);

  const userSkillMap = new Map(
    (userSkills || []).map((us) => [us.skill_id, { level: us.level, xp: us.xp }])
  );

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

  const nextAction = skillProgress
    .filter((s) => s.progress < 100)
    .sort((a, b) => a.progress - b.progress)[0];

  return NextResponse.json({
    mode: "skills",
    progress: overallProgress,
    total_skills: roadmapSkills.length,
    completed_skills: skillProgress.filter((s) => s.progress === 100).length,
    skills: skillProgress,
    nodes: [],
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
