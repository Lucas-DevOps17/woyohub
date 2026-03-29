import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeSkills(skills: unknown): { skill_id: string; required_level: number }[] {
  if (!Array.isArray(skills)) return [];
  const map = new Map<string, { skill_id: string; required_level: number }>();
  for (const item of skills) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const skill_id = typeof raw.skill_id === "string" ? raw.skill_id : "";
    const rl = Math.max(1, Number.parseInt(String(raw.required_level ?? 1), 10) || 1);
    if (skill_id) {
      map.set(skill_id, { skill_id, required_level: rl });
    }
  }
  return Array.from(map.values());
}

export async function PUT(
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

  const { data: existing } = await supabase
    .from("roadmaps")
    .select("id, user_id")
    .eq("id", params.id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
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
  const skills = normalizeSkills(body.skills);

  const { error: updateError } = await supabase
    .from("roadmaps")
    .update({
      title,
      description,
    })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { error: delError } = await supabase.from("roadmap_skills").delete().eq("roadmap_id", params.id);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 400 });
  }

  if (skills.length > 0) {
    const { error: skillsError } = await supabase.from("roadmap_skills").insert(
      skills.map((s, order_index) => ({
        roadmap_id: params.id,
        skill_id: s.skill_id,
        required_level: s.required_level,
        order_index,
      }))
    );

    if (skillsError) {
      return NextResponse.json({ error: skillsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
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

  const { data: owned } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const { error } = await supabase.from("roadmaps").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
