import { createContext, useContext } from "react";
import type { ToolInfo } from "@/types";

export const ToolSchemasContext = createContext<ToolInfo[]>([]);

export function useToolSchemas(): ToolInfo[] {
  return useContext(ToolSchemasContext);
}
