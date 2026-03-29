import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const icon = typeof body.icon === "string" ? body.icon.trim() || null : null;
    const category = typeof body.category === "string" ? body.category.trim() || "custom" : "custom";
    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;

    if (!name) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }

    const { data: skill, error } = await supabase
      .from("skills")
      .insert({
        user_id: user.id,
        name,
        icon,
        category,
        description,
      })
      .select("*")
      .single();

    if (error || !skill) {
      return NextResponse.json({ error: error?.message ?? "Failed to create skill" }, { status: 400 });
    }

    await supabase.from("user_skills").upsert(
      {
        user_id: user.id,
        skill_id: skill.id,
        xp: 0,
        level: 0,
      },
      { onConflict: "user_id,skill_id" }
    );

    return NextResponse.json({ skill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Invalid request" }, { status: 400 });
  }
}
