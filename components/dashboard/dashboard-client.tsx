"use client";

import { useState, useEffect } from "react";
import { GradBar } from "@/components/ui/grad-bar";
import {
  getProgressPercentage,
  formatRelativeTime,
  getRecentDateKeys,
  getTodayDateKey,
  shiftDateKey,
} from "@/lib/utils";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  profile: any;
  level: number;
  xpPct: number;
  nextXp: number;
  activeCourses: any[];
  skills: any[];
  achievements: any[];
  todayXp: number;
  userRoadmap: any;
  recentActivity: any[];
};

type RoadmapProgress = {
  mode?: "graph" | "skills";
  progress: number;
  total_skills: number;
  completed_skills: number;
  skills: Array<{
    skill_id: string;
    name: string;
    icon: string;
    required_level: number;
    user_level: number;
    user_xp: number;
    progress: number;
  }>;
  nodes?: Array<{
    node_id: string;
    title: string;
    name: string;
    icon: string;
    completed: boolean;
    progress: number;
  }>;
  next_action: {
    node_id?: string;
    skill_id: string | null;
    name: string;
    icon: string;
    user_level: number;
    required_level: number;
  } | null;
};

import { toast } from "sonner";

export function DashboardClient({
  profile,
  level,
  xpPct,
  nextXp,
  activeCourses,
  skills,
  achievements,
  todayXp,
  userRoadmap,
  recentActivity,
}: Props) {
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgress | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const getStreakDays = () => {
    const todayKey = getTodayDateKey();
    const weekKeys = getRecentDateKeys(todayKey, 7);
    const activeKeys = new Set<string>();
    const lastActivityKey = profile.last_activity_date || null;

    if (lastActivityKey) {
      const streakLength = Math.max(0, Number(profile.current_streak) || 0);
      const streakEndKey = todayXp > 0 ? todayKey : lastActivityKey;
      const isRecentEnough =
        streakEndKey === todayKey || streakEndKey === shiftDateKey(todayKey, -1);

      if (isRecentEnough && streakLength > 0) {
        for (let index = 0; index < streakLength; index++) {
          activeKeys.add(shiftDateKey(streakEndKey, -index));
        }
      } else {
        activeKeys.add(lastActivityKey);
      }
    }

    if (todayXp > 0) {
      activeKeys.add(todayKey);
    }

    return weekKeys.map((dateKey) => activeKeys.has(dateKey));
  };

  const streakDays = getStreakDays();

  // Fetch real roadmap progress on mount
  useEffect(() => {
    if (!userRoadmap?.roadmap_id) return;

    setRoadmapLoading(true);
    fetch(`/api/roadmaps/${userRoadmap.roadmap_id}/progress`)
      .then((r) => r.json())
      .then((data) => {
        setRoadmapProgress(data);
        setRoadmapLoading(false);
      })
      .catch(() => setRoadmapLoading(false));
  }, [userRoadmap?.roadmap_id]);

  // Award daily login XP on mount
  useEffect(() => {
    fetch("/api/daily-login", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.xpAwarded > 0) {
          toast.success(data.message, { icon: "🔥" });
        }
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          data.unlockedAchievements.forEach((ach: any) => {
            toast.success(`Achievement Unlocked: ${ach.title}`, {
              description: ach.description,
              icon: ach.icon || "🏆",
            });
          });
        }
      })
      .catch(console.error);
  }, []);

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
              {todayXp > 0 ? `+${todayXp} XP today - keep it up!` : "Start learning to earn XP today"}
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

      {/* ── Row: Roadmap + Streak Tracker ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-7">
        {/* Roadmap Progress */}
        <div>
          {!userRoadmap ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "var(--surface-card)" }}>
              <p className="text-4xl mb-4">🗺️</p>
              <h3 className="font-display text-lg font-bold text-[var(--on-surface)]">No roadmap selected</h3>
              <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>Choose a career path to track your progress.</p>
              <a href="/roadmaps" className="inline-block mt-4 px-6 py-3 rounded-full text-sm font-bold text-white btn-primary">Browse Roadmaps</a>
            </div>
          ) : roadmapLoading ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "var(--surface-card)" }}>
              <p className="text-sm" style={{ color: "var(--outline)" }}>Loading roadmap progress...</p>
            </div>
          ) : roadmapProgress ? (
            <>
              <div className="flex justify-between items-center mb-4 lg:mb-6 flex-wrap gap-2">
                <h2 className="font-display text-xl lg:text-[28px] font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>
                  {userRoadmap.roadmap?.icon || "🎯"} {userRoadmap.roadmap?.title}
                </h2>
                <span className="text-[13px] font-bold px-4 py-1.5 rounded-full" style={{ color: "var(--tertiary)", background: "var(--tertiary-container, #e6f7ee)" }}>
                  {roadmapProgress.progress}% COMPLETE
                </span>
              </div>
              {roadmapProgress.mode === "graph" && (roadmapProgress.nodes?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {roadmapProgress.nodes!.slice(0, 6).map((n) => (
                    <div key={n.node_id} className="rounded-[20px] p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
                      <p className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: "var(--outline)" }}>
                        {n.icon ? `${n.icon} ` : ""}
                        {n.title}
                      </p>
                      {n.name !== n.title ? (
                        <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
                          {n.icon ? `${n.icon} ` : ""}
                          {n.name}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2.5 mt-3">
                        <div className="flex-1">
                          <GradBar pct={n.progress} h={8} variant={n.completed ? "tertiary" : "primary"} />
                        </div>
                        {n.completed ? (
                          <span className="text-lg" style={{ color: "var(--tertiary)" }}>✓</span>
                        ) : (
                          <span className="text-[13px] font-semibold" style={{ color: "var(--outline)" }}>{n.progress}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : roadmapProgress.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {roadmapProgress.skills.slice(0, 6).map((s) => (
                    <div key={s.skill_id} className="rounded-[20px] p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
                      <p className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: "var(--outline)" }}>
                        {s.icon} {s.name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
                        Lv.{s.user_level} / {s.required_level}
                      </p>
                      <div className="flex items-center gap-2.5 mt-3">
                        <div className="flex-1">
                          <GradBar pct={s.progress} h={8} variant={s.progress === 100 ? "tertiary" : "primary"} />
                        </div>
                        {s.progress === 100 ? (
                          <span className="text-lg" style={{ color: "var(--tertiary)" }}>✓</span>
                        ) : (
                          <span className="text-[13px] font-semibold" style={{ color: "var(--outline)" }}>{s.progress}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--outline)" }}>No skills or workflow nodes on this roadmap yet.</p>
              )}
              {roadmapProgress.next_action && (
                <div className="mt-4 p-4 rounded-2xl" style={{ background: "var(--primary-dim, #e8f0fe)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {roadmapProgress.mode === "graph" ? (
                      <>Next: {roadmapProgress.next_action.icon ? `${roadmapProgress.next_action.icon} ` : null}{roadmapProgress.next_action.name}</>
                    ) : (
                      <>Next: Level up {roadmapProgress.next_action.icon} {roadmapProgress.next_action.name} (Lv.{roadmapProgress.next_action.user_level} → {roadmapProgress.next_action.required_level})</>
                    )}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 lg:mb-6 flex-wrap gap-2">
                <h2 className="font-display text-xl lg:text-[28px] font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -0.5 }}>
                  {userRoadmap.roadmap?.icon || "🎯"} {userRoadmap.roadmap?.title}
                </h2>
                <span className="text-[13px] font-bold px-4 py-1.5 rounded-full" style={{ color: "var(--tertiary)", background: "var(--tertiary-container, #e6f7ee)" }}>
                  0% COMPLETE
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--outline)" }}>Start learning to track your roadmap progress.</p>
            </>
          )}
        </div>

        {/* Streak Tracker */}
        <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
          <h3 className="font-display text-xl font-extrabold text-[var(--on-surface)] flex items-center gap-2">
            <span className="text-xl">🔥</span> Streak Tracker
          </h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display text-[var(--on-surface)]">{profile.current_streak}</span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>day streak</span>
          </div>
          {profile.longest_streak > profile.current_streak && (
            <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
              Best: {profile.longest_streak} days
            </p>
          )}
          <div className="flex justify-between my-5">
            {WEEK.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--outline)" }}>{d}</span>
                <div
                  className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all ${
                    streakDays[i] ? "scale-105" : ""
                  }`}
                  style={{
                    background: streakDays[i] ? "var(--tertiary)" : "var(--surface-low)",
                    boxShadow: streakDays[i] ? "0 4px 12px rgba(0,102,49,0.3)" : "none",
                  }}
                >
                  {streakDays[i] ? (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--outline-variant)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {profile.last_activity_date && (
            <p className="text-xs text-center" style={{ color: "var(--outline)" }}>
              Last activity: {formatRelativeTime(profile.last_activity_date)}
            </p>
          )}
          {profile.current_streak >= 7 && (
            <div className="mt-4 px-3 py-2 rounded-xl text-center" style={{ background: "var(--tertiary-container, #e6f7ee)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--tertiary)" }}>🔥 On fire! Keep it going!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row: Active Courses + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-7">
        <div>
          <h2 className="font-display text-xl lg:text-[28px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.5 }}>
            Active Courses
          </h2>
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
                      <span className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide" style={{ background: "var(--primary)" }}>
                        {c.platform?.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-5 lg:p-7">
                      <h3 className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)] leading-tight" style={{ letterSpacing: -0.3 }}>
                        {c.title}
                      </h3>
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

        {/* Right sidebar: Recent Activity */}
        <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
          <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.3 }}>
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-3">📝</p>
              <p className="text-sm" style={{ color: "var(--outline)" }}>Your learning journey begins here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentActivity.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: log.source_type === "lesson" ? "var(--primary-dim, #e8f0fe)" :
                                 log.source_type === "course" ? "var(--tertiary-container, #e6f7ee)" :
                                 log.source_type === "achievement" ? "#fef7e0" :
                                 "var(--surface-low)",
                    }}
                  >
                    {log.source_type === "lesson" ? "📖" :
                     log.source_type === "course" ? "📚" :
                     log.source_type === "achievement" ? "🏆" :
                     log.source_type === "daily_login" ? "📅" : "✨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--on-surface)] truncate">
                      {log.source_type === "lesson" ? "Lesson completed" :
                       log.source_type === "course" ? "Course progress" :
                       log.source_type === "achievement" ? "Achievement unlocked" :
                       log.source_type === "daily_login" ? "Daily login bonus" : "XP earned"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--outline)" }}>
                      {formatRelativeTime(log.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                    +{log.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar: Skill Tree + Achievements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-7">
        <div />
        <div className="flex flex-col gap-6 lg:gap-7">
          <div className="rounded-3xl p-6 lg:p-7" style={{ background: "var(--surface-card)" }}>
            <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.3 }}>
              Skill Tree
            </h3>
            {skills.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--outline)" }}>Complete courses to level up skills.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {skills.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center text-lg"
                      style={{ background: "var(--primary-dim, #e8f0fe)" }}
                    >
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
            <h3 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] mb-5" style={{ letterSpacing: -0.3 }}>
              Achievements
            </h3>
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
      <a
        href="/courses"
        className="fixed bottom-5 lg:bottom-8 left-4 lg:left-[252px] z-10 px-8 py-3.5 rounded-full text-[15px] font-bold text-white btn-primary shadow-float no-underline"
      >
        Start Learning
      </a>
    </div>
  );
}
