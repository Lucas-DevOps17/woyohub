import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateLevel, xpForNextLevel } from "@/types";
import { TopBar } from "@/components/layout/top-bar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get today's date range for XP calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const [
    profileRes,
    coursesRes,
    skillsRes,
    achievementsRes,
    xpLogsRes,
    userRoadmapsRes,
    recentActivityRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("courses").select("*, skill:skills(name, icon)").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("user_skills").select("*, skill:skills(name, icon, category)").eq("user_id", user.id).order("xp", { ascending: false }).limit(3),
    supabase.from("user_achievements").select("*, achievement:achievements(title, description, icon)").eq("user_id", user.id).order("unlocked_at", { ascending: false }).limit(3),
    supabase.from("xp_logs").select("*").eq("user_id", user.id).gte("created_at", todayStr).order("created_at", { ascending: false }),
    supabase.from("user_roadmaps").select("*, roadmap:roadmaps(title, icon, difficulty)").eq("user_id", user.id).eq("is_active", true).limit(1),
    supabase.from("xp_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return {
    profile: profileRes.data,
    courses: coursesRes.data || [],
    skills: skillsRes.data || [],
    achievements: achievementsRes.data || [],
    todayXpLogs: xpLogsRes.data || [],
    userRoadmap: userRoadmapsRes.data?.[0] || null,
    recentActivity: recentActivityRes.data || [],
  };
}

export default async function DashboardPage() {
  const data = await getData();
  if (!data?.profile) {
    return <div className="flex items-center justify-center min-h-screen" style={{ color: "var(--outline)" }}>Loading...</div>;
  }

  const { profile, courses, skills, achievements, todayXpLogs, userRoadmap, recentActivity } = data;
  const level = calculateLevel(profile.total_xp);
  const nextXp = xpForNextLevel(level);
  const xpPct = Math.round((profile.total_xp % 100) / 100 * 100);
  const activeCourses = courses.filter((c: any) => c.status === "active");
  const todayXp = todayXpLogs.reduce((sum, log) => sum + log.amount, 0);

  return (
    <>
      <TopBar
        displayName={profile.display_name || "Learner"}
        level={level}
        streak={profile.current_streak}
        rank="Pro Scholar"
      />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto">
        <DashboardClient
          profile={profile}
          level={level}
          xpPct={xpPct}
          nextXp={nextXp}
          activeCourses={activeCourses}
          skills={skills}
          achievements={achievements}
          todayXp={todayXp}
          userRoadmap={userRoadmap}
          recentActivity={recentActivity}
        />
      </div>
    </>
  );
}
