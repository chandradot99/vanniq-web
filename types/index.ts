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
}

export interface GraphNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
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

// ── API Keys ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  org_id: string;
  service: string;
  key_hint: string;
  last_tested_at: string | null;
  created_at: string;
}

export interface TestApiKeyResponse {
  valid: boolean;
  tested: boolean;
  error: string | null;
}
