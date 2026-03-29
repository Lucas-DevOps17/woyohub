"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { createClient } from "@/lib/supabase/client";
import { calculateLevel, type UserProfile } from "@/types";

type SkillRow = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  description: string | null;
  user_id: string | null;
  xp: number;
  level: number;
};

type SkillForm = {
  name: string;
  category: string;
  icon: string;
  description: string;
};

const emptyForm: SkillForm = {
  name: "",
  category: "custom",
  icon: "",
  description: "",
};

export default function SkillsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [form, setForm] = useState<SkillForm>(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [profileRes, skillsRes, userSkillsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("skills")
        .select("id, name, category, icon, description, user_id")
        .eq("user_id", user.id)
        .order("category")
        .order("name"),
      supabase.from("user_skills").select("skill_id, xp, level").eq("user_id", user.id),
    ]);

    const progressMap = new Map(
      (userSkillsRes.data || []).map((entry) => [entry.skill_id, { xp: entry.xp, level: entry.level }])
    );

    const merged: SkillRow[] = (skillsRes.data || []).map((skill) => {
      const progress = progressMap.get(skill.id);
      return {
        ...skill,
        xp: progress?.xp || 0,
        level: progress?.level || 0,
      };
    });

    setProfile(profileRes.data);
    setSkills(merged);
    setLoading(false);
  }

  function startCreate() {
    setEditingSkillId(null);
    setForm(emptyForm);
    setShowCreate(true);
  }

  function startEdit(skill: SkillRow) {
    if (!skill.user_id) {
      toast.error("Built-in skills are read-only. Create your own custom skill to edit it.");
      return;
    }

    setEditingSkillId(skill.id);
    setForm({
      name: skill.name,
      category: skill.category,
      icon: skill.icon || "",
      description: skill.description || "",
    });
    setShowCreate(true);
  }

  function closeForm() {
    setEditingSkillId(null);
    setShowCreate(false);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Skill name is required.");
      return;
    }

    setSaving(true);
    const endpoint = editingSkillId ? `/api/skills/${editingSkillId}` : "/api/skills";
    const method = editingSkillId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(json.error || "Failed to save skill.");
      return;
    }

    toast.success(editingSkillId ? "Skill updated." : "Skill created.");
    closeForm();
    await loadData();
  }

  async function handleDelete(skillId: string) {
    const skill = skills.find((entry) => entry.id === skillId);
    if (skill && !skill.user_id) {
      toast.error("Built-in skills cannot be deleted.");
      return;
    }

    if (!confirm("Delete this skill? Linked progress and references may be removed.")) return;

    const response = await fetch(`/api/skills/${skillId}`, { method: "DELETE" });
    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error || "Failed to delete skill.");
      return;
    }

    toast.success("Skill deleted.");
    await loadData();
  }

  const level = calculateLevel(profile?.total_xp || 0);

  if (loading) {
    return <div className="p-10 text-center" style={{ color: "var(--outline)" }}>Loading...</div>;
  }

  return (
    <>
      <TopBar displayName={profile?.display_name || "Learner"} level={level} streak={profile?.current_streak || 0} />
      <div className="mx-auto max-w-[1200px] animate-fade-in px-4 py-6 lg:px-10 lg:py-9">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[var(--on-surface)] lg:text-4xl" style={{ letterSpacing: -1 }}>
              Skill Tree
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Manage your private skills and track XP from projects, logs, and roadmap progress.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
          >
            <Plus size={16} />
            New Skill
          </button>
        </div>

        {showCreate ? (
          <div className="mb-6 rounded-3xl p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--on-surface)]">
                {editingSkillId ? "Edit Custom Skill" : "Create Custom Skill"}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-full p-2"
                style={{ background: "var(--surface-low)", color: "var(--outline)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[100px_1fr_1fr]">
              <input
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="Icon"
                className="rounded-[14px] px-4 py-3 outline-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              />
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Skill name"
                className="rounded-[14px] px-4 py-3 outline-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              />
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="rounded-[14px] px-4 py-3 outline-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={3}
              className="mb-4 w-full resize-none rounded-[14px] px-4 py-3 outline-none"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary rounded-full px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : editingSkillId ? "Save Changes" : "Create Skill"}
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {skills.map((skill) => (
            <div key={skill.id} className="flex flex-col gap-4 rounded-3xl p-5 lg:p-7" style={{ background: "var(--surface-card)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl" style={{ background: "var(--surface-low)" }}>
                    {skill.icon || "•"}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-[var(--on-surface)]">{skill.name}</h3>
                    <p className="text-xs" style={{ color: "var(--outline)" }}>
                      {skill.category} · Level {skill.level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(skill)}
                    className="hover-scale rounded-full p-2"
                    style={{ background: "var(--surface-low)", color: "var(--primary)" }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="hover-scale rounded-full p-2"
                    style={{ background: "#fef2f2", color: "var(--error)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {skill.description ? (
                <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                  {skill.description}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--outline)" }}>
                  No description yet.
                </p>
              )}

              <div className="mt-auto">
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span style={{ color: "var(--on-surface)" }}>{skill.xp} XP</span>
                  <span style={{ color: "var(--outline)" }}>{skill.xp % 100}% to next level</span>
                </div>
                <GradBar pct={skill.xp % 100} h={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
