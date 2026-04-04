import { api } from "@/lib/api";
import type { PlatformConfig, ProviderSchema } from "@/types";

export const adminApi = {
  listSchemas: (): Promise<ProviderSchema[]> =>
    api.get("/v1/admin/platform-configs/schemas"),

  listConfigs: (): Promise<PlatformConfig[]> =>
    api.get("/v1/admin/platform-configs"),

  upsert: (
    provider: string,
    data: {
      credentials: Record<string, string>;
      config: Record<string, string>;
      enabled: boolean;
    }
  ): Promise<PlatformConfig> => api.put(`/v1/admin/platform-configs/${provider}`, data),

  delete: (provider: string): Promise<void> =>
    api.delete(`/v1/admin/platform-configs/${provider}`),
};
