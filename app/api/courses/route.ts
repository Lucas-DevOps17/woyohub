import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const { title, platform, total_units, status, skill_id } = json;

    const { data: course, error } = await supabase.from("courses").insert({
      user_id: user.id,
      title,
      platform,
      total_units: total_units || 1,
      completed_units: 0,
      status: status || "active",
      skill_id: skill_id || null,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, course });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
