import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isCover = formData.get("isCover") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const projectId = params.id;

    // Verify project belongs to user
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const ext = file.name.split('.').pop() || "png";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${user.id}/${projectId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("project-images")
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("project-images")
      .getPublicUrl(filePath);

    // If making this cover, unset other covers
    if (isCover) {
      await supabase
        .from("project_images")
        .update({ is_cover: false })
        .eq("project_id", projectId);
    }

    // Insert to DB
    const { data: imageRecord, error: dbError } = await supabase
      .from("project_images")
      .insert({
        project_id: projectId,
        image_url: publicUrl,
        is_cover: isCover,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ image: imageRecord });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
