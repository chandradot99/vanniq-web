"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function RagSearchForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="top_k">Top K results</Label>
          <Input
            id="top_k"
            type="number"
            min={1}
            max={20}
            className="text-sm"
            value={(config.top_k as number) ?? 5}
            onChange={(e) => onChange({ ...config, top_k: parseInt(e.target.value) || 5 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_score">Min score</Label>
          <Input
            id="min_score"
            type="number"
            step={0.05}
            min={0}
            max={1}
            className="text-sm"
            value={(config.min_score as number) ?? 0.7}
            onChange={(e) => onChange({ ...config, min_score: parseFloat(e.target.value) || 0.7 })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="query">Custom query (optional)</Label>
        <Input
          id="query"
          placeholder="Leave blank to use latest user message"
          className="text-sm"
          value={(config.query as string) ?? ""}
          onChange={(e) => onChange({ ...config, query: e.target.value })}
        />
      </div>
    </div>
  );
}
