"use client";

import { useState, useEffect } from "react";
import type { SkillOption } from "./roadmap-form-modal";
import type { WorkflowNode } from "./roadmap-workflow-canvas";
import { Trash } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  node: WorkflowNode | null;
  skills: SkillOption[];
  onSave: (nodeId: string, updates: any) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
};

export function RoadmapNodeEditModal({
  open,
  onClose,
  node,
  skills,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillIcon, setNewSkillIcon] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !node) return;
    setTitle(node.title ?? "");
    setDescription(node.description ?? "");
    
    // Support legacy skill_id and new node_skills array
    const initialSkills: string[] = [];
    if (node.skill_id) initialSkills.push(node.skill_id);
    if ((node as any).node_skills) {
      for (const ns of (node as any).node_skills) {
        if (!initialSkills.includes(ns.skill_id)) {
          initialSkills.push(ns.skill_id);
        }
      }
    }
    setSelectedSkills(initialSkills);
    
    setShowNewSkill(false);
    setNewSkillName("");
    setNewSkillIcon("");
    setError(null);
  }, [open, node]);

  if (!open || !node) return null;

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!node) return;
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onSave(node.id, {
        title: title.trim(),
        description: description.trim() || null,
        skills: selectedSkills,
        new_skill_name: newSkillName.trim() || undefined,
        new_skill_icon: newSkillIcon.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save node");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!node) return;
    if (!window.confirm("Are you sure you want to delete this node? Related progress will be lost.")) return;
    
    setLoading(true);
    try {
      await onDelete(node.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete node");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 lg:p-8 shadow-lg relative"
        style={{ background: "var(--surface-card)", boxShadow: "0 24px 48px rgba(0,73,219,0.08)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="flex justify-between items-start mb-4">
          <h2
            className="font-display text-xl font-bold text-[var(--on-surface)]"
            style={{ letterSpacing: -0.3 }}
          >
            Edit step
          </h2>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
            title="Delete node"
          >
            <Trash size={18} />
          </button>
        </div>
        
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
              placeholder="e.g. Learn React Basics"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--outline)" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              placeholder="A short description..."
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: "var(--outline)" }}>
              Linked skills
            </label>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto pr-1">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: selectedSkills.includes(skill.id)
                        ? "var(--primary)"
                        : "var(--surface-low)",
                      color: selectedSkills.includes(skill.id)
                        ? "white"
                        : "var(--on-surface-variant)",
                    }}
                  >
                    {skill.icon} {skill.name}
                  </button>
                ))}
              </div>
            )}
            
            <div>
              <button
                type="button"
                onClick={() => setShowNewSkill((v) => !v)}
                className="text-xs font-bold"
                style={{ color: "var(--primary)" }}
              >
                {showNewSkill ? "- Cancel new skill" : "+ Add new skill"}
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
                      background: "var(--surface-low)",
                      color: "var(--on-surface)",
                    }}
                  />
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill name"
                    className="flex-1 px-4 py-2 rounded-[12px] text-[15px] outline-none"
                    style={{
                      background: "var(--surface-low)",
                      color: "var(--on-surface)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}
          
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
