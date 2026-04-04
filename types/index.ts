// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  org_id: string;
  role: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  org_id: string;
  org_name: string;
  role: string;
}

// ── Agents ────────────────────────────────────────────────────────────────────

export interface GraphConfig {
  entry_point: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  guards?: Guard[];
  groups?: GraphGroup[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface GraphGroup {
  id: string;
  label: string;
  color_index: number;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface GraphNode {
  id: string;
  type: string;
  label?: string;
  position?: { x: number; y: number };
  parent_id?: string;
  config: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  goto?: boolean;
}

export interface Guard {
  condition_prompt: string;
  action: string;
  target_node: string;
}

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  system_prompt: string;
  voice_id: string | null;
  language: string;
  simple_mode: boolean;
  graph_config: GraphConfig | null;
  created_at: string;
  updated_at: string;
}

// ── Integrations ──────────────────────────────────────────────────────────────

export interface Integration {
  id: string;
  org_id: string;
  provider: string;
  category: string;
  display_name: string;
  config: Record<string, unknown>;
  status: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface TestIntegrationResponse {
  valid: boolean;
  tested: boolean;
  error: string | null;
}

// ── Sessions / Debugging ──────────────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  agent_id: string;
  status: "active" | "ended";
  channel: string;
  message_count: number;
  tool_call_count: number;
  duration_seconds: number | null;
  sentiment: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface TranscriptMessage {
  role: string;
  content: string;
  timestamp?: string;
  node_id?: string;
}

export interface ToolCallDetail {
  tool_name: string;
  input: Record<string, unknown>;
  output: unknown;
  called_at: string;
  success: boolean;
}

export interface SessionDetail {
  id: string;
  agent_id: string;
  status: "active" | "ended";
  channel: string;
  duration_seconds: number | null;
  sentiment: string | null;
  summary: string | null;
  meta: Record<string, unknown>;
  transcript: TranscriptMessage[];
  tool_calls: ToolCallDetail[];
  created_at: string;
  ended_at: string | null;
}

export interface SessionListResponse {
  sessions: SessionSummary[];
  total: number;
}

export interface SessionEvent {
  id: string;
  turn: number;
  seq: number;
  event_type: "node" | "llm" | "tool" | "error" | "interrupt";
  name: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  status: "success" | "error" | "interrupted";
  data: Record<string, unknown>;
  error: string | null;
}

export interface SessionTimeline {
  session_id: string;
  events: SessionEvent[];
  total_turns: number;
  total_llm_tokens: number;
  total_duration_ms: number;
}

// ── Admin / Platform Configs ──────────────────────────────────────────────────

export interface FieldSchema {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder: string;
  default: string;
}

export interface ProviderSchema {
  provider: string;
  display_name: string;
  category: string;
  description: string;
  fields: FieldSchema[];
}

export interface PlatformConfig {
  id: string;
  provider: string;
  display_name: string;
  category: string;
  config: Record<string, string>;
  enabled: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface ToolInfo {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  required_integration: string | null;
}
