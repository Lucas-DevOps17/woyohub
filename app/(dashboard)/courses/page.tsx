"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { calculateLevel, type UserProfile } from "@/types";
import { getProgressPercentage } from "@/lib/utils";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, X, Edit2, Trash2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
  skill_id: string | null;
  skill: { name: string; icon: string | null; id: string | null } | null;
};

export default function CoursesPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<Record<string, LearningLog[]>>({});
  const [allSkills, setAllSkills] = useState<SkillTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms visibility state
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Edit Log State
  const [editingLog, setEditingLog] = useState<string | null>(null);

  // Edit Course State
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState<{title: string, platform: string, total_units: number, status: string}>({ title: "", platform: "", total_units: 1, status: "active" });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // General Log Form (New/Edit)
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
        .select("*, skill:skills(id, name, icon)")
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

    const normalizedCourses = (coursesRes.data || []).map((c: any) => ({
      ...c,
      skill: Array.isArray(c.skill) ? c.skill[0] ?? null : c.skill,
    })) as Course[];
    setCourses(normalizedCourses);

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

  // --- LOG ACTIONS ---
  function openForm(courseId: string, remaining: number) {
    setOpenFormId(courseId);
    setEditingLog(null);
    setUnits(Math.max(1, Math.min(1, remaining)));
    setSummary("");
    setSelectedSkills([]);
    setNewSkillName("");
    setNewSkillIcon("");
    setShowNewSkill(false);
    setFormError(null);
  }

  function openEditLogForm(log: LearningLog, maxUnitsAllowed: number) {
    setEditingLog(log.id);
    setOpenFormId(log.course_id);
    setUnits(log.units_completed);
    setSummary(log.content);
    setSelectedSkills(log.skills.map(s => s.id));
    setNewSkillName("");
    setNewSkillIcon("");
    setShowNewSkill(false);
    setFormError(null);
  }

  function closeForm() {
    setOpenFormId(null);
    setEditingLog(null);
    setFormError(null);
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  async function handleSubmitLog(courseId: string) {
    if (!summary.trim()) {
      setFormError("Please write what you learned.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const endpoint = editingLog ? `/api/logs/${editingLog}` : `/api/courses/${courseId}/log`;
    const method = editingLog ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        units_completed: units,
        summary,
        skill_ids: selectedSkills,
        new_skill_name: newSkillName.trim() || undefined,
        new_skill_icon: newSkillIcon.trim() || undefined,
        // For editing logs, the backend only takes summary/skills/units right now via array mapping if supported,
        // or just skills array of names for easy mapping, wait, api/logs/[id] takes "skills" array of strings natively.
        // Let's pass skills as string names or new ids.
        skills: selectedSkills.map(sid => allSkills.find(s=>s.id === sid)?.name || sid).concat(newSkillName.trim() ? [newSkillName.trim()] : []),
      }),
    });

    const json = await res.json();

    if (json.error) {
      setFormError(json.error);
      setSubmitting(false);
      return;
    }

    if (json.unlockedAchievements?.length) {
      json.unlockedAchievements.forEach((ach: any) => {
        toast.success(`Achievement Unlocked: ${ach.title}`, { icon: ach.icon || "🏆", description: ach.description });
      });
    }

    toast.success(editingLog ? "Log updated!" : "Progress logged successfully!");
    
    await loadData();
    closeForm();
    setSubmitting(false);
  }

  async function handleDeleteLog(logId: string) {
    if (!confirm("Are you sure you want to delete this log? Your XP might decrease.")) return;
    
    const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) {
       toast.error(json.error);
       return;
    }
    toast.success("Log deleted");
    await loadData();
  }

  // --- COURSE ACTIONS ---
  async function handleUpdateCourse(courseId: string) {
    if (!editCourseData.title.trim() || !editCourseData.platform.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editCourseData)
    });
    setSubmitting(false);
    
    if (res.ok) {
      toast.success("Course updated.");
      setEditingCourse(null);
      await loadData();
    } else {
      toast.error("Failed to update course.");
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (!confirm("Are you sure you want to delete this course? All associated logs and XP will be permanently removed.")) return;
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Course deleted.");
      await loadData();
    } else {
      toast.error("Failed to delete course.");
    }
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
            className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline hover-scale press-sink"
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
              className="inline-block mt-6 px-7 py-3 rounded-full text-sm font-bold text-white btn-primary no-underline hover-scale press-sink"
            >
              Add Your First Course
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {courses.map((c) => {
              const pct = getProgressPercentage(c.completed_units, c.total_units);
              // Max units for submitting is the total remaining if NEW list, 
              // BUT if we edit a log, it is (total remaining + this log's existing units)
              const remaining = c.total_units - c.completed_units;
              const courseLogs = logs[c.id] || [];
              const isExpanded = expandedId === c.id;
              const previewLogs = isExpanded ? courseLogs : courseLogs.slice(0, 3);
              const isEditingThisCourse = editingCourse === c.id;

              return (
                <div
                  key={c.id}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: "var(--surface-card)" }}
                >
                  {/* Dark gradient header */}
                  <div className="card-dark-gradient h-[100px] lg:h-[130px] relative flex items-end justify-between p-4">
                    <span
                      className="relative text-[11px] font-bold text-white px-3.5 py-1 rounded-lg tracking-wide"
                      style={{ background: "var(--primary)" }}
                    >
                      {c.platform?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setEditingCourse(isEditingThisCourse ? null : c.id);
                        setEditCourseData({title: c.title, platform: c.platform, total_units: c.total_units, status: c.status});
                      }} className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors hover-scale">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteCourse(c.id)} className="bg-black/30 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors hover-scale">
                        <Trash2 size={16} />
                      </button>
                      {pct === 100 && (
                        <span
                          className="text-[11px] font-bold px-3.5 py-1 rounded-lg"
                          style={{ color: "#62ff96", background: "rgba(0,102,49,0.3)" }}
                        >
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course info + progress */}
                  <div className="px-5 lg:px-7 pt-5 pb-5">
                    {isEditingThisCourse ? (
                       <div className="flex flex-col gap-4 mb-6 bg-blue-50/50 p-4 rounded-2xl dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Edit Course</label>
                          <input type="text" value={editCourseData.title} onChange={e => setEditCourseData(d=>({...d, title: e.target.value}))} className="w-full px-4 py-2.5 rounded-[12px] bg-white border outline-none text-[15px]"/>
                          <div className="flex gap-4">
                            <input type="text" placeholder="Platform" value={editCourseData.platform} onChange={e => setEditCourseData(d=>({...d, platform: e.target.value}))} className="flex-1 px-4 py-2.5 rounded-[12px] bg-white border outline-none text-[15px]"/>
                            <input type="number" min="1" placeholder="Total Units" value={editCourseData.total_units} onChange={e => setEditCourseData(d=>({...d, total_units: parseInt(e.target.value)||1}))} className="w-32 px-4 py-2.5 rounded-[12px] bg-white border outline-none text-[15px]"/>
                            <select value={editCourseData.status} onChange={e => setEditCourseData(d=>({...d, status: e.target.value}))} className="px-4 py-2.5 rounded-[12px] bg-white border outline-none text-[15px]">
                               <option value="active">Active</option>
                               <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                             <button onClick={()=>setEditingCourse(null)} className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-gray-100">Cancel</button>
                             <button disabled={submitting} onClick={()=>handleUpdateCourse(c.id)} className="px-4 py-2 text-sm font-bold text-white btn-primary rounded-full hover-scale">Save</button>
                          </div>
                       </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3 mb-1">
                        <h3
                          className="font-display text-lg lg:text-[22px] font-extrabold text-[var(--on-surface)]"
                          style={{ letterSpacing: -0.3 }}
                        >
                          {c.title}
                        </h3>
                        {remaining > 0 && openFormId !== c.id && (
                          <button
                            onClick={() => openForm(c.id, remaining)}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white btn-primary hover-scale press-sink"
                          >
                            <Plus size={14} />
                            Add Logs
                          </button>
                        )}
                        {openFormId === c.id && !editingLog && (
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
                    )}

                    {!isEditingThisCourse && <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
                      {c.completed_units} of {c.total_units} units
                      {c.skill ? ` · ${c.skill.icon ?? ""} ${c.skill.name}` : ""}
                    </p>}

                    {!isEditingThisCourse && <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex-1">
                        <GradBar pct={pct} h={6} variant={pct === 100 ? "tertiary" : "primary"} />
                      </div>
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: pct === 100 ? "var(--tertiary)" : "var(--outline)" }}
                      >
                        {pct}%
                      </span>
                    </div>}

                    {/* ── Log Form ── */}
                    {openFormId === c.id && (
                      <div
                        className="mb-5 p-5 rounded-2xl"
                        style={{ background: "var(--surface-low)" }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <p
                            className="text-[11px] font-bold tracking-[1.5px] uppercase"
                            style={{ color: "var(--outline)" }}
                          >
                            {editingLog ? "Edit Learning Log" : "Log Progress"}
                          </p>
                          {editingLog && <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>}
                        </div>

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
                            </label>
                            <input
                              type="number"
                              min={1}
                              // if editing, the max is current units + remaining units
                              max={editingLog ? remaining + units : remaining}
                              value={units}
                              onChange={(e) =>
                                setUnits(
                                  Math.max(
                                    1,
                                    Math.min(editingLog ? remaining + units : remaining, parseInt(e.target.value) || 1)
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
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover-scale"
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
                              className="text-xs font-semibold transition"
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
                            onClick={() => handleSubmitLog(c.id)}
                            disabled={submitting || !summary.trim() || units < 1}
                            className="py-3 mt-2 rounded-full text-sm font-bold text-white btn-primary hover-scale press-sink disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? "Saving..." : (editingLog ? "Update Log" : "Save +10 XP")}
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
                          Learning Logs
                        </p>
                        <div className="flex flex-col gap-2">
                          {previewLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-4 rounded-2xl group relative"
                              style={{ background: "var(--surface-low)" }}
                            >
                              {/* Edit / Delete actions on hover */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-[var(--surface-low)] rounded-md shadow-sm border border-[var(--outline-variant)]">
                                <button onClick={()=>openEditLogForm(log, remaining + log.units_completed)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition rounded-l-md"><Edit2 size={13}/></button>
                                <button onClick={()=>handleDeleteLog(log.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 transition rounded-r-md"><Trash2 size={13}/></button>
                              </div>

                              <div className="flex justify-between items-start gap-2 mb-1.5 pr-14">
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
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {log.skills.map((s) => (
                                    <span
                                      key={s.id}
                                      className="text-xs px-2.5 py-1 rounded-full border"
                                      style={{
                                        background: "white",
                                        borderColor: "var(--outline-variant)",
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
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 hover:bg-[var(--surface-low)] rounded-full transition"
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
