import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateLevel, xpForNextLevel } from "@/types";
import { TopBar } from "@/components/layout/top-bar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function getData() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, coursesRes, skillsRes, achievementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("courses").select("*, skill:skills(name, icon)").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("user_skills").select("*, skill:skills(name, icon, category)").eq("user_id", user.id).order("xp", { ascending: false }).limit(3),
    supabase.from("user_achievements").select("*, achievement:achievements(title, description, icon)").eq("user_id", user.id).order("unlocked_at", { ascending: false }).limit(3),
  ]);

  return {
    profile: profileRes.data,
    courses: coursesRes.data || [],
    skills: skillsRes.data || [],
    achievements: achievementsRes.data || [],
  };
}

export default async function DashboardPage() {
  const data = await getData();
  if (!data?.profile) {
    return <div className="flex items-center justify-center min-h-screen" style={{ color: "var(--outline)" }}>Loading...</div>;
  }

  const { profile, courses, skills, achievements } = data;
  const level = calculateLevel(profile.total_xp);
  const nextXp = xpForNextLevel(level);
  const xpPct = Math.round((profile.total_xp % 100) / 100 * 100);
  const activeCourses = courses.filter((c: any) => c.status === "active");

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
        />
      </div>
    </>
  );
}
