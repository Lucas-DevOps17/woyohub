import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

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
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string") updates.description = body.description.trim() || null;
    if (typeof body.location === "string") updates.location = body.location.trim() || null;
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.timezone === "string") updates.timezone = body.timezone.trim() || "UTC";

    const startsAt = body.starts_at === undefined ? undefined : normalizeDate(body.starts_at);
    const endsAt = body.ends_at === undefined ? undefined : normalizeDate(body.ends_at);

    if (body.starts_at !== undefined && !startsAt) {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }
    if (body.ends_at !== undefined && !endsAt) {
      return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
    }

    if (startsAt) updates.starts_at = startsAt;
    if (endsAt) updates.ends_at = endsAt;

    const { data, error } = await supabase
      .from("study_sessions")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ session: data });
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
    .from("study_sessions")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
