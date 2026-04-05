"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Building2,
  CreditCard,
  IndianRupee,
  Headphones,
  ShoppingBag,
  Zap,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTools } from "@/features/integrations/hooks/use-integrations";
import type { ToolInfo } from "@/types";

// ── Integration metadata ───────────────────────────────────────────────────────

interface IntegrationMeta {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const INTEGRATION_META: Record<string, IntegrationMeta> = {
  google: {
    label: "Google",
    icon: Calendar,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  hubspot: {
    label: "HubSpot",
    icon: Building2,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  zoho: {
    label: "Zoho CRM",
    icon: Building2,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
  stripe: {
    label: "Stripe",
    icon: CreditCard,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  razorpay: {
    label: "Razorpay",
    icon: IndianRupee,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  freshdesk: {
    label: "Freshdesk",
    icon: Headphones,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  shopify: {
    label: "Shopify",
    icon: ShoppingBag,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600",
  },
};

const BUILTIN_META: IntegrationMeta = {
  label: "Built-in",
  icon: Zap,
  iconBg: "bg-amber-500/10",
  iconColor: "text-amber-500",
};

function getIntegrationMeta(key: string | null): IntegrationMeta {
  if (!key) return BUILTIN_META;
  return INTEGRATION_META[key] ?? { label: key, icon: Zap, iconBg: "bg-slate-500/10", iconColor: "text-slate-500" };
}

// ── Service label extraction ───────────────────────────────────────────────────

// Ordered longest-first so "google_calendar" matches before "google"
const SERVICE_PREFIXES: [string, string][] = [
  ["google_calendar", "Google Calendar"],
  ["google_sheets", "Google Sheets"],
  ["google_drive", "Google Drive"],
  ["gmail", "Gmail"],
  ["hubspot_crm", "HubSpot CRM"],
  ["hubspot", "HubSpot"],
  ["zoho_crm", "Zoho CRM"],
  ["zoho", "Zoho"],
  ["stripe", "Stripe"],
  ["razorpay", "Razorpay"],
  ["freshdesk", "Freshdesk"],
  ["shopify", "Shopify"],
];

function getServiceLabel(toolName: string): string {
  for (const [prefix, label] of SERVICE_PREFIXES) {
    if (toolName.startsWith(prefix + "_") || toolName === prefix) return label;
  }
  // Fallback: first two underscore-separated words, title-cased
  const parts = toolName.split("_").slice(0, 2).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return parts.join(" ");
}

function getActionLabel(toolName: string): string {
  for (const [prefix] of SERVICE_PREFIXES) {
    if (toolName.startsWith(prefix + "_")) {
      const action = toolName.slice(prefix.length + 1);
      return action.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    }
  }
  // Fallback: all words except the first two (which are the service)
  const parts = toolName.split("_");
  const action = parts.length > 2 ? parts.slice(2) : parts;
  return action.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

// ── Helper types ──────────────────────────────────────────────────────────────

interface ServiceGroup {
  service: string;
  tools: ToolInfo[];
}

interface IntegrationGroup {
  integration: string | null;
  meta: IntegrationMeta;
  services: ServiceGroup[];
  toolCount: number;
}

function groupTools(tools: ToolInfo[]): IntegrationGroup[] {
  const byIntegration = new Map<string, ToolInfo[]>();
  for (const tool of tools) {
    const key = tool.required_integration ?? "__builtin__";
    if (!byIntegration.has(key)) byIntegration.set(key, []);
    byIntegration.get(key)!.push(tool);
  }

  return Array.from(byIntegration.entries()).map(([key, integrationTools]) => {
    const integration = key === "__builtin__" ? null : key;
    const byService = new Map<string, ToolInfo[]>();
    for (const tool of integrationTools) {
      const svc = getServiceLabel(tool.name);
      if (!byService.has(svc)) byService.set(svc, []);
      byService.get(svc)!.push(tool);
    }
    return {
      integration,
      meta: getIntegrationMeta(integration),
      services: Array.from(byService.entries()).map(([service, t]) => ({ service, tools: t })),
      toolCount: integrationTools.length,
    };
  });
}

// ── InputFields ───────────────────────────────────────────────────────────────

type FieldMode = "variable" | "manual";

function isVariableValue(value: string): boolean {
  return /^\{\{.+\}\}$/.test(value);
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
  const schema = tool.input_schema as {
    properties?: Record<string, { type?: string; format?: string; description?: string; default?: unknown }>;
    required?: string[];
  };
  const props = schema?.properties ?? {};
  const required = schema?.required ?? [];
  const fieldKeys = Object.keys(props);

  const hasVars = collectedVariables.length > 0 || savedVariables.length > 0;

  const [fieldModes, setFieldModes] = useState<Record<string, FieldMode>>(() => {
    const modes: Record<string, FieldMode> = {};
    for (const key of fieldKeys) {
      modes[key] = isVariableValue(inputConfig[key] ?? "") ? "variable" : "manual";
    }
    return modes;
  });

  function getMode(key: string): FieldMode {
    return fieldModes[key] ?? "manual";
  }

  function switchMode(key: string, mode: FieldMode) {
    setFieldModes((prev) => ({ ...prev, [key]: mode }));
    onInputChange(key, "");
  }

  if (fieldKeys.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Input Fields
      </Label>
      {Object.entries(props).map(([key, meta]) => {
        const mode = getMode(key);
        const value = inputConfig[key] ?? "";

        return (
          <div key={key} className="space-y-1.5">
            {/* Label row with mode toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Label htmlFor={`input_${key}`} className="text-xs">
                  {key}
                  {required.includes(key) && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {(meta.format ?? meta.type) && (
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 shrink-0">
                    {meta.format ?? meta.type}
                  </span>
                )}
              </div>
              {hasVars && (
                <div className="flex rounded border border-border/60 overflow-hidden text-[10px] shrink-0">
                  <button
                    type="button"
                    onClick={() => mode !== "variable" && switchMode(key, "variable")}
                    className={`px-2 py-0.5 transition-colors ${
                      mode === "variable"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    Variable
                  </button>
                  <button
                    type="button"
                    onClick={() => mode !== "manual" && switchMode(key, "manual")}
                    className={`px-2 py-0.5 transition-colors border-l border-border/60 ${
                      mode === "manual"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    Manual
                  </button>
                </div>
              )}
            </div>

            {/* Input — variable select or free text */}
            {mode === "variable" && hasVars ? (
              <Select value={value} onValueChange={(v) => onInputChange(key, v)}>
                <SelectTrigger className="w-full text-xs font-mono h-8">
                  <SelectValue placeholder="Select a variable…" />
                </SelectTrigger>
                <SelectContent>
                  {collectedVariables.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Collected by LLM</SelectLabel>
                      {collectedVariables.map((v) => (
                        <SelectItem key={v} value={`{{collected.${v}}}`} className="font-mono text-xs">
                          {`{{collected.${v}}}`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {savedVariables.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Saved variables</SelectLabel>
                      {savedVariables.map((v) => (
                        <SelectItem key={v} value={`{{${v}}}`} className="font-mono text-xs">
                          {`{{${v}}}`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`input_${key}`}
                className="text-sm font-mono"
                placeholder={meta.description ?? `Enter ${key}…`}
                value={value}
                onChange={(e) => onInputChange(key, e.target.value)}
              />
            )}

            {meta.description && (
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  collectedVariables?: string[];
  savedVariables?: string[];
}

export function RunToolForm({ config, onChange, collectedVariables = [], savedVariables = [] }: Props) {
  const { data: tools = [], isLoading } = useTools();

  const selectedToolName = (config.tool as string) ?? "";
  const selectedTool = tools.find((t) => t.name === selectedToolName) ?? null;
  const inputConfig = (config.input as Record<string, string>) ?? {};
  const saveResponseTo = (config.save_response_to as string) ?? "";

  // Which integration is expanded — null means show the integration picker
  const integrationGroups = groupTools(tools);

  // Derive the active integration from the selected tool, or null to show picker
  const activeIntegration = selectedTool?.required_integration ?? null;
  const [browsing, setBrowsing] = useState<string | null>(
    selectedToolName ? (selectedTool?.required_integration ?? "__builtin__") : null,
  );

  function handleToolChange(name: string) {
    onChange({ ...config, tool: name, input: {} });
  }

  function handleInputChange(key: string, value: string) {
    onChange({ ...config, input: { ...inputConfig, [key]: value } });
  }

  function selectIntegration(key: string) {
    setBrowsing(key);
  }

  function clearIntegration() {
    setBrowsing(null);
  }

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Loading tools…</p>;
  }

  const activeGroup = browsing != null
    ? integrationGroups.find(
        (g) => (g.integration ?? "__builtin__") === browsing,
      )
    : null;

  return (
    <div className="space-y-4">
      {/* ── Step 1: Integration picker ────────────────────────────────────── */}
      {browsing == null && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Integration
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {integrationGroups.map((group) => {
              const key = group.integration ?? "__builtin__";
              const Icon = group.meta.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectIntegration(key)}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/50 transition-all text-left group"
                >
                  <div className={`h-8 w-8 rounded-lg ${group.meta.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${group.meta.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{group.meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{group.toolCount} tool{group.toolCount !== 1 ? "s" : ""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 2: Tool picker within an integration ─────────────────────── */}
      {browsing != null && activeGroup && (
        <div className="space-y-3">
          {/* Header with back button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearIntegration}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1.5">
              <div className={`h-5 w-5 rounded ${activeGroup.meta.iconBg} flex items-center justify-center`}>
                <activeGroup.meta.icon className={`h-3 w-3 ${activeGroup.meta.iconColor}`} />
              </div>
              <span className="text-xs font-semibold">{activeGroup.meta.label}</span>
            </div>
          </div>

          {/* Tool cards grouped by service */}
          <div className="space-y-4">
            {activeGroup.services.map(({ service, tools: serviceTools }) => (
              <div key={service} className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                  {service}
                </p>
                <div className="space-y-1">
                  {serviceTools.map((tool) => {
                    const isSelected = tool.name === selectedToolName;
                    const actionLabel = getActionLabel(tool.name);
                    return (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => handleToolChange(tool.name)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 bg-card hover:border-border hover:bg-accent/40"
                        }`}
                      >
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : ""}`}>
                            {actionLabel}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected tool summary + inputs ────────────────────────────────── */}
      {selectedTool && (
        <>
          {/* Chip showing currently selected tool with edit option */}
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">
                {getActionLabel(selectedTool.name)}
              </p>
              <p className="text-[10px] text-muted-foreground">{getServiceLabel(selectedTool.name)}</p>
            </div>
            <button
              type="button"
              onClick={() => setBrowsing(activeIntegration ?? "__builtin__")}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Change
            </button>
          </div>

          {/* Dynamic input fields */}
          <InputFields
            key={selectedTool.name}
            tool={selectedTool}
            inputConfig={inputConfig}
            onInputChange={handleInputChange}
            collectedVariables={collectedVariables}
            savedVariables={savedVariables}
          />
        </>
      )}

      {/* ── Save response to ──────────────────────────────────────────────── */}
      {selectedTool && (
        <div className="space-y-2">
          <Label htmlFor="save_response_to">Save response to <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="save_response_to"
            placeholder="e.g. created_event"
            className="text-sm font-mono"
            value={saveResponseTo}
            onChange={(e) => onChange({ ...config, save_response_to: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Reference the result in later nodes with{" "}
            <span className="font-mono">{`{{${saveResponseTo || "variable_name"}.field}}`}</span>
          </p>
        </div>
      )}
    </div>
  );
}
