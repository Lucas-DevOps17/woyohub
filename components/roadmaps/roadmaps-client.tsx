"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { RoadmapFormModal, type RoadmapSkillRow, type SkillOption } from "@/components/roadmaps/roadmap-form-modal";

type RoadmapRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  difficulty: string;
  estimated_hours: number | null;
  user_id: string | null;
};

type ProgressInfo = { progress: number; total_skills: number; mode?: string };

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | {
      open: true;
      mode: "edit";
      id: string;
      title: string;
      description: string | null;
      skills: RoadmapSkillRow[];
    };

const colors = ["#0049db", "#4355b9", "#f43f5e", "#8b5cf6"];

export function RoadmapsClient({
  roadmaps,
  skills,
  skillsByRoadmap,
  activeRoadmapId,
  enrolledRoadmapIds,
  userId,
}: {
  roadmaps: RoadmapRow[];
  skills: SkillOption[];
  skillsByRoadmap: Record<string, RoadmapSkillRow[]>;
  activeRoadmapId: string | null;
  enrolledRoadmapIds: string[];
  userId: string;
}) {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, ProgressInfo>>({});
  const [form, setForm] = useState<FormState>({ open: false });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    const ids = roadmaps.map((r) => r.id);
    if (ids.length === 0) return;
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/roadmaps/${id}/progress`);
          if (!res.ok) return [id, { progress: 0, total_skills: 0 }] as const;
          const data = (await res.json()) as {
            progress?: number;
            total_skills?: number;
            mode?: string;
          };
          return [
            id,
            {
              progress: data.progress ?? 0,
              total_skills: data.total_skills ?? 0,
              mode: data.mode,
            },
          ] as const;
        } catch {
          return [id, { progress: 0, total_skills: 0 }] as const;
        }
      })
    );
    setProgressMap(Object.fromEntries(entries));
  }, [roadmaps]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  function openCreate() {
    setForm({ open: true, mode: "create" });
  }

  function openEdit(r: RoadmapRow) {
    setMenuId(null);
    setForm({
      open: true,
      mode: "edit",
      id: r.id,
      title: r.title,
      description: r.description,
      skills: (skillsByRoadmap[r.id] ?? []).map((s) => ({
        skill_id: s.skill_id,
        required_level: s.required_level,
      })),
    });
  }

  function closeForm() {
    setForm({ open: false });
  }

  async function handleActivate(roadmapId: string) {
    setActivatingId(roadmapId);
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/activate`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(json.error || "Could not activate roadmap");
        return;
      }
      router.refresh();
      await loadProgress();
    } finally {
      setActivatingId(null);
    }
  }

  async function handleDelete(roadmapId: string) {
    if (!confirm("Delete this roadmap? This cannot be undone.")) return;
    setMenuId(null);
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(json.error || "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Delete failed");
    }
  }

  function ctaLabel(r: RoadmapRow): string {
    if (activeRoadmapId === r.id) return "Active";
    if (enrolledRoadmapIds.includes(r.id)) return "Continue";
    return "Start";
  }

  function isOwner(r: RoadmapRow) {
    return r.user_id === userId;
  }

  return (
    <>
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <h1
            className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]"
            style={{ letterSpacing: -1 }}
          >
            Career Roadmaps
          </h1>
          <button
            type="button"
            onClick={openCreate}
            className="px-6 py-3 rounded-full text-sm font-bold text-white btn-primary shrink-0 self-start sm:self-center"
          >
            Create roadmap
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {roadmaps.map((r, i) => {
            const color = colors[i % colors.length];
            const prog = progressMap[r.id]?.progress ?? 0;
            const totalSkills =
              progressMap[r.id]?.total_skills ?? skillsByRoadmap[r.id]?.length ?? 0;
            const isActive = activeRoadmapId === r.id;
            const ctaDisabled = isActive || activatingId === r.id;
            const owner = isOwner(r);

            const isGraph = progressMap[r.id]?.mode === "graph";
            const countText = isGraph
              ? `${totalSkills} step${totalSkills === 1 ? "" : "s"}`
              : `${totalSkills} skill${totalSkills === 1 ? "" : "s"}`;

            return (
              <div
                key={r.id}
                className="rounded-3xl overflow-hidden relative transition-shadow duration-300"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: isActive
                    ? "0 0 0 2px rgba(98,255,150,0.45), 0 0 28px rgba(0,102,49,0.22), 0 12px 40px rgba(0,102,49,0.08)"
                    : undefined,
                }}
              >
                <div
                  style={{
                    height: 8,
                    background: `linear-gradient(90deg,${color},${color}66)`,
                    width: `${Math.min(100, prog)}%`,
                    borderRadius: "0 4px 4px 0",
                    transition: "width 0.35s ease",
                  }}
                />
                <div className="p-6 lg:p-8">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3
                      className="font-display text-xl lg:text-2xl font-extrabold text-[var(--on-surface)] pr-2"
                      style={{ letterSpacing: -0.3 }}
                    >
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full capitalize"
                        style={{
                          background:
                            r.difficulty === "beginner"
                              ? "var(--tertiary-container, #e6f7ee)"
                              : "var(--surface-low)",
                          color: r.difficulty === "beginner" ? "var(--tertiary)" : "var(--primary)",
                        }}
                      >
                        {r.difficulty}
                      </span>
                      {owner ? (
                        <div className="relative">
                          <button
                            type="button"
                            className="p-2 rounded-full"
                            style={{ color: "var(--outline)" }}
                            aria-label="Roadmap actions"
                            onClick={() => setMenuId(menuId === r.id ? null : r.id)}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {menuId === r.id ? (
                            <div
                              className="absolute right-0 top-full mt-1 z-10 rounded-2xl py-1 min-w-[140px] shadow-lg"
                              style={{ background: "var(--surface-card)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                            >
                              <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"
                                style={{ color: "var(--on-surface)" }}
                                onClick={() => openEdit(r)}
                              >
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2"
                                style={{ color: "#b91c1c" }}
                                onClick={() => handleDelete(r.id)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--on-surface-variant)" }}>
                    {r.description || "—"}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] mb-5" style={{ color: "var(--outline)" }}>
                    <span>{countText}</span>
                    <span>{prog}% complete</span>
                    <span>{r.estimated_hours ? `${r.estimated_hours} hours` : "Self-paced"}</span>
                  </div>
                  <div className="flex justify-end items-center gap-3 flex-wrap">
                    <Link
                      href={`/roadmaps/${r.id}`}
                      className="px-6 py-2.5 rounded-full text-[13px] font-bold"
                      style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      disabled={ctaDisabled}
                      onClick={() => !ctaDisabled && handleActivate(r.id)}
                      className="px-6 py-2.5 rounded-full text-[13px] font-bold text-white disabled:opacity-60 disabled:cursor-default"
                      style={{
                        background: isActive ? `linear-gradient(135deg,${color}99,${color}66)` : `linear-gradient(135deg,${color},${color}cc)`,
                        boxShadow: isActive ? "none" : `0 6px 20px ${color}30`,
                      }}
                    >
                      {activatingId === r.id ? "…" : ctaLabel(r)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {form.open && form.mode === "create" ? (
        <RoadmapFormModal
          key="create"
          open
          mode="create"
          skills={skills}
          onClose={closeForm}
          onSuccess={() => {
            router.refresh();
            loadProgress();
          }}
        />
      ) : null}
      {form.open && form.mode === "edit" ? (
        <RoadmapFormModal
          key={form.id}
          open
          mode="edit"
          roadmapId={form.id}
          initialTitle={form.title}
          initialDescription={form.description ?? ""}
          initialSkills={form.skills}
          skills={skills}
          onClose={closeForm}
          onSuccess={() => {
            router.refresh();
            loadProgress();
          }}
        />
      ) : null}
    </>
  );
}
