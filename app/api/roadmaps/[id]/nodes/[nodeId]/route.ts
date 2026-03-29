import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function assertOwnerOwnsRoadmap(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  roadmapId: string
) {
  const { data } = await supabase
    .from("roadmaps")
    .select("user_id")
    .eq("id", roadmapId)
    .maybeSingle();
  return data?.user_id === userId;
}

export async function PATCH(
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

  const ok = await assertOwnerOwnsRoadmap(supabase, user.id, params.id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: node } = await supabase
    .from("roadmap_nodes")
    .select("id, roadmap_id")
    .eq("id", params.nodeId)
    .maybeSingle();

  if (!node || node.roadmap_id !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    patch.title = t;
  }
  if (body.description !== undefined) {
    if (body.description === null) {
      patch.description = null;
    } else if (typeof body.description === "string") {
      patch.description = body.description.trim() || null;
    }
  }
  if (typeof body.x === "number" && Number.isFinite(body.x)) patch.x = body.x;
  if (typeof body.y === "number" && Number.isFinite(body.y)) patch.y = body.y;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("roadmap_nodes").update(patch).eq("id", params.nodeId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Handle skills update
  let skillIds: string[] = [];
  if (Array.isArray(body.skills)) {
    skillIds = body.skills.filter((id) => typeof id === "string" && id.length > 0);
  }

  // Handle new skill creation
  if (typeof body.new_skill_name === "string" && body.new_skill_name.trim()) {
    const { data: insertedSkill, error: skillInsertError } = await supabase
      .from("skills")
      .insert({
        name: body.new_skill_name.trim(),
        icon: typeof body.new_skill_icon === "string" ? body.new_skill_icon.trim() || null : null,
        category: "Custom",
      })
      .select("id")
      .single();

    if (skillInsertError) {
      return NextResponse.json({ error: "Failed to create new skill" }, { status: 400 });
    }
    if (insertedSkill) {
      skillIds.push(insertedSkill.id);
    }
  }

  if (Array.isArray(body.skills) || typeof body.new_skill_name === "string") {
    // Delete existing skills
    const { error: deleteError } = await supabase
      .from("roadmap_node_skills")
      .delete()
      .eq("node_id", params.nodeId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    if (skillIds.length > 0) {
      const { error: insertError } = await supabase.from("roadmap_node_skills").insert(
        skillIds.map((skillId) => ({
          node_id: params.nodeId,
          skill_id: skillId,
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
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

  const ok = await assertOwnerOwnsRoadmap(supabase, user.id, params.id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: node } = await supabase
    .from("roadmap_nodes")
    .select("id, roadmap_id")
    .eq("id", params.nodeId)
    .maybeSingle();

  if (!node || node.roadmap_id !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("roadmap_nodes").delete().eq("id", params.nodeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
