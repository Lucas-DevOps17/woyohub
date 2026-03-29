import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { awardRoadmapNodeCompletionXP } from "@/lib/progression";

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

  const { data: previous } = await supabase
    .from("user_roadmap_node_state")
    .select("completed")
    .eq("user_id", user.id)
    .eq("node_id", params.nodeId)
    .maybeSingle();

  const wasCompleted = previous?.completed ?? false;

  const { error: upsertError } = await supabase.from("user_roadmap_node_state").upsert(
    {
      user_id: user.id,
      node_id: params.nodeId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,node_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  let xpAwarded = 0;
  if (completed && !wasCompleted) {
    const xpRes = await awardRoadmapNodeCompletionXP(supabase, user.id, params.nodeId);
    if (xpRes.success && xpRes.xpAwarded) {
      xpAwarded = xpRes.xpAwarded;
    }
  } else if (!completed && wasCompleted) {
    // If we're unchecking a completed node, recompute the XP source of truth!
    const { error: rpcError } = await supabase.rpc("recompute_user_xp", { p_user_id: user.id });
    if (rpcError) {
      console.error("Failed to recompute XP:", rpcError);
    }
  }

  return NextResponse.json({ success: true, xp_awarded: xpAwarded });
}
