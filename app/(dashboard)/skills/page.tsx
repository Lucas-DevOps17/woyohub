import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { calculateLevel } from "@/types";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: userSkills } = await supabase.from("user_skills").select("*, skill:skills(name, icon, category)").eq("user_id", user!.id).order("xp", { ascending: false });
  const { data: allSkills } = await supabase.from("skills").select("*").order("category");

  const level = calculateLevel(profile?.total_xp || 0);
  const skills = userSkills || [];
  const available = allSkills || [];

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)] mb-6 lg:mb-8" style={{ letterSpacing: -1 }}>Skill Tree</h1>

        {skills.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {skills.map((s: any) => (
              <div key={s.id} className="rounded-3xl p-5 lg:p-7 flex flex-col items-center text-center gap-2.5" style={{ background: "var(--surface-card)" }}>
                <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl" style={{ background: "var(--surface-low)" }}>{s.skill?.icon || "⭐"}</div>
                <h3 className="font-display text-lg font-extrabold text-[var(--on-surface)]">{s.skill?.name}</h3>
                <p className="text-xs" style={{ color: "var(--outline)" }}>{s.skill?.category} · Level {s.level}</p>
                <span className="font-display text-3xl font-extrabold text-[var(--on-surface)]">{s.xp}</span>
                <div className="w-full"><GradBar pct={s.xp % 100} h={6} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm mb-6" style={{ color: "var(--on-surface-variant)" }}>You haven't leveled up any skills yet. Here are all available skills:</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              {available.map((s: any) => (
                <div key={s.id} className="rounded-3xl p-5 lg:p-7 flex flex-col items-center text-center gap-2.5 opacity-60" style={{ background: "var(--surface-card)" }}>
                  <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl" style={{ background: "var(--surface-low)" }}>{s.icon || "⭐"}</div>
                  <h3 className="font-display text-lg font-extrabold text-[var(--on-surface)]">{s.name}</h3>
                  <p className="text-xs" style={{ color: "var(--outline)" }}>{s.category}</p>
                  <span className="font-display text-3xl font-extrabold" style={{ color: "var(--outline)" }}>0</span>
                  <div className="w-full"><GradBar pct={0} h={6} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
