"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { calculateLevel, type UserProfile } from "@/types";
import { getProgressPercentage } from "@/lib/utils";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

type SkillTag = { id: string; name: string; icon: string | null };

type LearningLog = {
  id: string;
  course_id: string;
  content: string;
  units_completed: number;
  created_at: string;
  skills: SkillTag[];
};

type Course = {
  id: string;
  title: string;
  platform: string;
  url: string | null;
  total_units: number;
  completed_units: number;
  status: string;
  skill: { name: string; icon: string | null } | null;
};

export default function CoursesPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<Record<string, LearningLog[]>>({});
  const [allSkills, setAllSkills] = useState<SkillTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Which course's form is open
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  // Which course's full log list is expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields (reset on each openForm)
  const [units, setUnits] = useState(1);
  const [summary, setSummary] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillIcon, setNewSkillIcon] = useState("");
  const [showNewSkill, setShowNewSkill] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, coursesRes, logsRes, skillsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("courses")
        .select("*, skill:skills(name, icon)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("learning_logs")
        .select(
          "id, course_id, content, units_completed, created_at, learning_log_skills(skill:skills(id, name, icon))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("skills").select("id, name, icon").order("name"),
    ]);

    setProfile(profileRes.data);
    setAllSkills(skillsRes.data || []);

    // Normalize courses — Supabase join returns array for skill
    const normalizedCourses = (coursesRes.data || []).map((c: any) => ({
      ...c,
      skill: Array.isArray(c.skill) ? c.skill[0] ?? null : c.skill,
    })) as Course[];
    setCourses(normalizedCourses);

    // Group logs by course_id, normalize nested skill joins
    const grouped: Record<string, LearningLog[]> = {};
    for (const log of logsRes.data || []) {
      const skills = ((log.learning_log_skills as any[]) || [])
        .map((lls: any) => {
          const s = Array.isArray(lls.skill) ? lls.skill[0] : lls.skill;
          return s ? ({ id: s.id, name: s.name, icon: s.icon } as SkillTag) : null;
        })
        .filter((s): s is SkillTag => s !== null);

      const entry: LearningLog = {
        id: log.id,
        course_id: log.course_id,
        content: log.content,
        units_completed: log.units_completed ?? 0,
        created_at: log.created_at,
        skills,
      };

      if (!grouped[log.course_id]) grouped[log.course_id] = [];
      grouped[log.course_id].push(entry);
    }
    setLogs(grouped);
    setLoading(false);
  }

  function openForm(courseId: string, remaining: number) {
    setOpenFormId(courseId);
    setUnits(Math.min(1, remaining));
    setSummary("");
    setSelectedSkills([]);
    setNewSkillName("");
    setNewSkillIcon("");
    setShowNewSkill(false);
    setFormError(null);
  }

  function closeForm() {
    setOpenFormId(null);
    setFormError(null);
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  async function handleSubmit(courseId: string) {
    if (!summary.trim()) {
      setFormError("Please write what you learned.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const res = await fetch(`/api/courses/${courseId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        units_completed: units,
        summary,
        skill_ids: selectedSkills,
        new_skill_name: newSkillName.trim() || undefined,
        new_skill_icon: newSkillIcon.trim() || undefined,
      }),
    });

    const json = await res.json();

    if (json.error) {
      setFormError(json.error);
      setSubmitting(false);
      return;
    }

    // Reload to get fresh data (new log + updated course progress)
    await loadData();
    closeForm();
    setSubmitting(false);
  }

  const level = calculateLevel(profile?.total_xp || 0);

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--outline)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <TopBar
        displayName={profile?.display_name || "Learner"}
        level={level}
        streak={profile?.current_streak || 0}
      />
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <h1
            className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]"
            style={{ letterSpacing: -1 }}
          >
            All Courses
          </h1>
          <Link
            href="/courses/new"
            className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline"
          >
            + Add Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div
            className="rounded-3xl p-16 text-center"
            style={{ background: "var(--surface-card)" }}
          >
            <p className="text-5xl mb-4">📚</p>
            <h3 className="font-display text-xl font-bold text-[var(--on-surface)]">
              No courses yet
            </h3>
            <p className="text-sm mt-2" style={{ color: "var(--on-surface-variant)" }}>
              Start tracking your learning by adding a course.
            </p>
            <Link
              href="/courses/new"
              className="inline-block mt-6 px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline"
            >
              Add Your First Course
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {courses.map((c) => {
              const pct = getProgressPercentage(c.completed_units, c.total_units);
              const remaining = c.total_units - c.completed_units;
              const courseLogs = logs[c.id] || [];
              const isFormOpen = openFormId === c.id;
              const isExpanded = expandedId === c.id;
              const previewLogs = isExpanded ? courseLogs : courseLogs.slice(0, 3);

              return (
                <div
                  key={c.id}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: "var(--surface-card)" }}
                >
                  {/* Dark gradient header */}
                  <div className="card-dark-gradient h-[100px] lg:h-[130px] relative flex items-end p-4">
                    <span
                      className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide"
                      style={{ background: "var(--primary)" }}
                    >
                      {c.platform?.toUpperCase()}
                    </span>
                    {pct === 100 && (
                      <span
                        className="absolute top-4 right-4 text-[11px] font-bold px-3.5 py-1 rounded-lg"
                        style={{ color: "#62ff96", background: "rgba(0,102,49,0.3)" }}
                      >
                        COMPLETED
                      </span>
                    )}
                  </div>

                  {/* Course info + progress */}
                  <div className="px-5 lg:px-7 pt-5 pb-5">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <h3
                        className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)]"
                        style={{ letterSpacing: -0.3 }}
                      >
                        {c.title}
                      </h3>
                      {remaining > 0 && !isFormOpen && (
                        <button
                          onClick={() => openForm(c.id, remaining)}
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white btn-primary"
                        >
                          <Plus size={14} />
                          Add Lessons
                        </button>
                      )}
                      {isFormOpen && (
                        <button
                          onClick={closeForm}
                          className="shrink-0 p-2 rounded-full"
                          style={{
                            color: "var(--outline)",
                            background: "var(--surface-low)",
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                      {c.completed_units} of {c.total_units} units
                      {c.skill ? ` · ${c.skill.icon ?? ""} ${c.skill.name}` : ""}
                    </p>

                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex-1">
                        <GradBar pct={pct} h={6} variant={pct === 100 ? "tertiary" : "primary"} />
                      </div>
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: pct === 100 ? "var(--tertiary)" : "var(--outline)" }}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* ── Log Form ── */}
                    {isFormOpen && (
                      <div
                        className="mb-5 p-5 rounded-2xl"
                        style={{ background: "var(--surface-low)" }}
                      >
                        <p
                          className="text-[11px] font-bold tracking-[1.5px] uppercase mb-4"
                          style={{ color: "var(--outline)" }}
                        >
                          Log Progress
                        </p>

                        {formError && (
                          <div
                            className="mb-3 p-3 rounded-xl text-sm"
                            style={{ color: "var(--error)", background: "#fef2f2" }}
                          >
                            {formError}
                          </div>
                        )}

                        <div className="flex flex-col gap-4">
                          {/* Units */}
                          <div>
                            <label
                              className="text-xs font-semibold block mb-1.5"
                              style={{ color: "var(--on-surface-variant)" }}
                            >
                              Units completed{" "}
                              <span className="font-normal opacity-60">
                                (max {remaining})
                              </span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={remaining}
                              value={units}
                              onChange={(e) =>
                                setUnits(
                                  Math.max(
                                    1,
                                    Math.min(remaining, parseInt(e.target.value) || 1)
                                  )
                                )
                              }
                              className="w-28 px-4 py-2.5 rounded-[12px] text-[15px] outline-none"
                              style={{
                                background: "var(--surface-card)",
                                color: "var(--on-surface)",
                                border: "none",
                              }}
                            />
                          </div>

                          {/* Summary */}
                          <div>
                            <label
                              className="text-xs font-semibold block mb-1.5"
                              style={{ color: "var(--on-surface-variant)" }}
                            >
                              What did you learn?
                            </label>
                            <textarea
                              value={summary}
                              onChange={(e) => setSummary(e.target.value)}
                              rows={3}
                              placeholder="Covered X, Y, Z concepts..."
                              className="w-full px-4 py-3 rounded-[12px] text-[15px] outline-none"
                              style={{
                                background: "var(--surface-card)",
                                color: "var(--on-surface)",
                                border: "none",
                                resize: "vertical",
                              }}
                            />
                          </div>

                          {/* Skills */}
                          {allSkills.length > 0 && (
                            <div>
                              <label
                                className="text-xs font-semibold block mb-2"
                                style={{ color: "var(--on-surface-variant)" }}
                              >
                                Skills practiced
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {allSkills.map((skill) => (
                                  <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill.id)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                                    style={{
                                      background: selectedSkills.includes(skill.id)
                                        ? "var(--primary)"
                                        : "var(--surface-card)",
                                      color: selectedSkills.includes(skill.id)
                                        ? "white"
                                        : "var(--outline)",
                                    }}
                                  >
                                    {skill.icon} {skill.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* New skill toggle */}
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowNewSkill((v) => !v)}
                              className="text-xs font-semibold"
                              style={{ color: "var(--primary)" }}
                            >
                              {showNewSkill ? "− Hide new skill" : "+ Add new skill"}
                            </button>
                            {showNewSkill && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={newSkillIcon}
                                  onChange={(e) => setNewSkillIcon(e.target.value)}
                                  placeholder="🔷"
                                  maxLength={2}
                                  className="w-14 px-3 py-2 rounded-[12px] text-center outline-none"
                                  style={{
                                    background: "var(--surface-card)",
                                    color: "var(--on-surface)",
                                    border: "none",
                                  }}
                                />
                                <input
                                  type="text"
                                  value={newSkillName}
                                  onChange={(e) => setNewSkillName(e.target.value)}
                                  placeholder="Skill name"
                                  className="flex-1 px-4 py-2 rounded-[12px] text-[15px] outline-none"
                                  style={{
                                    background: "var(--surface-card)",
                                    color: "var(--on-surface)",
                                    border: "none",
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleSubmit(c.id)}
                            disabled={submitting || !summary.trim()}
                            className="py-3 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? "Saving..." : "Save +10 XP"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Learning Logs ── */}
                    {courseLogs.length > 0 && (
                      <div>
                        <p
                          className="text-[11px] font-bold tracking-[1.5px] uppercase mb-3"
                          style={{ color: "var(--outline)" }}
                        >
                          Learning Log
                        </p>
                        <div className="flex flex-col gap-2">
                          {previewLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-4 rounded-2xl"
                              style={{ background: "var(--surface-low)" }}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "var(--on-surface-variant)" }}
                                >
                                  {new Date(log.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <span
                                  className="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0"
                                  style={{
                                    background: "var(--primary-dim, #e8f0fe)",
                                    color: "var(--primary)",
                                  }}
                                >
                                  +{log.units_completed} unit
                                  {log.units_completed !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <p
                                className="text-sm leading-relaxed mb-2"
                                style={{ color: "var(--on-surface)" }}
                              >
                                {log.content}
                              </p>
                              {log.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {log.skills.map((s) => (
                                    <span
                                      key={s.id}
                                      className="text-xs px-2.5 py-1 rounded-full"
                                      style={{
                                        background: "var(--surface-card)",
                                        color: "var(--outline)",
                                      }}
                                    >
                                      {s.icon} {s.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {courseLogs.length > 3 && (
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : c.id)
                            }
                            className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: "var(--outline)" }}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={14} /> Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} /> Show{" "}
                                {courseLogs.length - 3} more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
