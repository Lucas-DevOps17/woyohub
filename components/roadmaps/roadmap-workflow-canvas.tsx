"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { SkillOption } from "@/components/roadmaps/roadmap-form-modal";

export type WorkflowNode = {
  id: string;
  title: string;
  description: string | null;
  skill_id: string | null;
  x: number;
  y: number;
  completed: boolean;
  skill?: { name: string; icon: string | null } | null;
};

export function RoadmapWorkflowCanvas({
  roadmapId,
  roadmapTitle,
  isOwner,
  initialNodes,
  skills,
}: {
  roadmapId: string;
  roadmapTitle: string;
  isOwner: boolean;
  initialNodes: WorkflowNode[];
  skills: SkillOption[];
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSkillId, setEditSkillId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const selected = nodes.find((n) => n.id === selectedId);

  useEffect(() => {
    if (selected) {
      setEditTitle(selected.title);
      setEditDescription(selected.description ?? "");
      setEditSkillId(selected.skill_id ?? "");
    }
  }, [selectedId, selected?.title, selected?.description, selected?.skill_id]);

  const persistPosition = useCallback(
    async (nodeId: string, x: number, y: number) => {
      const nx = Math.max(0, Math.round(x));
      const ny = Math.max(0, Math.round(y));
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x: nx, y: ny } : n)));
      await fetch(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: nx, y: ny }),
      });
      router.refresh();
    },
    [roadmapId, router]
  );

  async function addNode() {
    const title = window.prompt("Node title?");
    if (!title?.trim()) return;
    const offset = nodes.length * 24;
    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        x: 48 + offset,
        y: 48 + offset,
        description: null,
        skill_id: null,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Failed to add node");
      return;
    }
    router.refresh();
  }

  async function saveEdit() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          skill_id: editSkillId || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Save failed");
        return;
      }
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                skill_id: editSkillId || null,
              }
            : n
        )
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteNode(nodeId: string) {
    if (!confirm("Remove this node?")) return;
    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Delete failed");
      return;
    }
    setSelectedId(null);
    router.refresh();
  }

  async function toggleComplete(node: WorkflowNode, completed: boolean) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, completed } : n)));
    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${node.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || "Update failed");
      setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, completed: node.completed } : n)));
      return;
    }
    if (j.xp_awarded > 0) {
      router.refresh();
    }
  }

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-9 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/roadmaps"
            className="text-xs font-bold mb-2 inline-block"
            style={{ color: "var(--primary)" }}
          >
            ← Back to roadmaps
          </Link>
          <h1
            className="font-display text-2xl lg:text-3xl font-extrabold text-[var(--on-surface)]"
            style={{ letterSpacing: -0.5 }}
          >
            {roadmapTitle}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            {isOwner ? "Drag nodes to arrange. Click a node to edit." : "Check off steps as you complete them."}
          </p>
        </div>
        {isOwner ? (
          <button
            type="button"
            onClick={addNode}
            className="px-6 py-3 rounded-full text-sm font-bold text-white btn-primary shrink-0 self-start"
          >
            Add node
          </button>
        ) : null}
      </div>

      <div
        ref={canvasRef}
        className="relative rounded-3xl overflow-hidden min-h-[480px] lg:min-h-[560px]"
        style={{ background: "var(--surface-low)" }}
      >
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center" style={{ color: "var(--outline)" }}>
            <div>
              <p className="font-display text-lg font-bold text-[var(--on-surface)] mb-2">No workflow nodes yet</p>
              {isOwner ? (
                <p className="text-sm">Add nodes to build your skill map.</p>
              ) : (
                <p className="text-sm">The author has not added nodes to this roadmap.</p>
              )}
            </div>
          </div>
        ) : null}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            drag={isOwner}
            dragMomentum={false}
            dragConstraints={canvasRef}
            dragElastic={0}
            className="absolute w-[220px] rounded-2xl p-4 cursor-pointer select-none"
            style={{
              left: node.x,
              top: node.y,
              background: "var(--surface-card)",
              boxShadow: node.completed
                ? "0 8px 28px rgba(0,102,49,0.12)"
                : "0 8px 28px rgba(0,73,219,0.06)",
              border: selectedId === node.id ? "2px solid rgba(0,73,219,0.35)" : "2px solid transparent",
            }}
            whileDrag={{ scale: 1.02, zIndex: 20, boxShadow: "0 14px 40px rgba(0,73,219,0.12)" }}
            onDragEnd={(_, info) => {
              if (!isOwner) return;
              void persistPosition(node.id, node.x + info.offset.x, node.y + info.offset.y);
            }}
            onClick={() => isOwner && setSelectedId(node.id)}
          >
            <label
              className="flex items-start gap-2 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={node.completed}
                onChange={(e) => void toggleComplete(node, e.target.checked)}
                className="mt-1 rounded"
              />
              <span className="flex-1 min-w-0">
                <span className="font-display font-bold text-[var(--on-surface)] text-sm block leading-snug">
                  {node.title}
                </span>
                {node.skill?.name ? (
                  <span className="text-[11px] mt-1 block" style={{ color: "var(--outline)" }}>
                    {node.skill.icon ? `${node.skill.icon} ` : ""}
                    {node.skill.name}
                  </span>
                ) : null}
              </span>
            </label>
          </motion.div>
        ))}
      </div>

      {selected && isOwner ? (
        <div
          className="mt-6 rounded-3xl p-6 lg:p-8"
          style={{ background: "var(--surface-card)" }}
        >
          <h2 className="font-display text-lg font-bold text-[var(--on-surface)] mb-4">Edit node</h2>
          <div className="grid gap-4 max-w-xl">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--outline)" }}>
                Title
              </label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--outline)" }}>
                Description (optional)
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--outline)" }}>
                Linked skill (optional, +10 XP on complete)
              </label>
              <select
                value={editSkillId}
                onChange={(e) => setEditSkillId(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
              >
                <option value="">None</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon ? `${s.icon} ` : ""}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving || !editTitle.trim()}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white btn-primary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void deleteNode(selected.id)}
                className="px-6 py-2.5 rounded-full text-sm font-bold"
                style={{ background: "var(--surface-low)", color: "#b91c1c" }}
              >
                Delete node
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
