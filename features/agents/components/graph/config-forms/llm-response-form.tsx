"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTools } from "@/features/integrations/hooks/use-integrations";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function LlmResponseForm({ config, onChange }: Props) {
  const { data: availableTools = [], isLoading } = useTools();
  const selectedTools = (config.tools as string[]) ?? [];

  function toggleTool(toolName: string, checked: boolean) {
    const next = checked
      ? [...selectedTools, toolName]
      : selectedTools.filter((t) => t !== toolName);
    onChange({ ...config, tools: next });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="What should the agent say or do at this step?"
          rows={5}
          className="resize-none text-sm"
          value={(config.instructions as string) ?? ""}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Tools</Label>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading tools…</p>
        ) : availableTools.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No tools available. Connect integrations first.
          </p>
        ) : (
          <div className="space-y-2">
            {availableTools.map((tool) => {
              const isSelected = selectedTools.includes(tool.name);
              return (
                <label
                  key={tool.name}
                  className="flex items-start gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0 cursor-pointer accent-primary"
                    checked={isSelected}
                    onChange={(e) => toggleTool(tool.name, e.target.checked)}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium leading-tight">{tool.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{tool.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
        {selectedTools.length > 0 && (
          <p className="text-[10px] text-muted-foreground bg-muted/40 rounded px-2 py-1.5">
            The LLM will autonomously decide when to call these tools — no extra nodes needed.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">RAG Enabled</p>
          <p className="text-xs text-muted-foreground">Search knowledge base before responding</p>
        </div>
        <Switch
          checked={!!(config.rag_enabled)}
          onCheckedChange={(v) => onChange({ ...config, rag_enabled: v })}
        />
      </div>
    </div>
  );
}
