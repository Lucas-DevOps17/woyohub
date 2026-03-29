import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { setRoadmapNodeCompletionState } from "@/lib/progression";

export async function POST(
  request: Request,
  { params }: { params: { id: string; nodeId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: node } = await supabase
    .from("roadmap_nodes")
    .select("id, roadmap_id, skill_id")
    .eq("id", params.nodeId)
    .maybeSingle();

  if (!node || node.roadmap_id !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const completed = Boolean(body.completed);

  let result = await setRoadmapNodeCompletionState(
    supabase,
    user.id,
    params.nodeId,
    completed
  );

  if (!result.success) {
    const { data: previous } = await supabase
      .from("user_roadmap_node_state")
      .select("completed")
      .eq("user_id", user.id)
      .eq("node_id", params.nodeId)
      .maybeSingle();

    const wasCompleted = previous?.completed ?? false;

    const { error: stateError } = await supabase.from("user_roadmap_node_state").upsert(
      {
        user_id: user.id,
        node_id: params.nodeId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,node_id" }
    );

    if (stateError) {
      return NextResponse.json({ error: stateError.message }, { status: 400 });
    }

    let xpAwarded = 0;
    const { data: nodeSkills } = await supabase
      .from("roadmap_node_skills")
      .select("skill_id")
      .eq("node_id", params.nodeId);

    if (completed && !wasCompleted) {
      const primarySkillId = nodeSkills?.[0]?.skill_id ?? null;
      await supabase.from("xp_logs").upsert(
        {
          user_id: user.id,
          source_type: "roadmap_node",
          source_id: params.nodeId,
          amount: 10,
          skill_id: primarySkillId,
        },
        { onConflict: "id" }
      );
      xpAwarded = 10;
    } else if (!completed && wasCompleted) {
      await supabase
        .from("xp_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("source_type", "roadmap_node")
        .eq("source_id", params.nodeId);
    }

    const { error: recomputeError } = await supabase.rpc("recompute_user_xp", {
      p_user_id: user.id,
    });

    if (recomputeError) {
      return NextResponse.json({ error: recomputeError.message }, { status: 400 });
    }

    result = { success: true, xpAwarded };
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, xp_awarded: result.xpAwarded ?? 0 });
}
