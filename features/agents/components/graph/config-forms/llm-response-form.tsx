"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function LlmResponseForm({ config, onChange }: Props) {
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
