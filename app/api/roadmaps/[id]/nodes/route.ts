import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("id, user_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!roadmap || roadmap.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const description =
    typeof body.description === "string" ? body.description.trim() || null : null;
  const skill_id =
    typeof body.skill_id === "string" && body.skill_id ? body.skill_id : null;
  const x = typeof body.x === "number" && Number.isFinite(body.x) ? body.x : 0;
  const y = typeof body.y === "number" && Number.isFinite(body.y) ? body.y : 0;

  const { data: node, error } = await supabase
    .from("roadmap_nodes")
    .insert({
      roadmap_id: params.id,
      title,
      description,
      skill_id,
      x,
      y,
    })
    .select("*")
    .single();

  if (error || !node) {
    return NextResponse.json({ error: error?.message ?? "Failed to create node" }, { status: 400 });
  }

  // Include default properties for the new node so ReactFlow renders it correctly.
  return NextResponse.json({ 
    ...node, 
    completed: false, 
    skill: null,
    node_skills: []
  });
}
