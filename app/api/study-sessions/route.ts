import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    const startsAt = normalizeDate(body.starts_at);
    const endsAt = normalizeDate(body.ends_at);
    const timezone = typeof body.timezone === "string" ? body.timezone.trim() || "UTC" : "UTC";
    const location = typeof body.location === "string" ? body.location.trim() || null : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

    if (!title || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        title,
        description,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone,
        location,
        notes,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Invalid request" }, { status: 400 });
  }
}
