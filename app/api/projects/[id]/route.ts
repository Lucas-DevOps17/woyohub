import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET single project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*, project_skills(skill_id)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

// PUT update project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, status, github_url, demo_url, skill_ids } = body;

  // Update project
  const { error: updateError } = await supabase
    .from("projects")
    .update({
      title,
      description,
      status,
      github_url,
      demo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Update skills if provided
  if (Array.isArray(skill_ids)) {
    // Delete existing skills
    await supabase.from("project_skills").delete().eq("project_id", params.id);

    // Insert new skills
    if (skill_ids.length > 0) {
      const { error: skillsError } = await supabase.from("project_skills").insert(
        skill_ids.map((skillId) => ({
          project_id: params.id,
          skill_id: skillId,
        }))
      );

      if (skillsError) {
        return NextResponse.json({ error: skillsError.message }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
