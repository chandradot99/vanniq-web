"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function HttpRequestForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="space-y-2 w-28 shrink-0">
          <Label>Method</Label>
          <Select
            value={(config.method as string) ?? "GET"}
            onValueChange={(v) => onChange({ ...config, method: v })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            placeholder="https://api.example.com/endpoint"
            className="text-sm"
            value={(config.url as string) ?? ""}
            onChange={(e) => onChange({ ...config, url: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="save_response_to">Save response to variable</Label>
        <Input
          id="save_response_to"
          placeholder="e.g. api_result"
          className="text-sm"
          value={(config.save_response_to as string) ?? ""}
          onChange={(e) => onChange({ ...config, save_response_to: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
        <Input
          id="timeout_seconds"
          type="number"
          min={1}
          max={120}
          className="text-sm w-24"
          value={(config.timeout_seconds as number) ?? 30}
          onChange={(e) => onChange({ ...config, timeout_seconds: parseInt(e.target.value) || 30 })}
        />
      </div>
    </div>
  );
}
