import { api } from "@/lib/api";
import type {
  PhoneNumber,
  VoiceCallListResponse,
  SessionDetail,
  OutboundCallResponse,
  VoiceConfig,
} from "@/types";

export const phoneNumbersApi = {
  list: (agentId?: string): Promise<PhoneNumber[]> =>
    api.get(agentId ? `/v1/voice/phone-numbers?agent_id=${agentId}` : "/v1/voice/phone-numbers"),

  add: (body: {
    agent_id: string;
    number: string;
    provider?: string;
    friendly_name?: string;
  }): Promise<PhoneNumber> => api.post("/v1/voice/phone-numbers", body),

  reassign: (id: string, agent_id: string): Promise<PhoneNumber> =>
    api.patch(`/v1/voice/phone-numbers/${id}`, { agent_id }),

  remove: (id: string): Promise<void> =>
    api.delete(`/v1/voice/phone-numbers/${id}`),

  updateConfig: (id: string, voice_config: VoiceConfig | null): Promise<PhoneNumber> =>
    api.patch(`/v1/voice/phone-numbers/${id}/config`, { voice_config }),
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
