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

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  let skills = normalizeSkills(body.skills);

  if (skills.length > 0) {
    const { data: ownedSkills } = await supabase
      .from("skills")
      .select("id")
      .eq("user_id", user.id)
      .in("id", skills.map((skill) => skill.skill_id));

    const ownedSkillIds = new Set((ownedSkills || []).map((skill) => skill.id));
    skills = skills.filter((skill) => ownedSkillIds.has(skill.skill_id));
  }

  const { data: roadmap, error: insertError } = await supabase
    .from("roadmaps")
    .insert({
      title,
      description,
      user_id: user.id,
      icon: "🎯",
      difficulty: "beginner",
      estimated_hours: null,
    })
    .select("id")
    .single();

  if (insertError || !roadmap) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to create roadmap" }, { status: 400 });
  }

  if (skills.length > 0) {
    const { error: skillsError } = await supabase.from("roadmap_skills").insert(
      skills.map((s, order_index) => ({
        roadmap_id: roadmap.id,
        skill_id: s.skill_id,
        required_level: s.required_level,
        order_index,
      }))
    );

    if (skillsError) {
      await supabase.from("roadmaps").delete().eq("id", roadmap.id).eq("user_id", user.id);
      return NextResponse.json({ error: skillsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: roadmap.id });
}
