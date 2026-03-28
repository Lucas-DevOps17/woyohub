import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { getProgressPercentage } from "@/lib/utils";
import { calculateLevel } from "@/types";
import Link from "next/link";

export default async function CoursesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: courses } = await supabase.from("courses").select("*, skill:skills(name, icon)").eq("user_id", user!.id).order("updated_at", { ascending: false });

  const level = calculateLevel(profile?.total_xp || 0);
  const all = courses || [];

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -1 }}>All Courses</h1>
          <Link href="/courses/new" className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline">+ Add Course</Link>
        </div>
        {all.length === 0 ? (
          <div className="rounded-3xl p-16 text-center" style={{ background: "var(--surface-card)" }}>
            <p className="text-5xl mb-4">📚</p>
            <h3 className="font-display text-xl font-bold text-[var(--on-surface)]">No courses yet</h3>
            <p className="text-sm mt-2" style={{ color: "var(--on-surface-variant)" }}>Start tracking your learning by adding a course.</p>
            <Link href="/courses/new" className="inline-block mt-6 px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline">Add Your First Course</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {all.map((c: any) => {
              const pct = getProgressPercentage(c.completed_units, c.total_units);
              return (
                <Link key={c.id} href={`/courses/${c.id}`} className="rounded-3xl overflow-hidden no-underline block hover:shadow-lg transition-shadow" style={{ background: "var(--surface-card)" }}>
                  <div className="card-dark-gradient h-[120px] lg:h-[160px] relative flex items-end p-4">
                    <span className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide" style={{ background: "var(--primary)" }}>{c.platform?.toUpperCase()}</span>
                    {pct === 100 && <span className="absolute top-4 right-4 text-[11px] font-bold px-3.5 py-1 rounded-lg" style={{ color: "#62ff96", background: "rgba(0,102,49,0.3)" }}>COMPLETED</span>}
                  </div>
                  <div className="p-5 lg:p-7">
                    <h3 className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.3 }}>{c.title}</h3>
                    <p className="text-sm mt-2 mb-5 leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{c.completed_units} of {c.total_units} units · {c.skill?.name || "General"}</p>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1"><GradBar pct={pct} h={6} variant={pct === 100 ? "tertiary" : "primary"} /></div>
                      <span className="text-[13px] font-semibold" style={{ color: pct === 100 ? "var(--tertiary)" : "var(--outline)" }}>{pct}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
