"use client";

import { useState } from "react";
import {
  Play,
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
  UserCheck,
  Layers,
  CornerUpLeft,
} from "lucide-react";
import type { NodeType } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES } from "../../utils/graph-transform";

interface PaletteCategory {
  label: string;
  nodes: NodeType[];
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    label: "Entry",
    nodes: ["start"],
  },
  {
    label: "Input",
    nodes: ["inbound_message"],
  },
  {
    label: "Logic",
    nodes: ["llm_response", "condition", "collect_data", "set_variable"],
  },
  {
    label: "Human-in-the-Loop",
    nodes: ["human_review"],
  },
  {
    label: "Actions",
    nodes: ["run_tool", "http_request", "transfer_human"],
  },
  {
    label: "Data",
    nodes: ["rag_search"],
  },
  {
    label: "Session",
    nodes: ["end_session", "post_session_action"],
  },
  {
    label: "Flow Control",
    nodes: ["goto"],
  },
  {
    label: "Layout",
    nodes: ["group"],
  },
];

const PALETTE_ICONS: Partial<Record<NodeType, React.ElementType>> = {
  start: Play,
  group: Layers,
  goto: CornerUpLeft,
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
      <div className={`flex-1 overflow-y-auto ${collapsed ? "p-1.5 space-y-1" : "py-3 space-y-4"}`}>
        {collapsed ? (
          // Collapsed: flat icon list, no categories
          PALETTE_CATEGORIES.flatMap((cat) => cat.nodes).map((nodeType) => {
            const colors = NODE_COLOR_CLASSES[nodeType] ?? NODE_COLOR_CLASSES.group;
            const Icon = PALETTE_ICONS[nodeType] ?? Layers;
            return (
              <div
                key={nodeType}
                draggable
                onDragStart={(e) => onDragStart(e, nodeType)}
                title={NODE_LABELS[nodeType]}
                className="flex items-center justify-center rounded-lg border border-border/50 bg-background cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-accent transition-all duration-150 select-none p-1.5"
              >
                <div className={`h-6 w-6 rounded ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-3 w-3 ${colors.icon}`} />
                </div>
              </div>
            );
          })
        ) : (
          // Expanded: categorized sections
          PALETTE_CATEGORIES.map((category) => (
            <div key={category.label} className="px-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-0.5">
                {category.label}
              </p>
              {category.nodes.map((nodeType) => {
                const colors = NODE_COLOR_CLASSES[nodeType] ?? NODE_COLOR_CLASSES.group;
                const Icon = PALETTE_ICONS[nodeType] ?? Layers;
                return (
                  <div
                    key={nodeType}
                    draggable
                    onDragStart={(e) => onDragStart(e, nodeType)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-background cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-accent transition-all duration-150 select-none"
                  >
                    <div className={`h-6 w-6 rounded ${colors.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3 w-3 ${colors.icon}`} />
                    </div>
                    <span className="text-xs font-medium leading-tight">{NODE_LABELS[nodeType]}</span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
