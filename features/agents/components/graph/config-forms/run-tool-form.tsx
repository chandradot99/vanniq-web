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
  collectedVariables?: string[];
  savedVariables?: string[];
}

function InputFields({
  tool,
  inputConfig,
  onInputChange,
  collectedVariables = [],
  savedVariables = [],
}: {
  tool: ToolInfo;
  inputConfig: Record<string, string>;
  onInputChange: (key: string, value: string) => void;
  collectedVariables?: string[];
  savedVariables?: string[];
}) {
  const props = (tool.input_schema as { properties?: Record<string, { description?: string }> })
    ?.properties ?? {};
  const required = (tool.input_schema as { required?: string[] })?.required ?? [];

  function insertVariable(field: string, variable: string) {
    onInputChange(field, variable);
  }

  const allVars = [
    ...collectedVariables.map((v) => `{{collected.${v}}}`),
    ...savedVariables.map((v) => `{{${v}}}`),
  ];

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Input Fields
      </Label>
      {allVars.length > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Available variables — click to insert</p>
          <div className="flex flex-wrap gap-1">
            {allVars.map((v) => (
              <button
                key={v}
                type="button"
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 hover:border-primary/40 hover:text-primary transition-colors"
                onClick={() => {/* handled per-field below */}}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
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
          {allVars.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allVars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(key, v)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted hover:bg-accent border border-border/40 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          {meta.description && (
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function RunToolForm({ config, onChange, collectedVariables = [], savedVariables = [] }: Props) {
  const { data: tools = [], isLoading } = useTools();

  const selectedToolName = (config.tool as string) ?? "";
  const selectedTool = tools.find((t) => t.name === selectedToolName) ?? null;
  const inputConfig = (config.input as Record<string, string>) ?? {};
  const saveResponseTo = (config.save_response_to as string) ?? "";

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
          collectedVariables={collectedVariables}
          savedVariables={savedVariables}
        />
      )}

      {/* Save response to */}
      <div className="space-y-2">
        <Label htmlFor="save_response_to">Save response to (optional)</Label>
        <Input
          id="save_response_to"
          placeholder="e.g. created_event"
          className="text-sm font-mono"
          value={saveResponseTo}
          onChange={(e) => onChange({ ...config, save_response_to: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Stores the tool&apos;s output so later nodes can reference{" "}
          <span className="font-mono">{`{{${saveResponseTo || "variable_name"}.field}}`}</span>
        </p>
      </div>
    </div>
  );
}
