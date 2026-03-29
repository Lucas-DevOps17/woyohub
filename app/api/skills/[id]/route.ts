import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      .update({
        name,
        icon,
        category,
        description,
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !skill) {
      return NextResponse.json({ error: error?.message ?? "Failed to update skill" }, { status: 400 });
    }

    return NextResponse.json({ skill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Invalid request" }, { status: 400 });
  }
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

  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.rpc("recompute_user_xp", { p_user_id: user.id });

  return NextResponse.json({ success: true });
}
