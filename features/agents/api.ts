import { api } from "@/lib/api";
import type { Agent, GraphNode, GraphEdge, Guard } from "@/types";

export interface CreateAgentInput {
  name: string;
  system_prompt: string;
  language: string;
  simple_mode: boolean;
}

export interface UpdateAgentInput {
  name?: string;
  language?: string;
  system_prompt?: string;
}

export interface UpdateGraphInput {
  entry_point: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  guards?: Guard[];
}

export interface ChatMessage {
  role: "agent" | "user";
  content: string;
}

export interface StartChatResponse {
  session_id: string;
  messages: ChatMessage[];
  session_ended: boolean;
}

export interface SendMessageResponse {
  messages: ChatMessage[];
  session_ended: boolean;
}

export const chatApi = {
  start: (agentId: string): Promise<StartChatResponse> =>
    api.post(`/v1/chat/${agentId}/start`),
  sendMessage: (sessionId: string, message: string): Promise<SendMessageResponse> =>
    api.post("/v1/chat/message", { session_id: sessionId, message }),
};

export const agentsApi = {
  list: (): Promise<Agent[]> => api.get("/v1/agents"),
  getById: (id: string): Promise<Agent> => api.get(`/v1/agents/${id}`),
  create: (data: CreateAgentInput): Promise<Agent> => api.post("/v1/agents", data),
  update: (id: string, data: UpdateAgentInput): Promise<Agent> => api.patch(`/v1/agents/${id}`, data),
  updateGraph: (id: string, graph: UpdateGraphInput): Promise<Agent> => api.put(`/v1/agents/${id}/graph`, { graph_config: graph }),
  delete: (id: string): Promise<void> => api.delete(`/v1/agents/${id}`),
};
