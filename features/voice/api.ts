import { api } from "@/lib/api";
import type {
  PhoneNumber,
  TwilioAvailableNumber,
  VoiceCallListResponse,
  SessionDetail,
  OutboundCallResponse,
  VoiceConfig,
  VoiceModelInfo,
  VoiceVoiceInfo,
  STTProvider,
  TTSProvider,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const phoneNumbersApi = {
  list: (agentId?: string): Promise<PhoneNumber[]> =>
    api.get(agentId ? `/v1/voice/phone-numbers?agent_id=${agentId}` : "/v1/voice/phone-numbers"),

  getById: (id: string): Promise<PhoneNumber> =>
    api.get(`/v1/voice/phone-numbers/${id}`),

  listTwilioNumbers: (): Promise<TwilioAvailableNumber[]> =>
    api.get("/v1/voice/twilio/numbers"),

  add: (body: {
    agent_id: string;
    number: string;
    provider?: string;
    sid?: string;
    friendly_name?: string;
  }): Promise<PhoneNumber> => api.post("/v1/voice/phone-numbers", body),

  reassign: (id: string, agent_id: string): Promise<PhoneNumber> =>
    api.patch(`/v1/voice/phone-numbers/${id}`, { agent_id }),

  remove: (id: string): Promise<void> =>
    api.delete(`/v1/voice/phone-numbers/${id}`),

  updateName: (id: string, friendly_name: string | null): Promise<PhoneNumber> =>
    api.patch(`/v1/voice/phone-numbers/${id}/name`, { friendly_name }),

  updateConfig: (id: string, voice_config: VoiceConfig | null): Promise<PhoneNumber> =>
    api.patch(`/v1/voice/phone-numbers/${id}/config`, { voice_config }),
};

export const voiceProvidersApi = {
  listSTT: (): Promise<STTProvider[]> =>
    api.get("/v1/voice/providers/stt"),

  getSTTModels: (provider: string): Promise<VoiceModelInfo[]> =>
    api.get(`/v1/voice/providers/stt/${provider}/models`),

  listTTS: (): Promise<TTSProvider[]> =>
    api.get("/v1/voice/providers/tts"),

  getTTSModels: (provider: string): Promise<VoiceModelInfo[]> =>
    api.get(`/v1/voice/providers/tts/${provider}/models`),

  getTTSVoices: (provider: string): Promise<VoiceVoiceInfo[]> =>
    api.get(`/v1/voice/providers/tts/${provider}/voices`),
};

export const voicePreviewApi = {
  /**
   * Synthesise a TTS preview and return a blob URL for browser playback.
   * Throws on non-200 responses.
   */
  synthesize: async (
    tts_provider: string,
    text: string,
    voice_config: VoiceConfig | null,
  ): Promise<string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${BASE_URL}/v1/voice/preview/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ tts_provider, text, voice_config }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail ?? `Preview failed (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export const voiceCallsApi = {
  list: (limit = 20, offset = 0): Promise<VoiceCallListResponse> =>
    api.get(`/v1/voice/calls?limit=${limit}&offset=${offset}`),

  getById: (sessionId: string): Promise<SessionDetail> =>
    api.get(`/v1/chat/sessions/${sessionId}`),

  initiateOutbound: (body: {
    agent_id: string;
    from_number: string;
    to_number: string;
  }): Promise<OutboundCallResponse> =>
    api.post("/v1/voice/calls/outbound", body),
};
