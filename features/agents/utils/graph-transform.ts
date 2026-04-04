import type { Node, Edge } from "@xyflow/react";
import type { GraphConfig, GraphNode, GraphEdge, GraphGroup } from "@/types";
import { MarkerType } from "@xyflow/react";

export type NodeType =
  | "inbound_message"
  | "llm_response"
  | "condition"
  | "human_review"
  | "collect_data"
  | "set_variable"
  | "http_request"
  | "run_tool"
  | "transfer_human"
  | "end_session"
  | "rag_search"
  | "post_session_action"
  | "group"
  | "goto";

export const NODE_LABELS: Record<NodeType, string> = {
  group: "Group",
  goto: "Go To",
  inbound_message: "Inbound Message",
  llm_response: "LLM Response",
  condition: "Condition",
  human_review: "Human Review",
  collect_data: "Collect Data",
  set_variable: "Set Variable",
  http_request: "HTTP Request",
  run_tool: "Run Tool",
  transfer_human: "Transfer Human",
  end_session: "End Session",
  rag_search: "RAG Search",
  post_session_action: "Post-Session Action",
};

export const NODE_COLORS: Record<NodeType, string> = {
  group: "slate",
  goto: "indigo",
  inbound_message: "sky",
  llm_response: "violet",
  condition: "amber",
  human_review: "yellow",
  collect_data: "blue",
  set_variable: "teal",
  http_request: "orange",
  run_tool: "green",
  transfer_human: "rose",
  end_session: "red",
  rag_search: "indigo",
  post_session_action: "purple",
};

// Tailwind color classes for each node type
export const NODE_COLOR_CLASSES: Record<NodeType, { border: string; bg: string; icon: string }> = {
  group: { border: "border-slate-400/40", bg: "bg-slate-500/5", icon: "text-slate-500" },
  goto: { border: "border-indigo-500/60", bg: "bg-indigo-500/10", icon: "text-indigo-500" },
  inbound_message: { border: "border-sky-500/60", bg: "bg-sky-500/10", icon: "text-sky-500" },
  llm_response: { border: "border-violet-500/60", bg: "bg-violet-500/10", icon: "text-violet-500" },
  condition: { border: "border-amber-500/60", bg: "bg-amber-500/10", icon: "text-amber-500" },
  human_review: { border: "border-yellow-500/60", bg: "bg-yellow-500/10", icon: "text-yellow-600" },
  collect_data: { border: "border-blue-500/60", bg: "bg-blue-500/10", icon: "text-blue-500" },
  set_variable: { border: "border-teal-500/60", bg: "bg-teal-500/10", icon: "text-teal-500" },
  http_request: { border: "border-orange-500/60", bg: "bg-orange-500/10", icon: "text-orange-500" },
  run_tool: { border: "border-green-500/60", bg: "bg-green-500/10", icon: "text-green-500" },
  transfer_human: { border: "border-rose-500/60", bg: "bg-rose-500/10", icon: "text-rose-500" },
  end_session: { border: "border-red-500/60", bg: "bg-red-500/10", icon: "text-red-500" },
  rag_search: { border: "border-indigo-500/60", bg: "bg-indigo-500/10", icon: "text-indigo-500" },
  post_session_action: { border: "border-purple-500/60", bg: "bg-purple-500/10", icon: "text-purple-500" },
};

export interface AgentNodeData {
  nodeType: NodeType;
  label: string;           // user-editable display name, defaults to NODE_LABELS[nodeType]
  config: Record<string, unknown>;
  isEntryPoint: boolean;
  [key: string]: unknown;
}

export type AgentFlowNode = Node<AgentNodeData>;
export type AgentFlowEdge = Edge;

// Convert backend GraphConfig → React Flow nodes/edges
export function toFlowGraph(config: GraphConfig): { nodes: AgentFlowNode[]; edges: AgentFlowEdge[]; viewport?: { x: number; y: number; zoom: number } } {
  // Reconstruct group nodes first (they must exist before children reference them)
  const groupNodes: AgentFlowNode[] = (config.groups ?? []).map((g) => ({
    id: g.id,
    type: "groupNode",
    position: g.position,
    style: { width: g.width, height: g.height },
    data: {
      nodeType: "group" as NodeType,
      label: g.label,
      colorIndex: g.color_index,
      config: {},
      isEntryPoint: false,
    },
  }));

  const nodes: AgentFlowNode[] = config.nodes.map((n, index) => ({
    id: n.id,
    type: "agentNode",
    position: n.position ?? { x: 100 + index * 280, y: 200 },
    // Restore parent relationship — child positions are already relative in the saved data
    ...(n.parent_id ? { parentId: n.parent_id, extent: "parent" as const } : {}),
    data: {
      nodeType: n.type as NodeType,
      label: n.label ?? NODE_LABELS[n.type as NodeType] ?? n.type,
      config: n.config,
      isEntryPoint: n.id === config.entry_point,
    },
  }));

  // Groups must come first so React Flow renders them beneath their children
  const allNodes = [...groupNodes, ...nodes];

  // Convert edges: goto edges become a gotoNode + a forward edge to it
  const gotoNodes: AgentFlowNode[] = [];
  const edges: AgentFlowEdge[] = [];

  for (const e of config.edges) {
    if (e.goto) {
      // Find source node to position the goto node just to its right
      const sourceNode = allNodes.find((n) => n.id === e.source);
      const sourceParent = sourceNode?.parentId
        ? allNodes.find((n) => n.id === sourceNode.parentId)
        : null;
      const absX = (sourceNode?.position.x ?? 0) + (sourceParent?.position.x ?? 0);
      const absY = (sourceNode?.position.y ?? 0) + (sourceParent?.position.y ?? 0);

      const gotoNodeId = `goto_${e.id}`;
      gotoNodes.push({
        id: gotoNodeId,
        type: "gotoNode",
        position: { x: absX + 280, y: absY },
        data: {
          nodeType: "goto",
          label: "Go To",
          config: { target: e.target },
          isEntryPoint: false,
        },
      });

      edges.push({
        id: e.id,
        source: e.source,
        target: gotoNodeId,
        sourceHandle: e.condition ?? undefined,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        label: e.condition,
        data: e.condition ? { condition: e.condition } : undefined,
      });
    } else {
      edges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.condition ?? undefined,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: e.condition ? { condition: e.condition } : undefined,
        label: e.condition,
      });
    }
  }

  return { nodes: [...allNodes, ...gotoNodes], edges, viewport: config.viewport };
}

// Convert React Flow nodes/edges → backend GraphConfig
export function toGraphConfig(
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
  viewport?: { x: number; y: number; zoom: number },
): { entry_point: string; nodes: GraphNode[]; edges: GraphEdge[]; groups: GraphGroup[]; viewport?: { x: number; y: number; zoom: number } } {
  const gotoNodeIds = new Set(nodes.filter((n) => n.type === "gotoNode").map((n) => n.id));

  const entryNode =
    nodes.find((n) => n.data.isEntryPoint && n.type !== "groupNode" && n.type !== "gotoNode") ??
    nodes.find((n) => n.type !== "groupNode" && n.type !== "gotoNode");

  // Serialize group nodes into their own array (backend ignores them at runtime).
  // After NodeResizer is used, dimensions land in node.width / node.height (not style),
  // so we check both locations.
  const groups: GraphGroup[] = nodes
    .filter((n) => n.type === "groupNode")
    .map((n) => ({
      id: n.id,
      label: (n.data.label as string) ?? "Group",
      color_index: (n.data.colorIndex as number) ?? 0,
      position: n.position,
      width: (n.width as number) ?? (n.style?.width as number) ?? 400,
      height: (n.height as number) ?? (n.style?.height as number) ?? 240,
    }));

  // Only serialize real agent nodes (not groups, not goto nodes)
  const backendNodes: GraphNode[] = nodes
    .filter((n) => n.type !== "groupNode" && n.type !== "gotoNode")
    .map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      position: n.position,
      // preserve parent_id so child positions (which are relative) load correctly
      ...(n.parentId ? { parent_id: n.parentId } : {}),
      config: n.data.config,
    }));

  const backendEdges: GraphEdge[] = [];
  for (const e of edges) {
    const condition = (e.sourceHandle as string | null | undefined) || (e.data?.condition as string | undefined);

    if (gotoNodeIds.has(e.target)) {
      // Edge points to a goto node — convert to a goto edge pointing at the real target
      const gotoNode = nodes.find((n) => n.id === e.target);
      const realTarget = gotoNode?.data.config?.target as string | undefined;
      if (realTarget) {
        backendEdges.push({
          id: e.id,
          source: e.source,
          target: realTarget,
          goto: true,
          ...(condition ? { condition } : {}),
        });
      }
    } else {
      backendEdges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        ...(condition ? { condition } : {}),
      });
    }
  }

  return {
    entry_point: entryNode?.id ?? "",
    nodes: backendNodes,
    edges: backendEdges,
    groups,
    ...(viewport ? { viewport } : {}),
  };
}

// Default empty config per node type
export const DEFAULT_NODE_CONFIGS: Record<NodeType, Record<string, unknown>> = {
  group: {},
  goto: { target: "" },
  inbound_message: {},
  llm_response: { instructions: "", rag_enabled: false, tools: [] },
  condition: { router_prompt: "", routes: [] },
  human_review: { message: "Please review and approve this action.", context_variable: "" },
  collect_data: { fields: [] },
  set_variable: { key: "", value: "" },
  http_request: { method: "GET", url: "", headers: {}, timeout_seconds: 30 },
  run_tool: { tool: "", input: {} },
  transfer_human: { transfer_number: "", whisper_template: "" },
  end_session: { farewell_message: "" },
  rag_search: { top_k: 5, min_score: 0.7, query: "" },
  post_session_action: { actions: [] },
};
