import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: connection }, { count: upcomingStudySessions }] = await Promise.all([
    supabase
      .from("google_calendar_connections")
      .select("email, sync_enabled, updated_at, calendar_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("study_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled"),
  ]);

  const googleClientConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    connected: Boolean(connection),
    googleClientConfigured,
    connection: connection
      ? {
          email: connection.email,
          syncEnabled: connection.sync_enabled,
          updatedAt: connection.updated_at,
          calendarId: connection.calendar_id,
        }
      : null,
    upcomingStudySessions: upcomingStudySessions ?? 0,
  });
}
