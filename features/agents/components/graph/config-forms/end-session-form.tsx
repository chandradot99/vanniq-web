"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function EndSessionForm({ config, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor="farewell_message">Farewell message</Label>
      <Textarea
        id="farewell_message"
        placeholder="Thank you for calling. Have a great day!"
        rows={4}
        className="resize-none text-sm"
        value={(config.farewell_message as string) ?? ""}
        onChange={(e) => onChange({ ...config, farewell_message: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Leave blank to use the default farewell message
      </p>
    </div>
  );
}
