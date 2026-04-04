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
import { CheckCircle, AlertCircle, Clock, X, ChevronDown, ChevronRight, Bot, User, Settings } from "lucide-react";
import { toFlowGraph } from "../../utils/graph-transform";
import type { AgentFlowNode, AgentFlowEdge, TurnVisit } from "../../utils/graph-transform";
import { AgentNode } from "./agent-node";
import { GotoNode } from "./goto-node";
import { GroupNode } from "./group-node";
import type { GraphConfig, SessionTimeline, SessionEvent, TranscriptMessage } from "@/types";

const nodeTypes: NodeTypes = { agentNode: AgentNode, groupNode: GroupNode, gotoNode: GotoNode };

// Distinct turn colors — cycles if more than 6 turns
const TURN_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4", "#84cc16"];
function turnColor(turn: number): string {
  return TURN_COLORS[turn % TURN_COLORS.length];
}

// ── Node debug panel ──────────────────────────────────────────────────────────

function JsonBlock({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  const str = JSON.stringify(value, null, 2);
  const lines = str.split("\n");
  const preview = str.length > 120 ? str.slice(0, 120) + "…" : str;
  const isLong = lines.length > 6 || str.length > 120;

  return (
    <div className="rounded border border-border/50 bg-muted/30 overflow-hidden">
      <pre className="text-[10px] font-mono p-2 whitespace-pre-wrap break-all leading-relaxed">
        {isLong && !open ? preview : str}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 w-full px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/40 transition-colors"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {open ? "Collapse" : `Show all (${lines.length} lines)`}
        </button>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: TranscriptMessage }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const Icon = isUser ? User : isSystem ? Settings : Bot;
  const label = isUser ? "User" : isSystem ? "System" : "Agent";
  const colorClass = isUser
    ? "bg-blue-500/8 border-blue-500/20 text-blue-700 dark:text-blue-300"
    : isSystem
      ? "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-300"
      : "bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  const iconColor = isUser ? "text-blue-500" : isSystem ? "text-amber-500" : "text-emerald-500";

  return (
    <div className={`rounded-lg border p-2 space-y-1 ${colorClass}`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 shrink-0 ${iconColor}`} />
        <span className={`text-[9px] font-semibold uppercase tracking-wider ${iconColor}`}>{label}</span>
      </div>
      <p className="text-[11px] leading-relaxed break-words">{msg.content}</p>
    </div>
  );
}

function NodeDebugPanel({
  nodeName,
  events,
  selectedTurn,
  transcript,
  onClose,
}: {
  nodeName: string;
  events: SessionEvent[];
  selectedTurn: number | "all";
  transcript: TranscriptMessage[];
  onClose: () => void;
}) {
  // All node events for this node
  const nodeEvents = events.filter(
    (e) => e.event_type === "node" && e.name === nodeName &&
      (selectedTurn === "all" || e.turn === selectedTurn),
  );

  // LLM events parented to this node
  const llmEvents = events.filter(
    (e) => e.event_type === "llm" &&
      (e.data.parent_node === nodeName) &&
      (selectedTurn === "all" || e.turn === selectedTurn),
  );

  // Tool events parented to this node
  const toolEvents = events.filter(
    (e) => e.event_type === "tool" &&
      (e.data.parent_node === nodeName) &&
      (selectedTurn === "all" || e.turn === selectedTurn),
  );

  // Messages for this node from transcript (grouped by execution index)
  // Each execution of a node corresponds to the N-th message with that node_id
  const allNodeMessages = transcript.filter((m) => m.node_id === nodeName);
  // All node execution events for this node across all turns (ordered by turn)
  const allNodeEvents = events
    .filter((e) => e.event_type === "node" && e.name === nodeName)
    .sort((a, b) => a.turn - b.turn);

  function getMessagesForTurn(turn: number): TranscriptMessage[] {
    const execIdx = allNodeEvents.findIndex((e) => e.turn === turn);
    if (execIdx === -1 || execIdx >= allNodeMessages.length) return [];
    return [allNodeMessages[execIdx]];
  }

  const formatMs = (ms: number | null) => {
    if (ms == null) return "—";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border/60 flex flex-col z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60 shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{nodeName}</p>
          <p className="text-[10px] text-muted-foreground">
            {selectedTurn === "all" ? `${nodeEvents.length} execution(s)` : `Turn ${(selectedTurn as number) + 1}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {nodeEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">Node was not executed</p>
        ) : (
          <div className="divide-y divide-border/40">
            {nodeEvents.map((nodeEvt) => {
              const turn = nodeEvt.turn;
              const turnLlm = llmEvents.filter((e) => e.turn === turn);
              const turnTools = toolEvents.filter((e) => e.turn === turn);

              const turnMessages = getMessagesForTurn(turn);

              return (
                <div key={`${nodeEvt.id}`} className="p-3 space-y-3">
                  {/* Turn badge + timing */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${turnColor(turn)}22`, color: turnColor(turn) }}
                    >
                      T{turn + 1}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{formatMs(nodeEvt.duration_ms)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          nodeEvt.status === "error"
                            ? "bg-red-500/10 text-red-500"
                            : nodeEvt.status === "interrupted"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {nodeEvt.status}
                      </span>
                    </div>
                  </div>

                  {/* Messages for this node execution */}
                  {turnMessages.length > 0 && (
                    <div className="space-y-1.5">
                      {turnMessages.map((msg, i) => (
                        <MessageBubble key={i} msg={msg} />
                      ))}
                    </div>
                  )}

                  {/* Node error */}
                  {nodeEvt.error && (
                    <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
                      <p className="text-[10px] font-semibold text-red-500 mb-1">Error</p>
                      <p className="text-[10px] text-red-400 font-mono break-all">{nodeEvt.error}</p>
                    </div>
                  )}

                  {/* LLM calls */}
                  {turnLlm.map((llm, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        LLM · {llm.name}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          ["Prompt", llm.data.prompt_tokens],
                          ["Completion", llm.data.completion_tokens],
                          ["Total", llm.data.total_tokens],
                        ].map(([label, val]) => (
                          <div key={label as string} className="rounded bg-muted/40 px-2 py-1 text-center">
                            <p className="text-[9px] text-muted-foreground">{label}</p>
                            <p className="text-[11px] font-semibold">{val as number}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{formatMs(llm.duration_ms)}</span>
                        <span>{formatTime(llm.started_at)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Tool calls */}
                  {turnTools.map((tool, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Tool · {tool.data.tool_name as string}
                      </p>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium">Input</p>
                        <JsonBlock value={tool.data.input} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium">Output</p>
                        <JsonBlock value={tool.data.output} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{formatMs(tool.duration_ms)}</span>
                        <span
                          className={tool.data.success ? "text-emerald-500" : "text-red-500"}
                        >
                          {tool.data.success ? "success" : "failed"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Timing */}
                  <p className="text-[9px] text-muted-foreground/60">
                    {formatTime(nodeEvt.started_at)}
                    {nodeEvt.ended_at && ` → ${formatTime(nodeEvt.ended_at)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  graphConfig: GraphConfig;
  timeline: SessionTimeline;
  sessionStatus: "active" | "ended";
  transcript: TranscriptMessage[];
}

interface TurnMeta {
  turn: number;
  color: string;
  nodeCount: number;
  totalMs: number;
}

function ExecutionGraphInner({ graphConfig, timeline, sessionStatus, transcript }: Props) {
  const [selectedTurn, setSelectedTurn] = useState<number | "all">("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // All distinct turns that have node events
  const turns: TurnMeta[] = useMemo(() => {
    const nodeEvts = timeline.events.filter((e) => e.event_type === "node");
    const map = new Map<number, { count: number; ms: number }>();
    for (const e of nodeEvts) {
      const prev = map.get(e.turn) ?? { count: 0, ms: 0 };
      map.set(e.turn, { count: prev.count + 1, ms: prev.ms + (e.duration_ms ?? 0) });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([turn, { count, ms }]) => ({
        turn,
        color: turnColor(turn),
        nodeCount: count,
        totalMs: ms,
      }));
  }, [timeline.events]);

  const llmEvents = useMemo(
    () => timeline.events.filter((e) => e.event_type === "llm"),
    [timeline.events],
  );

  const errorEvent = useMemo(
    () => timeline.events.find((e) => e.event_type === "error"),
    [timeline.events],
  );

  // Build base graph from config (stable) — show goto dashed links in execution view
  const { nodes: baseNodes, edges: baseEdges, viewport } = useMemo(
    () => toFlowGraph(graphConfig, { showGotoLinks: true }),
    [graphConfig],
  );

  // ── Single-turn execution map ─────────────────────────────────────────────
  const singleTurnExecutionMap = useMemo(() => {
    if (selectedTurn === "all") return null;
    const color = turnColor(selectedTurn);
    const evts = timeline.events.filter(
      (e) => e.event_type === "node" && e.turn === selectedTurn,
    );
    const map = new Map<string, { order: number; duration_ms: number | null; status: string; error: string | null; tokens?: number; color: string }>();
    evts.forEach((e, i) => {
      const llm = llmEvents.find((l) => l.data.parent_node === e.name);
      map.set(e.name, {
        order: i + 1,
        duration_ms: e.duration_ms,
        status: e.status,
        error: e.error,
        tokens: llm ? (llm.data.total_tokens as number) : undefined,
        color,
      });
    });
    return map;
  }, [selectedTurn, timeline.events, llmEvents]);

  // ── All-turns map ────────────────────────────────────────────────────────
  const allTurnsVisitedMap = useMemo(() => {
    if (selectedTurn !== "all") return null;
    const nodeEvts = timeline.events.filter((e) => e.event_type === "node");
    const byNode = new Map<string, TurnVisit[]>();
    const turnOrderCounters = new Map<number, number>();
    for (const e of nodeEvts) {
      const ord = (turnOrderCounters.get(e.turn) ?? 0) + 1;
      turnOrderCounters.set(e.turn, ord);
      const llm = llmEvents.find((l) => l.data.parent_node === e.name && l.turn === e.turn);
      const visit: TurnVisit = {
        turn: e.turn,
        color: turnColor(e.turn),
        order: ord,
        duration_ms: e.duration_ms,
        status: e.status as TurnVisit["status"],
        error: e.error,
        tokens: llm ? (llm.data.total_tokens as number) : undefined,
      };
      const existing = byNode.get(e.name) ?? [];
      byNode.set(e.name, [...existing, visit]);
    }
    return byNode;
  }, [selectedTurn, timeline.events, llmEvents]);

  // ── Goto pointed-to pass ─────────────────────────────────────────────────
  const gotoPointedTargets = useMemo(() => {
    if (selectedTurn === "all") return new Map<string, TurnVisit>();
    const color = turnColor(selectedTurn);
    const map = new Map<string, TurnVisit>();
    const visitedGotoIds = new Set(singleTurnExecutionMap?.keys() ?? []);
    for (const node of baseNodes) {
      if (node.type === "gotoNode" && visitedGotoIds.has(node.id)) {
        const targetId = (node.data.config as { target?: string })?.target;
        if (targetId && !singleTurnExecutionMap?.has(targetId)) {
          map.set(targetId, {
            turn: selectedTurn,
            color,
            order: 0,
            duration_ms: null,
            status: "pointed_to",
            error: null,
          });
        }
      }
    }
    return map;
  }, [selectedTurn, singleTurnExecutionMap, baseNodes]);

  const isExecutionMode = timeline.events.some((e) => e.event_type === "node");
  const hasError = !!errorEvent;
  const isComplete = sessionStatus === "ended" && !hasError;
  const isActive = sessionStatus === "active" && !hasError;

  // Goto node id → real target node id (for traversal coloring of goto edges)
  const gotoTargetMap = useMemo(() => {
    const m = new Map<string, string>();
    baseNodes
      .filter((n) => n.type === "gotoNode")
      .forEach((n) => m.set(n.id, (n.data.config as { target?: string })?.target ?? ""));
    return m;
  }, [baseNodes]);

  const gotoNodeIds = useMemo(() => new Set(gotoTargetMap.keys()), [gotoTargetMap]);

  // ── Color edges by traversal ──────────────────────────────────────────────
  const traversedEdgeMap = useMemo(() => {
    const map = new Map<string, { color: string; animated: boolean; step?: number }>();
    const nodeEvts = timeline.events.filter((e) => e.event_type === "node");

    const applyTurn = (names: string[], color: string, trackStep: boolean) => {
      const nameSet = new Set(names);
      const pairSteps = new Map<string, number>();
      for (let i = 0; i < names.length - 1; i++) {
        const key = `${names[i]}→${names[i + 1]}`;
        if (!pairSteps.has(key)) pairSteps.set(key, i + 2);
      }
      for (const edge of baseEdges) {
        if (gotoNodeIds.has(edge.target)) {
          // Goto edges: the loop-back runs at the next turn's start, not this one.
          // If the source ran this turn, the goto was taken.
          if (nameSet.has(edge.source)) {
            map.set(edge.id, {
              color,
              animated: true,
              step: trackStep ? names.lastIndexOf(edge.source) + 2 : undefined,
            });
          }
        } else {
          const key = `${edge.source}→${edge.target}`;
          if (pairSteps.has(key)) {
            map.set(edge.id, { color, animated: true, step: trackStep ? pairSteps.get(key) : undefined });
          }
        }
      }
    };

    if (selectedTurn !== "all") {
      const filtered = nodeEvts.filter((e) => e.turn === selectedTurn);
      applyTurn(filtered.map((e) => e.name), turnColor(selectedTurn), true);
    } else {
      const byTurn = new Map<number, string[]>();
      for (const e of nodeEvts) {
        const arr = byTurn.get(e.turn) ?? [];
        arr.push(e.name);
        byTurn.set(e.turn, arr);
      }
      for (const [turn, names] of byTurn) {
        applyTurn(names, turnColor(turn), false);
      }
    }
    return map;
  }, [timeline.events, baseEdges, selectedTurn, gotoNodeIds]);


  // goto node id → traversed boolean for the current view
  const gotoTraversedSet = useMemo(() => {
    const s = new Set<string>();
    for (const [gotoId] of gotoTargetMap) {
      const incomingEdge = baseEdges.find((e) => e.target === gotoId);
      if (!incomingEdge) continue;
      if (traversedEdgeMap.has(incomingEdge.id)) s.add(gotoId);
    }
    return s;
  }, [gotoTargetMap, baseEdges, traversedEdgeMap]);

  // ── Apply overlays to nodes ───────────────────────────────────────────────
  const overlayNodes: AgentFlowNode[] = useMemo(
    () =>
      baseNodes.map((node) => {
        // Goto nodes: show step badge if this loop was traversed in the current view
        if (node.type === "gotoNode") {
          return {
            ...node,
            draggable: false,
            selectable: false,
            data: {
              ...node.data,
              isExecutionMode,
              executionTraversed: gotoTraversedSet.has(node.id),
            },
          };
        }
        if (selectedTurn === "all") {
          const turnsVisited = allTurnsVisitedMap?.get(node.id) ?? [];
          return {
            ...node,
            draggable: false,
            selectable: true,
            selected: node.id === selectedNodeId,
            data: { ...node.data, isExecutionMode, execution: null, turnsVisited },
          };
        }
        const exec = singleTurnExecutionMap?.get(node.id) ?? null;
        const pointedTo = !exec ? (gotoPointedTargets.get(node.id) ?? null) : null;
        return {
          ...node,
          draggable: false,
          selectable: true,
          selected: node.id === selectedNodeId,
          data: {
            ...node.data,
            isExecutionMode,
            execution: exec,
            turnsVisited: pointedTo ? [pointedTo] : [],
          },
        };
      }),
    [baseNodes, selectedTurn, allTurnsVisitedMap, singleTurnExecutionMap, isExecutionMode, gotoPointedTargets, selectedNodeId, gotoTraversedSet],
  );

  const overlayEdges: AgentFlowEdge[] = useMemo(
    () =>
      baseEdges
        // Hide goto_link duplicates — the real goto node + its edge are now shown
        .filter((edge) => !edge.id.endsWith("_goto_link"))
        .map((edge) => {
          const traversal = traversedEdgeMap.get(edge.id);
          const isGotoEdge = gotoNodeIds.has(edge.target);
          return {
            ...edge,
            animated: traversal?.animated ?? false,
            // Never show a label on goto edges — the step badge lives on the GotoNode
            label: isGotoEdge ? undefined : (edge.label ?? undefined),
            labelStyle: isGotoEdge ? undefined : edge.labelStyle,
            labelBgStyle: isGotoEdge ? undefined : edge.labelBgStyle,
            style: traversal
              ? { stroke: traversal.color, strokeWidth: 2.5, opacity: 1 }
              : { opacity: isExecutionMode ? 0.15 : 1 },
            markerEnd: traversal
              ? { type: MarkerType.ArrowClosed, color: traversal.color }
              : edge.markerEnd,
          };
        }),
    [baseEdges, gotoNodeIds, traversedEdgeMap, isExecutionMode],
  );

  const formatMs = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-card shrink-0 flex-wrap">

        {isComplete && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 shrink-0">
            <CheckCircle className="h-3.5 w-3.5" />
            Completed
          </div>
        )}
        {hasError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 shrink-0">
            <AlertCircle className="h-3.5 w-3.5" />
            Error at &quot;{errorEvent?.name || "unknown"}&quot;
          </div>
        )}
        {isActive && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 shrink-0">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            In progress
          </div>
        )}

        {turns.length > 0 && (
          <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
            <button
              onClick={() => setSelectedTurn("all")}
              className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all
                ${selectedTurn === "all"
                  ? "bg-foreground/10 border-foreground/30 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
            >
              All
              <span className="text-[10px] opacity-60">· {turns.reduce((s, t) => s + t.nodeCount, 0)} steps</span>
            </button>

            <span className="text-border/60 text-xs shrink-0">|</span>

            {turns.map((t) => (
              <button
                key={t.turn}
                onClick={() => setSelectedTurn(t.turn)}
                className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all
                  ${selectedTurn === t.turn
                    ? "border-current"
                    : "border-transparent hover:border-current/40"
                  }`}
                style={{
                  color: t.color,
                  backgroundColor: selectedTurn === t.turn ? `${t.color}18` : undefined,
                }}
                title={`Turn ${t.turn + 1}: ${t.nodeCount} nodes · ${formatMs(t.totalMs)}`}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                T{t.turn + 1}
                <span className="opacity-60 text-[10px]">
                  · {t.nodeCount} steps
                  {t.totalMs > 0 && ` · ${formatMs(t.totalMs)}`}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0 ml-auto">
          {timeline.total_llm_tokens > 0 && (
            <span className="font-medium text-foreground/70">
              {timeline.total_llm_tokens.toLocaleString()} tokens
            </span>
          )}
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
      </div>

      {/* ── Graph canvas + debug panel ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={overlayNodes}
          edges={overlayEdges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          onNodeClick={(_, node) => {
            // Only selectable agent nodes (not group/goto)
            if (node.type !== "agentNode") return;
            setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          zoomOnScroll
          panOnDrag
          {...(viewport
            ? { defaultViewport: viewport }
            : { fitView: true, fitViewOptions: { padding: 0.25 } })}
          className="bg-background"
          onError={(code) => { if (code === "008") return; console.warn(`ReactFlow error ${code}`); }}
        >
          <Background gap={20} size={1} className="opacity-30" />
          <Controls className="!border-border/60 !bg-card !shadow-none" />
          <MiniMap
            className="!border-border/60 !bg-card"
            nodeColor={(n) => {
              const data = n.data as { execution?: { status: string } | null; turnsVisited?: TurnVisit[] };
              if (data.turnsVisited?.length) {
                const last = data.turnsVisited[data.turnsVisited.length - 1];
                if (last.status === "error") return "#ef4444";
                if (last.status === "interrupted") return "#f59e0b";
                return last.color;
              }
              if (!data.execution) return "hsl(var(--muted-foreground) / 0.2)";
              if (data.execution.status === "error") return "#ef4444";
              if (data.execution.status === "interrupted") return "#f59e0b";
              return "#22c55e";
            }}
          />
        </ReactFlow>

        {selectedNodeId && (
          <NodeDebugPanel
            nodeName={selectedNodeId}
            events={timeline.events}
            selectedTurn={selectedTurn}
            transcript={transcript}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}

export function ExecutionGraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <ExecutionGraphInner {...props} transcript={props.transcript ?? []} />
    </ReactFlowProvider>
  );
}
