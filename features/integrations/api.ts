import { api } from "@/lib/api";
import type { Integration, TestIntegrationResponse, ToolInfo } from "@/types";

export const integrationsApi = {
  list: (): Promise<Integration[]> => api.get("/v1/integrations"),
  create: (data: {
    provider: string;
    display_name?: string;
    credentials: Record<string, string>;
    config?: Record<string, string>;
  }): Promise<Integration> => api.post("/v1/integrations", data),
  delete: (id: string): Promise<void> => api.delete(`/v1/integrations/${id}`),
  test: (id: string): Promise<TestIntegrationResponse> =>
    api.post(`/v1/integrations/${id}/test`),
  getOAuthConnectUrl: (provider: string): Promise<{ url: string }> =>
    api.get(`/v1/integrations/oauth/${provider}/connect`),
};

export const toolsApi = {
  list: (): Promise<ToolInfo[]> => api.get("/v1/tools"),
};
