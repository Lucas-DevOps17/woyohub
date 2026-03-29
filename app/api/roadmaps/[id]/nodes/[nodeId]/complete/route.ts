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

  const result = await setRoadmapNodeCompletionState(
    supabase,
    user.id,
    params.nodeId,
    completed
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, xp_awarded: result.xpAwarded ?? 0 });
}
