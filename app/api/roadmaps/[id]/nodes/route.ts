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
  const selectedSkillIds = Array.isArray(body.skills)
    ? body.skills.filter((skillId): skillId is string => typeof skillId === "string" && skillId.length > 0)
    : [];
  const { data: ownedSkills } = selectedSkillIds.length
    ? await supabase
        .from("skills")
        .select("id")
        .eq("user_id", user.id)
        .in("id", selectedSkillIds)
    : { data: [] as { id: string }[] };
  const ownedSkillIds = new Set((ownedSkills || []).map((skill) => skill.id));
  const safeSkillIds = selectedSkillIds.filter((skillId) => ownedSkillIds.has(skillId));
  const x = typeof body.x === "number" && Number.isFinite(body.x) ? body.x : 0;
  const y = typeof body.y === "number" && Number.isFinite(body.y) ? body.y : 0;

  const { data: node, error } = await supabase
    .from("roadmap_nodes")
    .insert({
      roadmap_id: params.id,
      title,
      description,
      skill_id: safeSkillIds[0] ?? null,
      x,
      y,
    })
    .select("*")
    .single();

  if (error || !node) {
    return NextResponse.json({ error: error?.message ?? "Failed to create node" }, { status: 400 });
  }

  const skillIds = [...safeSkillIds];

  if (typeof body.new_skill_name === "string" && body.new_skill_name.trim()) {
    const { data: createdSkill } = await supabase
      .from("skills")
      .insert({
        user_id: user.id,
        name: body.new_skill_name.trim(),
        icon: typeof body.new_skill_icon === "string" ? body.new_skill_icon.trim() || null : null,
        category: "custom",
      })
      .select("id, name, icon")
      .single();

    if (createdSkill) {
      skillIds.push(createdSkill.id);
      await supabase.from("user_skills").upsert(
        { user_id: user.id, skill_id: createdSkill.id, xp: 0, level: 0 },
        { onConflict: "user_id,skill_id" }
      );
    }
  }

  if (skillIds.length > 0) {
    await supabase.from("roadmap_node_skills").insert(
      skillIds.map((skillId) => ({
        node_id: node.id,
        skill_id: skillId,
      }))
    );
  }

  const { data: skillRows } = await supabase
    .from("roadmap_node_skills")
    .select("skill_id, skill:skills(name, icon)")
    .eq("node_id", node.id);

  // Include default properties for the new node so ReactFlow renders it correctly.
  return NextResponse.json({ 
    ...node, 
    completed: false, 
    skill: null,
    node_skills: skillRows ?? []
  });
}
