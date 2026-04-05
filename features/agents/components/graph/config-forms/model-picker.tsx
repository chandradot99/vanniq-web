"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Provider + model catalog ──────────────────────────────────────────────────

export const PROVIDERS = [
  { id: "auto",      label: "Auto",      pill: "border-transparent text-muted-foreground hover:border-border hover:text-foreground" },
  { id: "openai",    label: "OpenAI",    pill: "border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/8" },
  { id: "anthropic", label: "Anthropic", pill: "border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/8" },
  { id: "groq",      label: "Groq",      pill: "border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/8" },
  { id: "gemini",    label: "Gemini",    pill: "border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-500/8" },
  { id: "mistral",   label: "Mistral",   pill: "border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/8" },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

interface ModelOption {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

export const PROVIDER_MODELS: Record<Exclude<ProviderId, "auto">, ModelOption[]> = {
  openai: [
    { id: "gpt-4o",          label: "GPT-4o",          badge: "Smart",     badgeColor: "text-violet-500" },
    { id: "gpt-4o-mini",     label: "GPT-4o Mini",     badge: "Fast",      badgeColor: "text-emerald-500" },
    { id: "gpt-4-turbo",     label: "GPT-4 Turbo",     badge: "Prev gen",  badgeColor: "text-muted-foreground" },
    { id: "o1-mini",         label: "o1 Mini",          badge: "Reasoning", badgeColor: "text-blue-500" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6",          label: "Claude Sonnet 4.6", badge: "Latest",       badgeColor: "text-violet-500" },
    { id: "claude-opus-4-6",            label: "Claude Opus 4.6",   badge: "Most capable", badgeColor: "text-orange-500" },
    { id: "claude-haiku-4-5-20251001",  label: "Claude Haiku 4.5",  badge: "Fast",         badgeColor: "text-emerald-500" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", badge: "",             badgeColor: "" },
    { id: "claude-3-5-haiku-20241022",  label: "Claude 3.5 Haiku",  badge: "Fast",         badgeColor: "text-emerald-500" },
  ],
  groq: [
    { id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B", badge: "Smart",  badgeColor: "text-violet-500" },
    { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",  badge: "Fast",   badgeColor: "text-emerald-500" },
    { id: "gemma2-9b-it",            label: "Gemma 2 9B",    badge: "Google", badgeColor: "text-blue-500" },
    { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B",  badge: "",       badgeColor: "" },
  ],
  gemini: [
    { id: "gemini-2.0-flash",  label: "Gemini 2.0 Flash", badge: "Latest", badgeColor: "text-violet-500" },
    { id: "gemini-1.5-pro",    label: "Gemini 1.5 Pro",   badge: "Smart",  badgeColor: "text-blue-500" },
    { id: "gemini-1.5-flash",  label: "Gemini 1.5 Flash", badge: "Fast",   badgeColor: "text-emerald-500" },
  ],
  mistral: [
    { id: "mistral-large-latest", label: "Mistral Large", badge: "Smart", badgeColor: "text-violet-500" },
    { id: "mistral-small-latest", label: "Mistral Small", badge: "Fast",  badgeColor: "text-emerald-500" },
    { id: "open-mixtral-8x22b",   label: "Mixtral 8x22B", badge: "",      badgeColor: "" },
  ],
};

/** Short display label for a model id — used on the node canvas badge. */
export function modelShortLabel(provider: string | undefined, model: string | undefined): string | null {
  if (!model) return null;
  if (provider && provider !== "auto") {
    const list = PROVIDER_MODELS[provider as Exclude<ProviderId, "auto">];
    const found = list?.find((m) => m.id === model);
    if (found) return found.label;
  }
  // Fallback: shorten the raw id
  return model.length > 20 ? model.slice(0, 20) + "…" : model;
}

function tempLabel(t: number): string {
  if (t <= 0.2) return "Precise";
  if (t <= 0.5) return "Focused";
  if (t <= 0.8) return "Balanced";
  if (t <= 1.1) return "Creative";
  return "Wild";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function ModelPicker({ config, onChange }: Props) {
  const provider = (config.provider as ProviderId | undefined) ?? "auto";
  const model = (config.model as string | undefined) ?? "";
  const temperature = (config.temperature as number | undefined) ?? 0.7;

  const modelOptions = provider !== "auto" ? (PROVIDER_MODELS[provider as Exclude<ProviderId, "auto">] ?? []) : [];
  const effectiveModel = model || modelOptions[0]?.id || "";

  function setProvider(id: ProviderId) {
    const next: Record<string, unknown> = { ...config };
    if (id === "auto") {
      delete next.provider;
      delete next.model;
    } else {
      next.provider = id;
      delete next.model; // reset model when switching provider
    }
    onChange(next);
  }

  function setModel(id: string) {
    onChange({ ...config, model: id });
  }

  function setTemperature(val: number) {
    onChange({ ...config, temperature: val });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Model</p>

      {/* Provider pills */}
      <div className="flex flex-wrap gap-1.5">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProvider(p.id)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all
              ${provider === p.id
                ? p.pill
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Model dropdown — only when a real provider is selected */}
      {provider !== "auto" && modelOptions.length > 0 && (
        <Select value={effectiveModel} onValueChange={setModel}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue placeholder="Select model…" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <span className="flex items-center gap-2 w-full">
                  <span>{m.label}</span>
                  {m.badge && (
                    <span className={`text-[10px] font-medium ml-auto ${m.badgeColor}`}>{m.badge}</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Temperature slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Temperature</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/60">{tempLabel(temperature)}</span>
            <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums w-6 text-right">
              {temperature.toFixed(1)}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full bg-border cursor-pointer accent-foreground
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground/40 select-none">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Wild</span>
        </div>
      </div>

      {/* Auto hint */}
      {provider === "auto" && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          Provider is auto-detected from your API keys. Select a provider to pin a specific model.
        </p>
      )}
    </div>
  );
}
