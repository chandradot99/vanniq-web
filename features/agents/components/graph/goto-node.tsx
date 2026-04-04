"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow, useStore } from "@xyflow/react";
import { CornerUpLeft, ArrowRight, Trash2 } from "lucide-react";
import type { AgentNodeData } from "../../utils/graph-transform";

interface GotoNodeProps {
  id: string;
  data: AgentNodeData;
  selected?: boolean;
}

/**
 * GotoNode — a first-class canvas node that represents a "jump to another node"
 * in the flow. Serializes to/from a goto edge in the backend graph config.
 *
 * - Only has a target (input) handle — no source handle (it's a terminal redirect)
 * - Shows the destination label so the intent is always visible on the canvas
 * - Clicking the arrow button pans to the target node without disorienting the user
 */
export const GotoNode = memo(function GotoNode({ id, data, selected }: GotoNodeProps) {
  const { getNode, setCenter, deleteElements } = useReactFlow();
  const targetId = data.config?.target as string | undefined;

  // Reactively read the destination label (group › node) from the store
  const targetLabel = useStore((s) => {
    if (!targetId) return null;
    const node = s.nodes.find((n) => n.id === targetId);
    if (!node) return targetId;
    const label = (node.data as { label?: string } | undefined)?.label ?? targetId;
    const parent = node.parentId ? s.nodes.find((n) => n.id === node.parentId) : null;
    const parentLabel = parent ? (parent.data as { label?: string } | undefined)?.label : null;
    return parentLabel ? `${parentLabel} › ${label}` : label;
  });

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!targetId) return;
      const node = getNode(targetId);
      if (!node) return;
      const parent = node.parentId ? getNode(node.parentId) : null;
      const absX = node.position.x + (parent?.position.x ?? 0);
      const absY = node.position.y + (parent?.position.y ?? 0);
      setCenter(
        absX + (node.measured?.width ?? 224) / 2,
        absY + (node.measured?.height ?? 120) / 2,
        { zoom: 1, duration: 400 },
      );
    },
    [targetId, getNode, setCenter],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteElements({ nodes: [{ id }] });
    },
    [id, deleteElements],
  );

  return (
    <div
      className={`
        group flex items-center gap-2 pl-3 pr-2 py-2 rounded-full border bg-card shadow-sm
        transition-all duration-150 select-none
        border-indigo-500/50 bg-indigo-500/5
        ${selected ? "shadow-md ring-2 ring-indigo-400/40" : "hover:shadow-md hover:border-indigo-500/70"}
      `}
      style={{ minWidth: 160, maxWidth: 260 }}
    >
      {/* Input handle — receives the connection from the previous node */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-indigo-400 !bg-background hover:!bg-indigo-400"
      />

      {/* Loop-back icon */}
      <div className="h-6 w-6 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0">
        <CornerUpLeft className="h-3 w-3 text-indigo-500" />
      </div>

      {/* Destination label */}
      <div className="flex-1 min-w-0">
        {targetLabel ? (
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate leading-tight">
            {targetLabel}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground italic truncate leading-tight">
            Select target…
          </p>
        )}
        <p className="text-[9px] text-muted-foreground/60 font-mono">goto</p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {targetId && (
          <button
            onMouseDown={handleNavigate}
            title="Navigate to target node"
            className="h-5 w-5 rounded-full flex items-center justify-center text-indigo-500 hover:bg-indigo-500/15 transition-colors"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        <button
          onMouseDown={handleDelete}
          title="Delete"
          className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
});
