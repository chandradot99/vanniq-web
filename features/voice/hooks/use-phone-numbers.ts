import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { VoiceConfig } from "@/types";
import { phoneNumbersApi } from "@/features/voice/api";

const QK = "phone-numbers";

export function usePhoneNumbers(agentId?: string) {
  return useQuery({
    queryKey: agentId ? [QK, "agent", agentId] : [QK],
    queryFn: () => phoneNumbersApi.list(agentId),
  });
}

export function useAddPhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: phoneNumbersApi.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success("Phone number added");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add phone number");
    },
  });
}

export function useReassignPhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agent_id }: { id: string; agent_id: string }) =>
      phoneNumbersApi.reassign(id, agent_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success("Number reassigned");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reassign number");
    },
  });
}

export function useRemovePhoneNumber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: phoneNumbersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success("Phone number removed");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove phone number");
    },
  });
}

export function useUpdatePhoneNumberConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voice_config }: { id: string; voice_config: VoiceConfig | null }) =>
      phoneNumbersApi.updateConfig(id, voice_config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast.success("Voice settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save voice settings");
    },
  });
}
