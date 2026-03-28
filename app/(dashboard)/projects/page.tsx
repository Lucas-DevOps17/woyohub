import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { calculateLevel } from "@/types";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: projects } = await supabase.from("projects").select("*, project_skills(skill:skills(name))").eq("user_id", user!.id).order("updated_at", { ascending: false });

  const level = calculateLevel(profile?.total_xp || 0);
  const all = projects || [];

  const statusColors: Record<string, { bg: string; color: string }> = {
    completed: { bg: "var(--tertiary-container, #e6f7ee)", color: "var(--tertiary)" },
    "in-progress": { bg: "var(--primary-dim, #e8f0fe)", color: "var(--primary)" },
    planned: { bg: "var(--surface-low)", color: "var(--outline)" },
  };

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -1 }}>Projects</h1>
          <Link href="/projects/new" className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline">+ New Project</Link>
        </div>
        {all.length === 0 ? (
          <div className="rounded-3xl p-16 text-center" style={{ background: "var(--surface-card)" }}>
            <p className="text-5xl mb-4">🔨</p>
            <h3 className="font-display text-xl font-bold text-[var(--on-surface)]">No projects yet</h3>
            <p className="text-sm mt-2" style={{ color: "var(--on-surface-variant)" }}>Showcase your work by adding your first project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {all.map((p: any) => {
              const st = statusColors[p.status] || statusColors.planned;
              const skills = (p.project_skills || []).map((ps: any) => ps.skill?.name).filter(Boolean);
              return (
                <div key={p.id} className="rounded-3xl overflow-hidden" style={{ background: "var(--surface-card)" }}>
                  <div className="card-dark-gradient h-[100px] flex items-center justify-center">
                    <span className="text-3xl opacity-30">{p.status === "completed" ? "✓" : p.status === "in-progress" ? "⚙" : "📋"}</span>
                  </div>
                  <div className="p-5 lg:p-7">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)]">{p.title}</h3>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{p.status}</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--on-surface-variant)" }}>{p.description}</p>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s: string) => (
                          <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "var(--surface-low)", color: "var(--outline)" }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
