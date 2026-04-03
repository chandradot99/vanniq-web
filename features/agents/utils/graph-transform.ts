import type { Node, Edge } from "@xyflow/react";
import type { GraphConfig, GraphNode, GraphEdge } from "@/types";
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
  | "post_session_action";

export const NODE_LABELS: Record<NodeType, string> = {
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
  config: Record<string, unknown>;
  isEntryPoint: boolean;
  [key: string]: unknown;
}

export type AgentFlowNode = Node<AgentNodeData>;
export type AgentFlowEdge = Edge;

// Convert backend GraphConfig → React Flow nodes/edges
export function toFlowGraph(config: GraphConfig): { nodes: AgentFlowNode[]; edges: AgentFlowEdge[] } {
  const nodes: AgentFlowNode[] = config.nodes.map((n, index) => ({
    id: n.id,
    type: "agentNode",
    position: n.position ?? { x: 100 + index * 280, y: 200 },
    data: {
      nodeType: n.type as NodeType,
      config: n.config,
      isEntryPoint: n.id === config.entry_point,
    },
  }));

  const edges: AgentFlowEdge[] = config.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    // condition maps to the source handle ID on condition/human_review nodes
    sourceHandle: e.condition ?? null,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    data: e.condition ? { condition: e.condition } : undefined,
    label: e.condition,
  }));

  return { nodes, edges };
}

// Convert React Flow nodes/edges → backend GraphConfig
export function toGraphConfig(
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
): { entry_point: string; nodes: GraphNode[]; edges: GraphEdge[] } {
  const entryNode = nodes.find((n) => n.data.isEntryPoint) ?? nodes[0];

  const backendNodes: GraphNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    position: n.position,
    config: n.data.config,
  }));

  const backendEdges: GraphEdge[] = edges.map((e) => {
    // sourceHandle is the route label on condition/human_review edges; serialize back to condition
    const condition = (e.sourceHandle as string | null | undefined) || (e.data?.condition as string | undefined);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      ...(condition ? { condition } : {}),
    };
  });

  return {
    entry_point: entryNode?.id ?? "",
    nodes: backendNodes,
    edges: backendEdges,
  };
}

// Default empty config per node type
export const DEFAULT_NODE_CONFIGS: Record<NodeType, Record<string, unknown>> = {
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
