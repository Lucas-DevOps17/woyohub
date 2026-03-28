import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel } from "@/types";

export default async function AchievementsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: allAchs } = await supabase.from("achievements").select("*").order("category");
  const { data: userAchs } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id);

  const level = calculateLevel(profile?.total_xp || 0);
  const unlockedIds = new Set((userAchs || []).map((a: any) => a.achievement_id));
  const achievements = allAchs || [];
  const unlocked = achievements.filter((a: any) => unlockedIds.has(a.id));
  const locked = achievements.filter((a: any) => !unlockedIds.has(a.id));

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)] mb-6 lg:mb-8" style={{ letterSpacing: -1 }}>Achievements</h1>

        {/* Unlocked */}
        <p className="text-[13px] font-bold tracking-[1.5px] uppercase mb-4" style={{ color: "var(--outline)" }}>
          Unlocked ({unlocked.length})
        </p>
        {unlocked.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-8 lg:mb-10">
            {unlocked.map((a: any) => (
              <div key={a.id} className="rounded-3xl p-6 text-center" style={{ background: "var(--surface-card)" }}>
                <span className="text-[40px] block mb-3">{a.icon}</span>
                <p className="font-display text-base font-extrabold text-[var(--on-surface)]">{a.title}</p>
                <p className="text-xs mt-1.5" style={{ color: "var(--outline)" }}>{a.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-10 text-center mb-8 lg:mb-10" style={{ background: "var(--surface-card)" }}>
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Complete courses and projects to unlock achievements.</p>
          </div>
        )}

        {/* Locked */}
        <p className="text-[13px] font-bold tracking-[1.5px] uppercase mb-4" style={{ color: "var(--outline)" }}>
          Locked ({locked.length})
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {locked.map((a: any) => (
            <div key={a.id} className="rounded-3xl p-6 text-center opacity-45" style={{ border: "2px dashed var(--outline-variant)" }}>
              <span className="text-[40px] block mb-3 grayscale">{a.icon}</span>
              <p className="font-display text-base font-bold" style={{ color: "var(--outline)" }}>{a.title}</p>
              <p className="text-xs mt-1.5" style={{ color: "var(--outline)" }}>{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
