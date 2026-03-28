import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { awardLessonXP } from "@/lib/progression";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lessonId, courseId } = await request.json();

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "lessonId and courseId are required" },
        { status: 400 }
      );
    }

    const result = await awardLessonXP(supabase, user.id, lessonId, courseId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        xpAwarded: result.xpAwarded,
        message: "Lesson completed!"
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Lesson completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
