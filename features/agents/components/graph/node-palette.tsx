"use client";

import { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
} from "lucide-react";
import type { NodeType } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES } from "../../utils/graph-transform";

const PALETTE_NODES: NodeType[] = [
  "inbound_message",
  "llm_response",
  "condition",
  "collect_data",
  "set_variable",
  "http_request",
  "run_tool",
  "transfer_human",
  "end_session",
  "rag_search",
  "post_session_action",
];

const PALETTE_ICONS: Record<NodeType, React.ElementType> = {
  inbound_message: MessageCircle,
  llm_response: Brain,
  condition: GitBranch,
  collect_data: ClipboardList,
  set_variable: Variable,
  http_request: Globe,
  run_tool: Wrench,
  transfer_human: PhoneForwarded,
  end_session: CircleX,
  rag_search: Search,
  post_session_action: Zap,
};

export function NodePalette() {
  const [collapsed, setCollapsed] = useState(false);

  function onDragStart(e: React.DragEvent, nodeType: NodeType) {
    e.dataTransfer.setData("application/vaaniq-node-type", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      className={`${collapsed ? "w-12" : "w-52"} border-r border-border/60 bg-card flex flex-col overflow-hidden transition-all duration-200 shrink-0`}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-border/60 shrink-0 ${collapsed ? "justify-center py-3" : "px-4 py-3 justify-between"}`}>
        {!collapsed && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nodes</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Drag onto canvas</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          title={collapsed ? "Expand palette" : "Collapse palette"}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Node list */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? "p-1.5 space-y-1" : "p-3 space-y-1"}`}>
        {PALETTE_NODES.map((nodeType) => {
          const colors = NODE_COLOR_CLASSES[nodeType];
          const Icon = PALETTE_ICONS[nodeType];
          return (
            <div
              key={nodeType}
              draggable
              onDragStart={(e) => onDragStart(e, nodeType)}
              title={collapsed ? NODE_LABELS[nodeType] : undefined}
              className={`flex items-center rounded-lg border border-border/50 bg-background cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-accent transition-all duration-150 select-none ${
                collapsed ? "justify-center p-1.5" : "gap-2.5 px-3 py-2"
              }`}
            >
              <div className={`h-6 w-6 rounded ${colors.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-3 w-3 ${colors.icon}`} />
              </div>
              {!collapsed && (
                <span className="text-xs font-medium leading-tight">{NODE_LABELS[nodeType]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
