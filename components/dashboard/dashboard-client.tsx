"use client";

import { useState } from "react";
import { GradBar } from "@/components/ui/grad-bar";
import { getProgressPercentage } from "@/lib/utils";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  profile: any;
  level: number;
  xpPct: number;
  nextXp: number;
  activeCourses: any[];
  skills: any[];
  achievements: any[];
};

export function DashboardClient({ profile, level, xpPct, nextXp, activeCourses, skills, achievements }: Props) {
  const [journal, setJournal] = useState("");

  // Mock streak days for now (will be dynamic later)
  const streakDays = [true, true, true, true, true, true, false];

  return (
    <div className="flex flex-col gap-6 lg:gap-8 animate-fade-in">
      {/* ── Level Hero ── */}
      <div className="hero-gradient rounded-3xl p-7 lg:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-[200px] h-[200px] rounded-full" style={{ background: "rgba(0,73,219,0.08)" }} />
        <div className="absolute -bottom-8 right-20 w-[120px] h-[120px] rounded-full" style={{ background: "rgba(0,102,49,0.06)" }} />
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative z-10">
          <div>
            <h1 className="font-display text-4xl lg:text-[48px] font-extrabold text-white leading-none" style={{ letterSpacing: -1.5 }}>
              Level {level}
            </h1>
            <p className="text-sm lg:text-base mt-2.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              You are in the top 5% of learners this week.
            </p>
          </div>
          <div className="lg:text-right">
            <span className="text-base lg:text-xl font-bold" style={{ color: "#4d9fff" }}>{profile.total_xp.toLocaleString()}</span>
            <span className="text-sm lg:text-base" style={{ color: "rgba(255,255,255,0.35)" }}> / {nextXp.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="mt-5 relative z-10">
          <div className="w-full h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full progress-primary transition-all duration-1000" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Row: Roadmap + Daily Momentum ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-7">
        {/* Roadmap placeholder - will be dynamic from DB */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:mb-6 flex-wrap gap-2">
            <h2 className="font-display text-xl lg:text-[28px] font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>
              Become a Frontend Engineer
            </h2>
            <span className="text-[13px] font-bold px-4 py-1.5 rounded-full" style={{ color: "var(--tertiary)", background: "var(--tertiary-container, #e6f7ee)" }}>
              70% COMPLETE
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {[
              { label: "FOUNDATION", name: "HTML5", pct: 100, variant: "tertiary" as const },
              { label: "STYLING", name: "CSS Grid & Flex", pct: 80, variant: "primary" as const },
              { label: "LOGIC", name: "JavaScript ES6", pct: 40, variant: "primary" as const },
            ].map(s => (
              <div key={s.name} className="rounded-[20px] p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
                <p className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: "var(--outline)" }}>{s.label}</p>
                <h3 className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)] mt-2 mb-4" style={{ letterSpacing: -0.3 }}>{s.name}</h3>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1"><GradBar pct={s.pct} h={8} variant={s.variant} /></div>
                  {s.pct === 100 ? <span className="text-lg" style={{ color: "var(--tertiary)" }}>✓</span> : <span className="text-[13px] font-semibold" style={{ color: "var(--outline)" }}>{s.pct}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Momentum */}
        <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
          <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] flex items-center gap-2">
            <span className="text-xl">⚡</span> Daily Momentum
          </h3>
          <div className="flex justify-between my-5">
            {WEEK.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--outline)" }}>{d}</span>
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: streakDays[i] ? "var(--tertiary)" : "var(--surface-low)" }}>
                  {streakDays[i] ? (
                    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--outline-variant)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold tracking-[1.5px] uppercase mb-3" style={{ color: "var(--outline)" }}>Daily reflection</p>
          <textarea
            value={journal}
            onChange={e => setJournal(e.target.value)}
            placeholder="What did you learn today?"
            className="w-full h-[72px] rounded-[14px] border-none p-4 text-sm resize-none outline-none"
            style={{ background: "var(--surface-low)", color: "var(--on-surface)", fontFamily: "var(--font-body)" }}
          />
          <button className="w-full mt-3 py-3 rounded-full text-sm font-bold transition-all" style={{ color: "var(--primary)", background: "var(--primary-dim, #e8f0fe)" }}>
            Save Entry
          </button>
        </div>
      </div>

      {/* ── Row: Active Courses + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-7">
        <div>
          <h2 className="font-display text-xl lg:text-[28px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.5 }}>Active Courses</h2>
          {activeCourses.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "var(--surface-card)" }}>
              <p className="text-4xl mb-4">📚</p>
              <h3 className="font-display text-lg font-bold text-[var(--on-surface)]">No active courses</h3>
              <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>Add a course to start tracking your progress.</p>
              <a href="/courses" className="inline-block mt-4 px-6 py-3 rounded-full text-sm font-bold text-white btn-primary">Browse Courses</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {activeCourses.slice(0, 4).map((c: any) => {
                const pct = getProgressPercentage(c.completed_units, c.total_units);
                return (
                  <div key={c.id} className="rounded-3xl overflow-hidden" style={{ background: "var(--surface-card)" }}>
                    <div className="card-dark-gradient h-[140px] lg:h-[180px] relative flex items-end p-4">
                      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 40%,rgba(0,73,219,0.12),transparent 70%)" }} />
                      <span className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide" style={{ background: "var(--primary)" }}>{c.platform?.toUpperCase()}</span>
                    </div>
                    <div className="p-5 lg:p-7">
                      <h3 className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)] leading-tight" style={{ letterSpacing: -0.3 }}>{c.title}</h3>
                      <p className="text-sm mt-2 mb-5 leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                        {c.completed_units} of {c.total_units} units completed
                      </p>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="flex-1"><GradBar pct={pct} h={6} variant="primary" /></div>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--outline)" }}>{pct}%</span>
                      </div>
                      <a href={`/courses`} className="block w-full text-center py-3 rounded-[14px] text-sm font-bold transition-all" style={{ border: "1.5px solid var(--outline-variant)", color: "var(--primary)" }}>
                        Continue Learning
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Skill Tree + Achievements */}
        <div className="flex flex-col gap-6 lg:gap-7">
          <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
            <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.3 }}>Skill Tree</h3>
            {skills.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--outline)" }}>Complete courses to level up skills.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {skills.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-lg" style={{ background: "var(--primary-dim, #e8f0fe)" }}>
                      {s.skill?.icon || "⭐"}
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-[var(--on-surface)]">{s.skill?.name}</p>
                      <p className="text-xs" style={{ color: "var(--outline)" }}>Level {s.level}</p>
                    </div>
                    <span className="text-xl font-extrabold font-display text-[var(--on-surface)]">{s.xp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
            <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.3 }}>Achievements</h3>
            {achievements.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--outline)" }}>Your first achievement is just around the corner.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {achievements.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl" style={{ background: "#fef7e0" }}>
                      {a.achievement?.icon || "🏆"}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[var(--on-surface)]">{a.achievement?.title}</p>
                      <p className="text-xs" style={{ color: "var(--outline)" }}>{a.achievement?.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <a href="/courses" className="fixed bottom-5 lg:bottom-8 left-4 lg:left-[252px] z-10 px-8 py-3.5 rounded-full text-[15px] font-bold text-white btn-primary shadow-float no-underline">
        Start Learning
      </a>
    </div>
  );
}
