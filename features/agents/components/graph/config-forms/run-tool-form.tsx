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
import { useTools } from "@/features/integrations/hooks/use-integrations";
import type { ToolInfo } from "@/types";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

function InputFields({
  tool,
  inputConfig,
  onInputChange,
}: {
  tool: ToolInfo;
  inputConfig: Record<string, string>;
  onInputChange: (key: string, value: string) => void;
}) {
  const props = (tool.input_schema as { properties?: Record<string, { description?: string }> })
    ?.properties ?? {};
  const required = (tool.input_schema as { required?: string[] })?.required ?? [];

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Input Fields
      </Label>
      {Object.entries(props).map(([key, meta]) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`input_${key}`} className="text-xs">
            {key}
            {required.includes(key) && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            id={`input_${key}`}
            className="text-sm font-mono"
            placeholder={meta.description ?? `{{collected.${key}}}`}
            value={inputConfig[key] ?? ""}
            onChange={(e) => onInputChange(key, e.target.value)}
          />
          {meta.description && (
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function RunToolForm({ config, onChange }: Props) {
  const { data: tools = [], isLoading } = useTools();

  const selectedToolName = (config.tool as string) ?? "";
  const selectedTool = tools.find((t) => t.name === selectedToolName) ?? null;
  const inputConfig = (config.input as Record<string, string>) ?? {};

  function handleToolChange(name: string) {
    onChange({ ...config, tool: name, input: {} });
  }

  function handleInputChange(key: string, value: string) {
    onChange({ ...config, input: { ...inputConfig, [key]: value } });
  }

  return (
    <div className="space-y-4">
      {/* Tool selector */}
      <div className="space-y-2">
        <Label>Tool</Label>
        <Select value={selectedToolName} onValueChange={handleToolChange} disabled={isLoading}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder={isLoading ? "Loading tools…" : "Select a tool…"} />
          </SelectTrigger>
          <SelectContent>
            {tools.map((tool) => (
              <SelectItem key={tool.name} value={tool.name}>
                <div>
                  <span className="font-mono text-xs">{tool.name}</span>
                  {tool.required_integration && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({tool.required_integration})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTool && (
          <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
        )}
      </div>

      {/* Dynamic input fields based on selected tool's schema */}
      {selectedTool && (
        <InputFields
          tool={selectedTool}
          inputConfig={inputConfig}
          onInputChange={handleInputChange}
        />
      )}

      {/* Save response to */}
      <div className="space-y-2">
        <Label htmlFor="save_response_to">Save response to</Label>
        <Input
          id="save_response_to"
          placeholder="e.g. booking_result"
          className="text-sm font-mono"
          value={(config.save_response_to as string) ?? ""}
          onChange={(e) => onChange({ ...config, save_response_to: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Access the result later with {`{{save_response_to.field}}`}
        </p>
      </div>
    </div>
  );
}
