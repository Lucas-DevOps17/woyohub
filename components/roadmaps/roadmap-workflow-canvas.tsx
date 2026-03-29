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
} from "reactflow";
import "reactflow/dist/style.css";
import type { SkillOption } from "@/components/roadmaps/roadmap-form-modal";
import { RoadmapNodeEditModal } from "@/components/roadmaps/roadmap-node-edit-modal";

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
};

// NOTE: this is a subset of the full DB type
export type WorkflowEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

function WorkflowNodeComponent({
  data: node,
}: {
  data: WorkflowNode & { isOwner: boolean, onToggleComplete: (nodeId: string, completed: boolean) => void };
}) {

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--primary)', width: 8, height: 8, border: 'none', top: -4 }}
        isConnectable={node.isOwner}
      />
      <div
        className="w-full h-full rounded-2xl p-4 cursor-pointer select-none relative"
        style={{
          background: "var(--surface-card)",
          boxShadow: node.completed
            ? "0 8px 28px rgba(0,102,49,0.12)"
            : "0 8px 28px rgba(0,73,219,0.06)",
          border: "2px solid transparent",
        }}
      >
      <label
        className="flex items-start gap-2 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={node.completed}
          onChange={(e) => node.onToggleComplete(node.id, e.target.checked)}
          disabled={!node.isOwner}
          className="mt-1 rounded"
        />
        <span className="flex-1 min-w-0">
          <span className="font-display font-bold text-[var(--on-surface)] text-sm block leading-snug">
            {node.title}
          </span>
          {node.skill?.name ? (
            <span
              className="text-[11px] mt-1 block"
              style={{ color: "var(--outline)" }}
            >
              {node.skill.icon ? `${node.skill.icon} ` : ""}
              {node.skill.name}
            </span>
          ) : null}
        </span>
      </label>
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

export function RoadmapWorkflowCanvas({
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
        // Revert on failure
        setNodes((prev) =>
            prev.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, completed: !completed } } : n
            )
        );
        alert("Failed to update completion status");
        return
    }

    const j = await res.json();
    if (j.xp_awarded > 0) {
      router.refresh();
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { ...n, isOwner, onToggleComplete },
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
    
    router.refresh(); // Or optimistically update the node in local state
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
    },
    [isOwner, setEdges, roadmapId, edges]
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
        skill_id: null,
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
      data: { ...newNodeData, isOwner, onToggleComplete },
      type: 'workflow',
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'transparent',
        border: 'none',
      },
    };

    setNodes((nds) => [...nds, newNode]);
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
