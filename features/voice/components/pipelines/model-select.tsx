"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceModelInfo } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function langHint(m: VoiceModelInfo): string {
  const n = m.languages.length;
  if (n === 0) return "";
  if (n === 1) return "English only";
  return `${n > 30 ? `${n}+` : n} languages`;
}

function groupByCategory(
  models: VoiceModelInfo[]
): { label: string; models: VoiceModelInfo[] }[] {
  const groups: Record<string, VoiceModelInfo[]> = {};
  for (const m of models) {
    const key = m.category ?? "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : 0))
    .map(([label, ms]) => ({ label, models: ms }));
}

// ── ModelSelect ───────────────────────────────────────────────────────────────

type Props = {
  models: VoiceModelInfo[];
  value: string;           // "" means "Default / provider default"
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
};

export function ModelSelect({
  models,
  value,
  onChange,
  placeholder = "Default",
  className,
}: Props) {
  const selectedModel = models.find((m) => m.id === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex w-full h-10 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/30",
          "data-[popup-open=true]:ring-2 data-[popup-open=true]:ring-primary/30",
          className
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn("truncate", !selectedModel && "text-muted-foreground")}>
            {selectedModel
              ? `${selectedModel.display_name}${selectedModel.is_default ? " (default)" : ""}`
              : placeholder}
          </span>
          {selectedModel && (
            <span className="text-xs text-muted-foreground shrink-0">
              {langHint(selectedModel)}
            </span>
          )}
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner side="bottom" sideOffset={4} collisionPadding={8} alignItemWithTrigger={false} className="isolate z-50">
          <SelectPrimitive.Popup
            className={cn(
              "max-h-80 w-(--anchor-width) min-w-56 overflow-y-auto rounded-lg bg-popover shadow-lg",
              "ring-1 ring-foreground/10 origin-(--transform-origin)",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100"
            )}
          >
            <SelectPrimitive.List className="p-1">
              {/* Clear / default option */}
              <DefaultItem placeholder={placeholder} />

              {groupByCategory(models).map(({ label, models: grouped }) => (
                <SelectPrimitive.Group key={label} className="scroll-my-1 mt-1">
                  <SelectPrimitive.GroupLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {label}
                  </SelectPrimitive.GroupLabel>
                  {grouped.map((m) => (
                    <ModelItem key={m.id} model={m} />
                  ))}
                </SelectPrimitive.Group>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ── Default / clear item ──────────────────────────────────────────────────────

function DefaultItem({ placeholder }: { placeholder: string }) {
  return (
    <SelectPrimitive.Item
      value=""
      className={cn(
        "relative flex flex-col gap-0.5 cursor-default rounded-md px-2 py-2 text-sm select-none outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50"
      )}
    >
      <span className="flex items-center gap-1.5 pr-6">
        <SelectPrimitive.ItemText className="text-muted-foreground">
          {placeholder}
        </SelectPrimitive.ItemText>
      </span>
      <span className="text-xs text-muted-foreground/70">Use provider default</span>
      <SelectPrimitive.ItemIndicator className="absolute right-2 top-2.5 flex items-center justify-center">
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

// ── Model item ────────────────────────────────────────────────────────────────

function ModelItem({ model: m }: { model: VoiceModelInfo }) {
  const hint = langHint(m);

  return (
    <SelectPrimitive.Item
      value={m.id}
      className={cn(
        "relative flex flex-col gap-0.5 cursor-default rounded-md px-2 py-2 text-sm select-none outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50"
      )}
    >
      {/* Top row: name + lang badge + streaming badge — name goes into trigger via ItemText */}
      <span className="flex items-center gap-1.5 pr-6 flex-wrap">
        <SelectPrimitive.ItemText className="font-medium">
          {m.display_name}
          {m.is_default ? " (default)" : ""}
        </SelectPrimitive.ItemText>

        {hint && (
          <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
            {hint}
          </span>
        )}

        {!m.streaming && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
            <AlertTriangle className="h-2.5 w-2.5" />
            batch only
          </span>
        )}

        {m.streaming && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shrink-0">
            <Zap className="h-2.5 w-2.5" />
            streaming
          </span>
        )}
      </span>

      {/* Description — only visible in the dropdown, never in trigger */}
      {m.description && (
        <span className="text-xs text-muted-foreground leading-relaxed">
          {m.description}
        </span>
      )}

      <SelectPrimitive.ItemIndicator className="absolute right-2 top-2.5 flex items-center justify-center">
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
