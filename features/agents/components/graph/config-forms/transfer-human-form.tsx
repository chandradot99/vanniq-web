"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TransferHumanForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transfer_number">Transfer number</Label>
        <Input
          id="transfer_number"
          placeholder="+91XXXXXXXXXX"
          className="text-sm"
          value={(config.transfer_number as string) ?? ""}
          onChange={(e) => onChange({ ...config, transfer_number: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whisper_template">Whisper message (optional)</Label>
        <Textarea
          id="whisper_template"
          placeholder="Spoken to the agent before transfer..."
          rows={3}
          className="resize-none text-sm"
          value={(config.whisper_template as string) ?? ""}
          onChange={(e) => onChange({ ...config, whisper_template: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Played to the human agent before the call is connected
        </p>
      </div>
    </div>
  );
}
