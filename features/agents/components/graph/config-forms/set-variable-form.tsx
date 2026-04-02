"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function SetVariableForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="key">Variable key</Label>
        <Input
          id="key"
          placeholder="e.g. user_name"
          className="text-sm"
          value={(config.key as string) ?? ""}
          onChange={(e) => onChange({ ...config, key: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          placeholder="e.g. {{collected.name}} or static text"
          className="text-sm"
          value={(config.value as string) ?? ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="font-mono bg-muted px-1 rounded">{"{{collected.field}}"}</code> for dynamic values
        </p>
      </div>
    </div>
  );
}
