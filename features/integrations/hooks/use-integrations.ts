import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { integrationsApi, toolsApi } from "../api";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: integrationsApi.list,
  });
}

export function useCreateIntegration({ onSuccess }: { onSuccess?: () => void } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: integrationsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration saved");
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to save integration"),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration removed");
    },
    onError: () => toast.error("Failed to remove integration"),
  });
}

export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.test(id),
    onSuccess: (res) => {
      if (res.valid) {
        toast.success(
          res.tested ? "Connection verified" : "Saved (live test not supported yet)"
        );
      } else {
        toast.error(`Connection failed: ${res.error ?? "Unknown error"}`);
      }
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: () => toast.error("Test failed"),
  });
}

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: toolsApi.list,
    staleTime: Infinity, // tool registry doesn't change at runtime
  });
}
