import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Set this roadmap as the user's only active enrollment.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roadmapId = params.id;

  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("id, user_id")
    .eq("id", roadmapId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (roadmapError || !roadmap) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const { error: deactivateError } = await supabase
    .from("user_roadmaps")
    .update({ is_active: false })
    .eq("user_id", user.id);

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .maybeSingle();

  if (existing) {
    const { error: updError } = await supabase
      .from("user_roadmaps")
      .update({ is_active: true, completed_at: null })
      .eq("id", existing.id);

    if (updError) {
      return NextResponse.json({ error: updError.message }, { status: 400 });
    }
  } else {
    const { error: insError } = await supabase.from("user_roadmaps").insert({
      user_id: user.id,
      roadmap_id: roadmapId,
      is_active: true,
      completed_at: null,
    });

    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
