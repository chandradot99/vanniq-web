import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { Agent } from "@/types";
import { agentsApi, sessionsApi, type CreateAgentInput, type UpdateAgentInput, type UpdateGraphInput } from "../api";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: () => agentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAgent({ onSuccess }: { onSuccess?: (agent: Agent) => void } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentInput) => agentsApi.create(data),
    onSuccess: (agent) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent created");
      onSuccess?.(agent);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to create agent"),
  });
}

export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAgentInput) => agentsApi.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(["agents", id], updated);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: () => toast.error("Failed to update agent"),
  });
}

export function useUpdateGraph(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (graph: UpdateGraphInput) => agentsApi.updateGraph(id, graph),
    onSuccess: (updated) => {
      qc.setQueryData(["agents", id], updated);
      toast.success("Graph saved");
    },
    onError: () => toast.error("Failed to save graph"),
  });
}

export function useAgentSessions(agentId: string) {
  return useQuery({
    queryKey: ["sessions", agentId],
    queryFn: () => sessionsApi.listByAgent(agentId),
    enabled: !!agentId,
    refetchInterval: 10_000, // poll every 10s to catch new sessions
  });
}

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.getById(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSessionTimeline(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-timeline", sessionId],
    queryFn: () => sessionsApi.getTimeline(sessionId!),
    enabled: !!sessionId,
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
    },
    onError: () => toast.error("Failed to delete agent"),
  });
}
