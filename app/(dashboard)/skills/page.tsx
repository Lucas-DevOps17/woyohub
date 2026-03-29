"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { GradBar } from "@/components/ui/grad-bar";
import { calculateLevel, type UserProfile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type SkillRow = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  description: string | null;
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
      supabase.from("skills").select("*").order("category").order("name"),
      supabase.from("user_skills").select("skill_id, xp, level").eq("user_id", user.id),
    ]);

    const progressMap = new Map(
      (userSkillsRes.data || []).map((entry) => [entry.skill_id, { xp: entry.xp, level: entry.level }])
    );

    const merged = (skillsRes.data || []).map((skill) => {
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
      <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1200px] mx-auto animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="font-display text-2xl lg:text-4xl font-extrabold text-[var(--on-surface)]" style={{ letterSpacing: -1 }}>
              Skill Tree
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--on-surface-variant)" }}>
              Manage your skill library and track XP from projects, logs, and roadmap progress.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="px-7 py-3 rounded-full text-sm font-bold text-white btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            New Skill
          </button>
        </div>

        {showCreate ? (
          <div className="rounded-3xl p-5 lg:p-7 mb-6" style={{ background: "var(--surface-card)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-lg font-bold text-[var(--on-surface)]">
                {editingSkillId ? "Edit Skill" : "Create Skill"}
              </h2>
              <button onClick={closeForm} className="p-2 rounded-full" style={{ background: "var(--surface-low)", color: "var(--outline)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 mb-4">
              <input value={form.icon} onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} placeholder="Icon" className="px-4 py-3 rounded-[14px] outline-none" style={{ background: "var(--surface-low)", color: "var(--on-surface)" }} />
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Skill name" className="px-4 py-3 rounded-[14px] outline-none" style={{ background: "var(--surface-low)", color: "var(--on-surface)" }} />
              <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Category" className="px-4 py-3 rounded-[14px] outline-none" style={{ background: "var(--surface-low)", color: "var(--on-surface)" }} />
            </div>
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Optional description" rows={3} className="w-full px-4 py-3 rounded-[14px] outline-none resize-none mb-4" style={{ background: "var(--surface-low)", color: "var(--on-surface)" }} />
            <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50">
              {saving ? "Saving..." : editingSkillId ? "Save Changes" : "Create Skill"}
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {skills.map((skill) => (
            <div key={skill.id} className="rounded-3xl p-5 lg:p-7 flex flex-col gap-4" style={{ background: "var(--surface-card)" }}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl" style={{ background: "var(--surface-low)" }}>
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
                  <button onClick={() => startEdit(skill)} className="p-2 rounded-full hover-scale" style={{ background: "var(--surface-low)", color: "var(--primary)" }}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(skill.id)} className="p-2 rounded-full hover-scale" style={{ background: "#fef2f2", color: "var(--error)" }}>
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
                <div className="flex justify-between text-sm font-semibold mb-2">
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
