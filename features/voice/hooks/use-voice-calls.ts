import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { voiceCallsApi } from "@/features/voice/api";

const QK = "voice-calls";

export function useVoiceCalls(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [QK, limit, offset],
    queryFn: () => voiceCallsApi.list(limit, offset),
  });
}

export function useVoiceCall(sessionId: string | null) {
  return useQuery({
    queryKey: [QK, "detail", sessionId],
    queryFn: () => voiceCallsApi.getById(sessionId!),
    enabled: !!sessionId,
  });
}

export function useInitiateOutbound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: voiceCallsApi.initiateOutbound,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success(`Call initiated — SID: ${data.call_sid}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to initiate call");
    },
  });
}
