"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function RunToolForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tool">Tool name</Label>
        <Input
          id="tool"
          placeholder="e.g. get_calendar_events"
          className="text-sm"
          value={(config.tool as string) ?? ""}
          onChange={(e) => onChange({ ...config, tool: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="save_response_to">Save response to</Label>
        <Input
          id="save_response_to"
          placeholder="e.g. tool_result"
          className="text-sm"
          value={(config.save_response_to as string) ?? ""}
          onChange={(e) => onChange({ ...config, save_response_to: e.target.value })}
        />
      </div>
    </div>
  );
}
