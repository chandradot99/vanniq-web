import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../api";

export function usePlatformSchemas() {
  return useQuery({
    queryKey: ["platform-schemas"],
    queryFn: adminApi.listSchemas,
    staleTime: Infinity, // schemas never change at runtime
  });
}

export function usePlatformConfigs() {
  return useQuery({
    queryKey: ["platform-configs"],
    queryFn: adminApi.listConfigs,
  });
}

export function useUpsertPlatformConfig(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      data,
    }: {
      provider: string;
      data: {
        credentials: Record<string, string>;
        config: Record<string, string>;
        enabled: boolean;
      };
    }) => adminApi.upsert(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-configs"] });
      toast.success("Configuration saved");
      options?.onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to save configuration");
    },
  });
}

export function useDeletePlatformConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-configs"] });
      toast.success("Configuration removed");
    },
    onError: () => {
      toast.error("Failed to remove configuration");
    },
  });
}
