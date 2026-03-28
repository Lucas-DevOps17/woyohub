import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { awardDailyLoginXP } from "@/lib/progression";

/**
 * Award daily login XP if this is the user's first activity of the day.
 * Call this on dashboard load or after successful login.
 */
export async function POST() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await awardDailyLoginXP(supabase, user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        xpAwarded: result.xpAwarded,
        isStreakDay: result.isStreakDay,
        message: result.xpAwarded! > 0 ? `Daily login: +${result.xpAwarded} XP!` : "Already logged in today",
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Daily login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET returns current streak info without awarding XP
 */
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_activity_date, total_xp")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    current_streak: profile?.current_streak || 0,
    longest_streak: profile?.longest_streak || 0,
    last_activity: profile?.last_activity_date,
    total_xp: profile?.total_xp || 0,
  });
}
