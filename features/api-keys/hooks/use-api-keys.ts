import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { apiKeysApi } from "../api";

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: apiKeysApi.list,
  });
}

export function useCreateApiKey({ onSuccess }: { onSuccess?: () => void } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { service: string; key: string }) => apiKeysApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key saved");
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to save key"),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key removed");
    },
    onError: () => toast.error("Failed to remove key"),
  });
}

export function useTestApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.test(id),
    onSuccess: (res) => {
      if (res.valid) {
        toast.success(
          res.tested ? "Key is valid ✓" : "Key saved (live test not supported for this provider)"
        );
      } else {
        toast.error(`Key invalid: ${res.error ?? "Unknown error"}`);
      }
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () => toast.error("Test failed"),
  });
}
