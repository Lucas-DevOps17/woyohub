import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const imageId = params.imageId;

  try {
    // 1. Verify project ownership and image exists
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const { data: imageRec } = await supabase
      .from("project_images")
      .select("*")
      .eq("id", imageId)
      .eq("project_id", projectId)
      .single();

    if (!imageRec) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Extract file path from URL
    // Format: .../bucketName/userId/projectId/uuid.png
    // e.g. https://xyz.supabase.co/storage/v1/object/public/project-images/user_id/proj_id/123.png
    const urlParts = imageRec.image_url.split("project-images/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      
      // 2. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("project-images")
        .remove([filePath]);
        
      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete from DB even if storage delete fails
      }
    }

    // 3. Delete from DB
    const { error: dbError } = await supabase
      .from("project_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
