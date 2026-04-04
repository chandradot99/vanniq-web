"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle, AlertCircle, Clock, ChevronDown } from "lucide-react";
import { toFlowGraph } from "../../utils/graph-transform";
import type { AgentFlowNode, AgentFlowEdge } from "../../utils/graph-transform";
import { AgentNode } from "./agent-node";
import { GotoNode } from "./goto-node";
import { GroupNode } from "./group-node";
import type { GraphConfig, SessionTimeline } from "@/types";

const nodeTypes: NodeTypes = { agentNode: AgentNode, groupNode: GroupNode, gotoNode: GotoNode };

interface Props {
  graphConfig: GraphConfig;
  timeline: SessionTimeline;
  sessionStatus: "active" | "ended";
}

function ExecutionGraphInner({ graphConfig, timeline, sessionStatus }: Props) {
  const [selectedTurn, setSelectedTurn] = useState<number | "all">("all");

  // All distinct turns that have events
  const turns = useMemo(() => {
    const set = new Set(timeline.events.map((e) => e.turn));
    return Array.from(set).sort((a, b) => a - b);
  }, [timeline.events]);

  // Node events filtered by selected turn
  const nodeEvents = useMemo(() => {
    const events = timeline.events.filter((e) => e.event_type === "node");
    if (selectedTurn === "all") return events;
    return events.filter((e) => e.turn === selectedTurn);
  }, [timeline.events, selectedTurn]);

  // LLM events for token count per parent node
  const llmEvents = useMemo(
    () => timeline.events.filter((e) => e.event_type === "llm"),
    [timeline.events],
  );

  // Error event (if any)
  const errorEvent = useMemo(
    () => timeline.events.find((e) => e.event_type === "error"),
    [timeline.events],
  );

  // Build execution map: nodeId → overlay data (last occurrence wins for multi-turn "all")
  const executionMap = useMemo(() => {
    const map = new Map<string, { order: number; duration_ms: number | null; status: string; error: string | null; tokens?: number }>();
    nodeEvents.forEach((e, i) => {
      const llm = llmEvents.find((l) => l.data.parent_node === e.name);
      map.set(e.name, {
        order: i + 1,
        duration_ms: e.duration_ms,
        status: e.status,
        error: e.error,
        tokens: llm ? (llm.data.total_tokens as number) : undefined,
      });
    });
    return map;
  }, [nodeEvents, llmEvents]);

  const isExecutionMode = nodeEvents.length > 0;
  const hasError = !!errorEvent;
  const isComplete = sessionStatus === "ended" && !hasError;
  const isActive = sessionStatus === "active" && !hasError;

  // Build base graph from config
  const { nodes: baseNodes, edges: baseEdges, viewport } = useMemo(
    () => toFlowGraph(graphConfig),
    [graphConfig],
  );

  // Apply execution overlays to nodes
  const overlayNodes: AgentFlowNode[] = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        draggable: false,
        selectable: false,
        data: {
          ...node.data,
          isExecutionMode,
          execution: executionMap.get(node.id) ?? null,
        },
      })),
    [baseNodes, executionMap, isExecutionMode],
  );

  // Find traversed edges: consecutive node events → look for edge source→target
  const traversedEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < nodeEvents.length - 1; i++) {
      const from = nodeEvents[i].name;
      const to = nodeEvents[i + 1].name;
      const edge = baseEdges.find((e) => e.source === from && e.target === to);
      if (edge) ids.add(edge.id);
    }
    return ids;
  }, [nodeEvents, baseEdges]);

  const overlayEdges: AgentFlowEdge[] = useMemo(
    () =>
      baseEdges.map((edge) => {
        const traversed = traversedEdgeIds.has(edge.id);
        return {
          ...edge,
          animated: traversed,
          style: traversed
            ? { stroke: "hsl(var(--primary))", strokeWidth: 2.5 }
            : { opacity: isExecutionMode ? 0.2 : 1 },
          markerEnd: traversed
            ? { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" }
            : edge.markerEnd,
        };
      }),
    [baseEdges, traversedEdgeIds, isExecutionMode],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Status banner + controls */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border/60 bg-card shrink-0 flex-wrap">

        {/* Session status pill */}
        {isComplete && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <CheckCircle className="h-3.5 w-3.5" />
            Session completed
          </div>
        )}
        {hasError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            Error at &quot;{errorEvent?.name || "unknown node"}&quot;
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            Session in progress
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            Executed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
            Error
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-border inline-block opacity-40" />
            Not reached
          </span>
        </div>

        {/* Turn selector */}
        {turns.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Turn:</span>
            <div className="relative">
              <select
                value={selectedTurn}
                onChange={(e) =>
                  setSelectedTurn(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="text-xs bg-card border border-border rounded px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All turns</option>
                {turns.map((t) => (
                  <option key={t} value={t}>
                    Turn {t + 1}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={overlayNodes}
          edges={overlayEdges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll
          panOnDrag
          {...(viewport
            ? { defaultViewport: viewport }
            : { fitView: true, fitViewOptions: { padding: 0.25 } })}
          className="bg-background"
        >
          <Background gap={20} size={1} className="opacity-30" />
          <Controls className="!border-border/60 !bg-card !shadow-none" />
          <MiniMap
            className="!border-border/60 !bg-card"
            nodeColor={(n) => {
              const exec = (n.data as { execution?: { status: string } | null })?.execution;
              if (!exec) return "hsl(var(--muted-foreground) / 0.2)";
              if (exec.status === "error") return "#ef4444";
              if (exec.status === "interrupted") return "#f59e0b";
              return "#22c55e";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function ExecutionGraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <ExecutionGraphInner {...props} />
    </ReactFlowProvider>
  );
}
