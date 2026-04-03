export interface ProviderMeta {
  label: string;
  category: "llm" | "stt" | "tts" | "telephony" | "messaging" | "app" | "infrastructure";
  credentialFields: { key: string; label: string; placeholder?: string }[];
  configFields: { key: string; label: string; placeholder?: string }[];
}

export const PROVIDERS: Record<string, ProviderMeta> = {
  // LLM
  openai: {
    label: "OpenAI",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key", placeholder: "sk-..." }],
    configFields: [],
  },
  anthropic: {
    label: "Anthropic",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key", placeholder: "sk-ant-..." }],
    configFields: [],
  },
  gemini: {
    label: "Google Gemini",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  groq: {
    label: "Groq",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key", placeholder: "gsk_..." }],
    configFields: [],
  },
  azure_openai: {
    label: "Azure OpenAI",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [
      { key: "endpoint", label: "Endpoint", placeholder: "https://your-resource.openai.azure.com" },
      { key: "deployment", label: "Deployment Name", placeholder: "gpt-4o" },
      { key: "api_version", label: "API Version", placeholder: "2024-02-01" },
    ],
  },
  mistral: {
    label: "Mistral",
    category: "llm",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  // STT
  deepgram: {
    label: "Deepgram",
    category: "stt",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  assemblyai: {
    label: "AssemblyAI",
    category: "stt",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  sarvam: {
    label: "Sarvam AI",
    category: "stt",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  // TTS
  elevenlabs: {
    label: "ElevenLabs",
    category: "tts",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  cartesia: {
    label: "Cartesia",
    category: "tts",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  // Telephony
  twilio: {
    label: "Twilio",
    category: "telephony",
    credentialFields: [
      { key: "account_sid", label: "Account SID", placeholder: "ACxxxxxxxx" },
      { key: "auth_token", label: "Auth Token" },
    ],
    configFields: [],
  },
  vonage: {
    label: "Vonage",
    category: "telephony",
    credentialFields: [
      { key: "api_key", label: "API Key" },
      { key: "api_secret", label: "API Secret" },
    ],
    configFields: [],
  },
  telnyx: {
    label: "Telnyx",
    category: "telephony",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [],
  },
  // Messaging
  gupshup: {
    label: "Gupshup (WhatsApp)",
    category: "messaging",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [
      { key: "app_name", label: "App Name" },
      { key: "source_number", label: "Source Phone Number", placeholder: "+91XXXXXXXXXX" },
    ],
  },
  // Apps
  google: {
    label: "Google (Calendar + Gmail)",
    category: "app",
    credentialFields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret" },
      { key: "refresh_token", label: "Refresh Token" },
    ],
    configFields: [],
  },
  hubspot: {
    label: "HubSpot",
    category: "app",
    credentialFields: [{ key: "access_token", label: "Access Token" }],
    configFields: [],
  },
  slack: {
    label: "Slack",
    category: "app",
    credentialFields: [{ key: "bot_token", label: "Bot Token", placeholder: "xoxb-..." }],
    configFields: [],
  },
  // Infrastructure
  pinecone: {
    label: "Pinecone",
    category: "infrastructure",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [
      { key: "environment", label: "Environment", placeholder: "us-east-1-aws" },
      { key: "index_name", label: "Index Name" },
    ],
  },
  qdrant: {
    label: "Qdrant",
    category: "infrastructure",
    credentialFields: [{ key: "api_key", label: "API Key" }],
    configFields: [
      { key: "url", label: "URL", placeholder: "https://your-cluster.qdrant.io" },
      { key: "collection_name", label: "Collection Name" },
    ],
  },
  redis: {
    label: "Redis",
    category: "infrastructure",
    credentialFields: [{ key: "password", label: "Password" }],
    configFields: [{ key: "url", label: "URL", placeholder: "redis://localhost:6379" }],
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM Providers",
  stt: "Speech to Text",
  tts: "Text to Speech",
  telephony: "Telephony",
  messaging: "Messaging",
  app: "Apps & Tools",
  infrastructure: "Infrastructure",
};

export function getProviderLabel(provider: string): string {
  return PROVIDERS[provider]?.label ?? provider;
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
