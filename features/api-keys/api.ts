import { api } from "@/lib/api";
import type { ApiKey, TestApiKeyResponse } from "@/types";

export const apiKeysApi = {
  list: (): Promise<ApiKey[]> => api.get("/v1/api-keys"),
  create: (data: { service: string; key: string }): Promise<ApiKey> =>
    api.post("/v1/api-keys", data),
  delete: (id: string): Promise<void> => api.delete(`/v1/api-keys/${id}`),
  test: (id: string): Promise<TestApiKeyResponse> =>
    api.post(`/v1/api-keys/${id}/test`),
};
