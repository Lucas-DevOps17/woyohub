"use client";

import {
  useState,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { SkillOption } from "@/components/roadmaps/roadmap-form-modal";
import { RoadmapNodeEditModal } from "@/components/roadmaps/roadmap-node-edit-modal";
import { toast } from "sonner";

// NOTE: this is a subset of the full DB type
export type WorkflowNode = {
  id: string;
  title: string;
  description: string | null;
  skill_id: string | null;
  x: number;
  y: number;
  completed: boolean;
  skill?: { name: string; icon: string | null } | null;
  node_skills?: { skill_id: string; skill?: { name: string; icon: string | null } }[];
};

// NOTE: this is a subset of the full DB type
export type WorkflowEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
};

const NODE_WIDTH = 260;
const NODE_HEIGHT = 148;

function normalizeNodePayload(node: any, isOwner: boolean, onToggleComplete: (nodeId: string, completed: boolean) => void) {
  return {
    ...node,
    skill: node.skill && Array.isArray(node.skill) ? node.skill[0] : node.skill,
    node_skills: Array.isArray(node.node_skills)
      ? node.node_skills.map((entry: any) => ({
          ...entry,
          skill: Array.isArray(entry.skill) ? entry.skill[0] : entry.skill,
        }))
      : [],
    isOwner,
    onToggleComplete,
  };
}

function WorkflowNodeComponent({
  data: node,
}: {
  data: WorkflowNode & { isOwner: boolean, onToggleComplete: (nodeId: string, completed: boolean) => void };
}) {
  const completeLabel = node.completed ? "Completed" : "Set Complete";

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--primary)', width: 8, height: 8, border: 'none', top: -4 }}
        isConnectable={node.isOwner}
      />
      <div
        className="w-full h-full rounded-[28px] p-0 cursor-pointer select-none relative overflow-hidden"
        style={{
          background: node.completed
            ? "linear-gradient(180deg, rgba(0,102,49,0.14) 0%, var(--surface-card) 38%)"
            : "linear-gradient(180deg, rgba(0,73,219,0.12) 0%, var(--surface-card) 38%)",
          boxShadow: node.completed
            ? "0 18px 34px rgba(0,102,49,0.16)"
            : "0 18px 34px rgba(0,73,219,0.10)",
          border: node.completed
            ? "1px solid rgba(0,102,49,0.22)"
            : "1px solid rgba(0,73,219,0.12)",
        }}
      >
        <div
          className="h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{
                  background: node.completed ? "rgba(0,102,49,0.14)" : "rgba(0,73,219,0.10)",
                  color: node.completed ? "var(--tertiary)" : "var(--primary)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: node.completed ? "var(--tertiary)" : "var(--primary)" }}
                />
                {node.completed ? "Cleared" : "In Progress"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => node.onToggleComplete(node.id, !node.completed)}
              className="shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold tracking-wide transition-all"
              style={{
                background: node.completed ? "var(--tertiary)" : "var(--primary)",
                color: "#ffffff",
              }}
            >
              {completeLabel}
            </button>
          </div>

          <div className="px-5 pb-5 flex-1 flex flex-col">
            <span className="font-display font-extrabold text-[15px] block leading-snug text-[var(--on-surface)]">
              {node.title}
            </span>
            {node.description ? (
              <p className="text-[12px] leading-relaxed mt-2" style={{ color: "var(--on-surface-variant)" }}>
                {node.description}
              </p>
            ) : (
              <p className="text-[12px] mt-2" style={{ color: "var(--outline)" }}>
                Link a skill or add notes for this step.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {node.node_skills && node.node_skills.length > 0 ? (
                node.node_skills.map((ns, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1.5 rounded-full"
                    style={{
                      background: "var(--surface-low)",
                      color: "var(--on-surface-variant)",
                      border: "1px solid rgba(0,73,219,0.08)",
                    }}
                  >
                    {ns.skill?.icon ? `${ns.skill.icon} ` : ""}
                    {ns.skill?.name || "Linked skill"}
                  </span>
                ))
              ) : node.skill?.name ? (
                <span
                  className="text-[11px] px-2.5 py-1.5 rounded-full"
                  style={{
                    background: "var(--surface-low)",
                    color: "var(--on-surface-variant)",
                    border: "1px solid rgba(0,73,219,0.08)",
                  }}
                >
                  {node.skill.icon ? `${node.skill.icon} ` : ""}
                  {node.skill.name}
                </span>
              ) : (
                <span
                  className="text-[11px] px-2.5 py-1.5 rounded-full"
                  style={{
                    background: "rgba(0,0,0,0.03)",
                    color: "var(--outline)",
                  }}
                >
                  No linked skills yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--primary)', width: 8, height: 8, border: 'none', bottom: -4 }}
        isConnectable={node.isOwner}
      />
    </>
  );
}

export function RoadmapWorkflowCanvas(props: {
  roadmapId: string;
  roadmapTitle: string;
  isOwner: boolean;
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  skills: SkillOption[];
}) {
  return (
    <ReactFlowProvider>
      <RoadmapWorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function RoadmapWorkflowCanvasInner({
  roadmapId,
  roadmapTitle,
  isOwner,
  initialNodes,
  initialEdges,
  skills,
}: {
  roadmapId: string;
  roadmapTitle: string;
  isOwner: boolean;
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  skills: SkillOption[];
}) {
  const router = useRouter();
  const { fitView } = useReactFlow();

  const onToggleComplete = async (nodeId: string, completed: boolean) => {
    // Optimistic update
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, completed } } : n
      )
    );

    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${nodeId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    if (!res.ok) {
        const payload = await res.json().catch(() => null);
        // Revert on failure
        setNodes((prev) =>
            prev.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, completed: !completed } } : n
            )
        );
        toast.error(payload?.error || "Failed to update completion status");
        return
    }

    const j = await res.json();
    if (j.xp_awarded > 0) {
      toast.success("Roadmap step completed");
      router.refresh();
    } else if (!completed) {
      toast.success("Roadmap step reopened");
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: normalizeNodePayload(n, isOwner, onToggleComplete),
      type: "workflow",
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: "transparent",
        border: "none",
      },
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
    }))
  );

  const [editNodeId, setEditNodeId] = useState<string | null>(null);

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      if (!isOwner) return;
      setEditNodeId(node.id);
    },
    [isOwner]
  );

  const handleSaveNode = async (nodeId: string, updates: any) => {
    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    
    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error || "Failed to save node");
    }

    const json = await res.json();
    if (json.node) {
      setNodes((prev) =>
        prev.map((current) =>
          current.id === nodeId
            ? {
                ...current,
                position: { x: json.node.x, y: json.node.y },
                data: normalizeNodePayload(json.node, isOwner, onToggleComplete),
              }
            : current
        )
      );
    }

    router.refresh();
    setEditNodeId(null);
  };

  const handleDeleteNode = async (nodeId: string) => {
    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`, {
      method: "DELETE",
    });
    
    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error || "Failed to delete node");
    }
    
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setEditNodeId(null);
  };

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!isOwner) return;
      if (params.source === params.target) return; // Prevent self-connection

      // Prevent duplicate edge
      const isDuplicate = edges.some(e => e.source === params.source && e.target === params.target);
      if (isDuplicate) return;

      // Optimistic addition
      const tempId = `temp-${Date.now()}`;
      setEdges((eds) => addEdge({ ...params, id: tempId }, eds));

      const res = await fetch(`/api/roadmaps/${roadmapId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: params.source,
          target: params.target,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setEdges((eds) => eds.filter((e) => e.id !== tempId));
        alert("Failed to create edge");
        return;
      }

      const newEdge = await res.json();
      setEdges((eds) => eds.map((e) => e.id === tempId ? { ...e, id: newEdge.id } : e));
      router.refresh();
    },
    [isOwner, setEdges, roadmapId, edges, router]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (!isOwner) return;
      const deletePromises = edgesToDelete.map((edge) =>
        fetch(`/api/roadmaps/${roadmapId}/edges/${edge.id}`, {
          method: 'DELETE',
        })
      );
      Promise.all(deletePromises).catch(() => {
          router.refresh();
      });
    },
    [roadmapId, isOwner, router]
  );

  const onNodeDragStop = useCallback(
    async (event: any, node: any) => {
      const { x, y } = node.position;
      await fetch(`/api/roadmaps/${roadmapId}/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: Math.round(x), y: Math.round(y) }),
      });
    },
    [roadmapId]
  );

  async function addNode() {
    const title = window.prompt("Node title?");
    if (!title?.trim()) return;

    const yPos = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.y)) + NODE_HEIGHT + 20 : 100;

    const res = await fetch(`/api/roadmaps/${roadmapId}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        x: 100,
        y: yPos,
        description: null,
        skills: [],
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Failed to add node");
      return;
    }
    
    const newNodeData = await res.json();
    const newNode = {
      id: newNodeData.id,
      position: { x: newNodeData.x, y: newNodeData.y },
      data: normalizeNodePayload(newNodeData, isOwner, onToggleComplete),
      type: 'workflow',
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'transparent',
        border: 'none',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEditNodeId(newNodeData.id);
    router.refresh();
  }

  const nodeTypes = useMemo(
    () => ({
      workflow: WorkflowNodeComponent,
    }),
    []
  );

  return (
    <Fragment>
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
            <p
              className="text-sm mt-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {isOwner
                ? "Drag nodes to arrange. Click a node to edit."
                : "Check off steps as you complete them."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fitView({ duration: 800, padding: 0.2 })}
              className="px-6 py-3 rounded-full text-sm font-bold text-white shrink-0 self-start btn-secondary"
              style={{ background: "var(--surface-low)", color: "var(--on-surface)" }}
            >
              Center canvas
            </button>
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
        </div>
      </div>

      <div className="h-[560px] lg:h-[640px] rounded-3xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: {
              stroke: 'var(--primary)',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 6px rgba(0, 73, 219, 0.3))',
            },
          }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          nodesDraggable={isOwner}
          nodesConnectable={isOwner}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Edit Modal */}
      <RoadmapNodeEditModal
        open={editNodeId !== null}
        onClose={() => setEditNodeId(null)}
        node={nodes.find((n) => n.id === editNodeId)?.data as WorkflowNode | null}
        skills={skills}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </Fragment>
  );
}
