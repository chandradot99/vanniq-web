"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
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
import type { AgentNodeData, NodeType } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES } from "../../utils/graph-transform";

const NODE_ICONS: Record<NodeType, React.ElementType> = {
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
  const { nodeType, config, isEntryPoint } = data;
  const colors = NODE_COLOR_CLASSES[nodeType];
  const Icon = NODE_ICONS[nodeType];
  const label = NODE_LABELS[nodeType];
  const preview = getConfigPreview(nodeType, config);
  const isTerminal = nodeType === "end_session";
  const isCondition = nodeType === "condition";
  const isHumanReview = nodeType === "human_review";
  const isMultiRoute = isCondition || isHumanReview;
  // condition: user-configured routes; human_review: always approve + reject
  const routes = isCondition
    ? (config.routes as Array<{ label: string }> | undefined) ?? []
    : isHumanReview
      ? [{ label: "approve" }, { label: "reject" }]
      : [];

  const { deleteElements, setNodes } = useReactFlow();

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEntryPoint) {
        deleteElements({ nodes: [{ id }] });
      }
    },
    [id, isEntryPoint, deleteElements],
  );

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
        ${selected ? "shadow-lg ring-2 ring-primary/30" : "hover:shadow-md"}
      `}
    >
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
              onMouseDown={handleDelete}
              className="h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
              title="Delete node"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Divider + preview */}
      <div className="px-3 pb-3 border-t border-border/40 pt-2">
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{preview}</p>
      </div>

      {/* Footer badges */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {isEntryPoint && (
          <Badge className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-green-500/15 text-green-600 border-green-500/30 border">
            Entry
          </Badge>
        )}
        {isTerminal && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
            Terminal
          </Badge>
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
