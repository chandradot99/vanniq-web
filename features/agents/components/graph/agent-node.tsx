"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
import {
  Brain,
  GitBranch,
  ClipboardList,
  Variable,
  Globe,
  Wrench,
  PhoneForwarded,
  CircleX,
  Search,
  Zap,
  Trash2,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AgentNodeData, NodeType, TurnVisit } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES, getNodeConfigError } from "../../utils/graph-transform";
import { modelShortLabel } from "./config-forms/model-picker";
import { useToolSchemas } from "./tool-schemas-context";

function formatMs(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const EXECUTION_RING: Record<string, string> = {
  success:     "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background",
  error:       "ring-2 ring-red-500 ring-offset-1 ring-offset-background",
  interrupted: "ring-2 ring-amber-500 ring-offset-1 ring-offset-background",
};

const NODE_ICONS: Partial<Record<NodeType, React.ElementType>> = {
  inbound_message: MessageCircle,
  llm_response: Brain,
  condition: GitBranch,
  human_review: UserCheck,
  collect_data: ClipboardList,
  set_variable: Variable,
  http_request: Globe,
  run_tool: Wrench,
  transfer_human: PhoneForwarded,
  end_session: CircleX,
  rag_search: Search,
  post_session_action: Zap,
};

function getConfigPreview(nodeType: NodeType, config: Record<string, unknown>): string {
  switch (nodeType) {
    case "llm_response":
      return (config.instructions as string) || "No instructions set";
    case "condition":
      return (config.router_prompt as string) || "No router prompt";
    case "collect_data": {
      const fields = config.fields as Array<{ name: string }> | undefined;
      return fields?.length ? `${fields.length} field(s): ${fields.map((f) => f.name).join(", ")}` : "No fields configured";
    }
    case "set_variable":
      return config.key ? `${config.key} = ${config.value}` : "No variable set";
    case "http_request":
      return config.url ? `${config.method} ${config.url}` : "No URL configured";
    case "run_tool":
      return (config.tool as string) || "No tool selected";
    case "transfer_human":
      return (config.transfer_number as string) || "No number configured";
    case "end_session":
      return (config.farewell_message as string) || "Default farewell";
    case "rag_search":
      return `top_k=${config.top_k ?? 5}, min_score=${config.min_score ?? 0.7}`;
    case "human_review":
      return (config.message as string) || "Waiting for approval";
    case "inbound_message":
      return "Waits for user message";
    case "post_session_action": {
      const actions = config.actions as string[] | undefined;
      return actions?.length ? actions.join(", ") : "No actions configured";
    }
    default:
      return "";
  }
}

interface AgentNodeProps {
  id: string;
  data: AgentNodeData;
  selected?: boolean;
}

export const AgentNode = memo(function AgentNode({ id, data, selected }: AgentNodeProps) {
  const toolSchemas = useToolSchemas();
  const { nodeType, config, isEntryPoint, execution, isExecutionMode } = data;
  const turnsVisited = (data.turnsVisited as TurnVisit[] | undefined) ?? [];
  const colors = NODE_COLOR_CLASSES[nodeType] ?? NODE_COLOR_CLASSES.group;
  const Icon = NODE_ICONS[nodeType] ?? MessageCircle;
  const label = data.label || NODE_LABELS[nodeType];
  const preview = getConfigPreview(nodeType, config);
  const configError = !isExecutionMode ? getNodeConfigError(nodeType, config, toolSchemas) : null;
  const isTerminal = nodeType === "end_session";
  const isCondition = nodeType === "condition";
  const isHumanReview = nodeType === "human_review";
  const isMultiRoute = isCondition || isHumanReview;

  // Execution overlay state
  // Multi-turn mode: derive ring from turnsVisited; single-turn: use execution status
  const isMultiTurn = turnsVisited.length > 0;
  const dimmed = isExecutionMode && !execution && !isMultiTurn;

  // True when this node is only a goto target (not yet executed in any turn)
  const isAllPointedTo = isMultiTurn && turnsVisited.every((v) => v.status === "pointed_to");

  // Ring: for multi-turn use last turn's color (errors always red)
  const multiTurnRingStyle = isMultiTurn
    ? (() => {
        const hasError = turnsVisited.some((v) => v.status === "error");
        const hasInterrupt = turnsVisited.some((v) => v.status === "interrupted");
        const color = hasError ? "#ef4444" : hasInterrupt ? "#f59e0b" : turnsVisited[turnsVisited.length - 1].color;
        if (isAllPointedTo) {
          return { outline: `2px dashed ${color}`, outlineOffset: "2px", opacity: 0.65 };
        }
        return { boxShadow: `0 0 0 1px hsl(var(--background)), 0 0 0 3px ${color}` };
      })()
    : undefined;
  const executionRing = !isMultiTurn && execution ? (EXECUTION_RING[execution.status] ?? "") : "";

  // Footer stats: multi-turn shows last turn's data; single shows execution
  const footerExec = isMultiTurn ? null : execution;
  const lastTurnVisit = isMultiTurn ? turnsVisited[turnsVisited.length - 1] : null;
  // condition: user-configured routes; human_review: always approve + reject
  const routes = isCondition
    ? (config.routes as Array<{ label: string }> | undefined) ?? []
    : isHumanReview
      ? [{ label: "approve" }, { label: "reject" }]
      : [];

  const updateNodeInternals = useUpdateNodeInternals();

  // Stable key covering both route count and labels — renaming a route must also
  // trigger re-registration so React Flow picks up the new handle id.
  const routeKey = routes.map((r) => r.label).join(",");

  // Re-register handles with React Flow whenever routes change OR when this node
  // is re-mounted (e.g. after being assigned to a group). Without this, dynamic
  // handles on condition/human_review nodes cause error #008 during edge validation.
  // We call updateNodeInternals twice: immediately after render AND after a
  // short timeout, because React Flow sometimes needs an extra frame to measure
  // the new handle DOM positions before they become connectable.
  useEffect(() => {
    updateNodeInternals(id);
    const t = setTimeout(() => updateNodeInternals(id), 50);
    return () => clearTimeout(t);
  }, [id, updateNodeInternals, routeKey, data.nodeType]);

  const { deleteElements, setNodes } = useReactFlow();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setConfirmingDelete(true); }, []);
  const handleConfirmDelete = useCallback(() => {
    setConfirmingDelete(false);
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);
  const handleCancelDelete = useCallback(() => setConfirmingDelete(false), []);

  const handleSetEntryPoint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, isEntryPoint: n.id === id } })),
      );
    },
    [id, setNodes],
  );

  return (
    <div
      className={`
        group w-56 rounded-xl border bg-card shadow-sm transition-all duration-150
        ${colors.border}
        ${!isExecutionMode && selected ? "shadow-lg ring-2 ring-primary/30" : ""}
        ${!isExecutionMode ? "hover:shadow-md" : ""}
        ${executionRing}
        ${dimmed ? "opacity-30 grayscale" : ""}
      `}
      style={multiTurnRingStyle}
    >
      {/* Config error indicator — shown in builder mode only */}
      {configError && (
        <div
          className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center shadow z-10"
          title={configError}
        >
          <span className="text-white text-[9px] font-bold leading-none">!</span>
        </div>
      )}

      {/* Single-turn execution order badge */}
      {!isMultiTurn && execution && (
        <div className={`absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow z-10
          ${execution.status === "error" ? "bg-red-500" : execution.status === "interrupted" ? "bg-amber-500" : "bg-emerald-500"}`}>
          {execution.order}
        </div>
      )}

      {/* Multi-turn visit dots — one per turn, showing turn number */}
      {isMultiTurn && (
        <div className="absolute -top-2.5 -right-1 flex gap-0.5 z-10">
          {turnsVisited.map((tv) => {
            const isPointedTo = tv.status === "pointed_to";
            const dotColor = tv.status === "error" ? "#ef4444" : tv.status === "interrupted" ? "#f59e0b" : tv.color;
            return (
              <div
                key={tv.turn}
                className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow"
                style={isPointedTo
                  ? { border: `2px dashed ${dotColor}`, color: dotColor, backgroundColor: "transparent" }
                  : { backgroundColor: dotColor, color: "#fff" }
                }
                title={isPointedTo
                  ? `Entry point for next turn (T${tv.turn + 1})`
                  : `Turn ${tv.turn + 1} · step ${tv.order}${tv.duration_ms != null ? ` · ${tv.duration_ms < 1000 ? `${tv.duration_ms}ms` : `${(tv.duration_ms / 1000).toFixed(1)}s`}` : ""}${tv.tokens ? ` · ${tv.tokens} tok` : ""}`
                }
              >
                {tv.turn + 1}
              </div>
            );
          })}
        </div>
      )}
      {/* Left target handle — all nodes except the entry point */}
      {!isEntryPoint && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-border !bg-background hover:!bg-primary"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-7 w-7 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">{label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{nodeType}</p>
          </div>
        </div>

        {!isExecutionMode && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEntryPoint && (
              <button
                onMouseDown={handleSetEntryPoint}
                className="h-5 w-5 rounded text-[9px] font-bold text-muted-foreground hover:text-green-500 hover:bg-green-500/10 flex items-center justify-center transition-colors"
                title="Set as entry point"
              >
                ↑
              </button>
            )}
            {!isEntryPoint && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleDeleteClick}
                className="h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <ConfirmDialog
          open={confirmingDelete}
          title="Delete node?"
          description="This will remove the node and all its connections. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>

      {/* Divider + preview */}
      <div className="px-3 pb-3 border-t border-border/40 pt-2 space-y-1">
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{preview}</p>
        {config.model && (
          <p className="text-[9px] font-mono text-muted-foreground/50 truncate">
            {modelShortLabel(config.provider as string | undefined, config.model as string)}
          </p>
        )}
      </div>

      {/* Footer badges */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {isEntryPoint && !isExecutionMode && (
          <Badge className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-green-500/15 text-green-600 border-green-500/30 border">
            Entry
          </Badge>
        )}
        {isTerminal && !isExecutionMode && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
            Terminal
          </Badge>
        )}
        {/* Single-turn: duration + tokens from execution */}
        {footerExec?.duration_ms != null && (
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ml-auto
            ${footerExec.status === "error" ? "text-red-500 border-red-500/30" :
              footerExec.status === "interrupted" ? "text-amber-500 border-amber-500/30" :
              "text-emerald-600 border-emerald-500/30"}`}>
            {formatMs(footerExec.duration_ms)}
          </Badge>
        )}
        {footerExec?.tokens != null && footerExec.tokens > 0 && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-violet-500 border-violet-500/30">
            {footerExec.tokens} tok
          </Badge>
        )}
        {footerExec?.status === "error" && (
          <p className="text-[9px] text-red-500 truncate w-full mt-0.5" title={footerExec.error ?? ""}>
            {footerExec.error?.split("\n").pop() ?? "Error"}
          </p>
        )}
        {/* Multi-turn: last turn's duration + any error */}
        {lastTurnVisit?.duration_ms != null && (
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ml-auto
            ${lastTurnVisit.status === "error" ? "text-red-500 border-red-500/30" :
              lastTurnVisit.status === "interrupted" ? "text-amber-500 border-amber-500/30" :
              "text-muted-foreground border-border"}`}>
            {formatMs(lastTurnVisit.duration_ms)}
          </Badge>
        )}
        {lastTurnVisit?.tokens != null && lastTurnVisit.tokens > 0 && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-violet-500 border-violet-500/30">
            {lastTurnVisit.tokens} tok
          </Badge>
        )}
        {lastTurnVisit?.status === "error" && (
          <p className="text-[9px] text-red-500 truncate w-full mt-0.5" title={lastTurnVisit.error ?? ""}>
            {lastTurnVisit.error?.split("\n").pop() ?? "Error"}
          </p>
        )}
      </div>

      {/* Right source handle(s) — multi-route nodes get one labeled handle per route */}
      {!isTerminal && !isMultiRoute && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-border !bg-background hover:!bg-primary"
        />
      )}

      {isMultiRoute && routes.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-border !bg-background hover:!bg-primary"
        />
      )}

      {isMultiRoute && routes.length > 0 &&
        routes.map((route, i) => (
          <Handle
            key={route.label}
            type="source"
            position={Position.Right}
            id={route.label}
            style={{ top: `${((i + 1) / (routes.length + 1)) * 100}%` }}
            className="!h-3 !w-3 !border-2 !border-border !bg-background hover:!bg-primary"
            title={route.label}
          />
        ))}
    </div>
  );
});
