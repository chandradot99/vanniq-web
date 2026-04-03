"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
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

interface HeaderRow {
  key: string;
  value: string;
}

function headersToRows(headers: Record<string, string> | undefined): HeaderRow[] {
  if (!headers || typeof headers !== "object") return [];
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (row.key.trim()) result[row.key.trim()] = row.value;
  }
  return result;
}

export function HttpRequestForm({ config, onChange }: Props) {
  const headerRows = headersToRows(config.headers as Record<string, string> | undefined);

  function updateHeaders(rows: HeaderRow[]) {
    onChange({ ...config, headers: rowsToHeaders(rows) });
  }

  function addHeader() {
    updateHeaders([...headerRows, { key: "", value: "" }]);
  }

  function updateHeader(index: number, field: "key" | "value", val: string) {
    const next = headerRows.map((row, i) => (i === index ? { ...row, [field]: val } : row));
    updateHeaders(next);
  }

  function removeHeader(index: number) {
    updateHeaders(headerRows.filter((_, i) => i !== index));
  }

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

      {/* Headers builder */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Headers</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            onClick={addHeader}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        {headerRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No headers. Click Add to add one.</p>
        ) : (
          <div className="space-y-1.5">
            {headerRows.map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  placeholder="Header name"
                  className="text-xs font-mono h-7 w-32 shrink-0"
                  value={row.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                />
                <Input
                  placeholder="Value or {{variable}}"
                  className="text-xs font-mono h-7 flex-1 min-w-0"
                  value={row.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                />
                <button
                  onClick={() => removeHeader(i)}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
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
