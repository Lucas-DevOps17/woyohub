"use client";

import { useState, useEffect } from "react";
export type RoadmapSkillRow = { skill_id: string; required_level: number };

/** Minimal fields for pickers (matches server select) */
export type SkillOption = { id: string; name: string; icon: string | null; category: string };

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  roadmapId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialSkills?: RoadmapSkillRow[];
  skills: SkillOption[];
  onSuccess: () => void;
};

export function RoadmapFormModal({
  open,
  onClose,
  mode,
  roadmapId,
  initialTitle,
  initialDescription,
  initialSkills,
  skills,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<RoadmapSkillRow[]>([{ skill_id: "", required_level: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle ?? "");
    setDescription(initialDescription ?? "");
    if (initialSkills && initialSkills.length > 0) {
      setRows(initialSkills.map((s) => ({ skill_id: s.skill_id, required_level: s.required_level })));
    } else {
      setRows([{ skill_id: skills[0]?.id ?? "", required_level: 1 }]);
    }
    setError(null);
  }, [open, mode, roadmapId, initialTitle, initialDescription, initialSkills, skills]);

  function addRow() {
    const taken = new Set(rows.map((r) => r.skill_id).filter(Boolean));
    const next = skills.find((s) => !taken.has(s.id));
    setRows((prev) => [...prev, { skill_id: next?.id ?? "", required_level: 1 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<RoadmapSkillRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function optionsForRow(index: number) {
    const taken = new Set(
      rows.map((r, i) => (i !== index && r.skill_id ? r.skill_id : null)).filter(Boolean) as string[]
    );
    return skills.filter((s) => !taken.has(s.id) || rows[index].skill_id === s.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "edit" && !roadmapId) {
      setError("Missing roadmap id");
      return;
    }
    setLoading(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      skills: rows
        .filter((r) => r.skill_id)
        .map((r) => ({
          skill_id: r.skill_id,
          required_level: Math.max(1, Math.floor(Number(r.required_level)) || 1),
        })),
    };
    try {
      const url = mode === "create" ? "/api/roadmaps" : `/api/roadmaps/${roadmapId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Request failed");
        setLoading(false);
        return;
      }
      setLoading(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 lg:p-8 shadow-lg"
        style={{ background: "var(--surface-card)", boxShadow: "0 24px 48px rgba(0,73,219,0.08)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-form-title"
      >
        <h2
          id="roadmap-form-title"
          className="font-display text-xl font-bold text-[var(--on-surface)] mb-4"
          style={{ letterSpacing: -0.3 }}
        >
          {mode === "create" ? "Create roadmap" : "Edit roadmap"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--outline)" }}>
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              placeholder="e.g. Staff engineer path"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--outline)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              placeholder="What you want to achieve…"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold" style={{ color: "var(--outline)" }}>
                Skills & target levels
              </span>
              <button
                type="button"
                onClick={addRow}
                disabled={skills.length === 0}
                className="text-xs font-bold px-3 py-1 rounded-full disabled:opacity-40"
                style={{ background: "var(--surface-low)", color: "var(--primary)" }}
              >
                + Add skill
              </button>
            </div>
            {skills.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--outline)" }}>
                No skills available yet. Add skills from your learning flow or seed the catalog.
              </p>
            ) : null}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rows.map((row, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={row.skill_id}
                    onChange={(e) => updateRow(index, { skill_id: e.target.value })}
                    className="flex-1 min-w-0 rounded-2xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
                  >
                    <option value="">Select skill…</option>
                    {optionsForRow(index).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon ? `${s.icon} ` : ""}
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={row.required_level}
                    onChange={(e) => updateRow(index, { required_level: Number(e.target.value) })}
                    className="w-16 rounded-2xl px-2 py-2.5 text-sm text-center outline-none"
                    style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
                    title="Required level"
                  />
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ color: "var(--outline)" }}
                    >
                      ✕
                    </button>
                  ) : (
                    <span className="w-8 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {error ? (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          ) : null}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-bold"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50"
            >
              {loading ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
