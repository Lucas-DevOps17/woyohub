import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel } from "@/types";

export default async function RoadmapsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: roadmaps } = await supabase.from("roadmaps").select("*").order("title");
  const { data: userRoadmaps } = await supabase.from("user_roadmaps").select("roadmap_id").eq("user_id", user!.id);

  const level = calculateLevel(profile?.total_xp || 0);
  const all = roadmaps || [];
  const activeIds = (userRoadmaps || []).map((r: any) => r.roadmap_id);

  const colors = ["#0049db", "#4355b9", "#f43f5e", "#8b5cf6"];

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)] mb-6 lg:mb-8" style={{ letterSpacing: -1 }}>Career Roadmaps</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {all.map((r: any, i: number) => {
            const color = colors[i % colors.length];
            const isActive = activeIds.includes(r.id);
            return (
              <div key={r.id} className="rounded-3xl overflow-hidden" style={{ background: "var(--surface-card)" }}>
                <div style={{ height: 8, background: `linear-gradient(90deg,${color},${color}66)`, width: isActive ? "30%" : "0%", borderRadius: "0 4px 4px 0" }} />
                <div className="p-6 lg:p-8">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3 className="font-display text-xl lg:text-2xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.3 }}>{r.title}</h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full capitalize shrink-0" style={{ background: r.difficulty === "beginner" ? "var(--tertiary-container, #e6f7ee)" : "var(--surface-low)", color: r.difficulty === "beginner" ? "var(--tertiary)" : "var(--primary)" }}>
                      {r.difficulty}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--on-surface-variant)" }}>{r.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px]" style={{ color: "var(--outline)" }}>{r.estimated_hours ? `${r.estimated_hours} hours` : "Self-paced"}</span>
                    <button className="px-6 py-2.5 rounded-full text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg,${color},${color}cc)`, boxShadow: `0 6px 20px ${color}30` }}>
                      {isActive ? "Continue" : "Start"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
