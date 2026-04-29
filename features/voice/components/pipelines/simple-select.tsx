"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SimpleSelectOption = {
  value: string;
  label: string;
  sublabel?: string;  // shown below the label in the dropdown only
  group?: string;     // group header label
};

type Props = {
  options: SimpleSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// ── SimpleSelect ──────────────────────────────────────────────────────────────

export function SimpleSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: Props) {
  const selected = options.find((o) => o.value === value);

  // Group options if any have a group key
  const hasGroups = options.some((o) => o.group);
  const groups = hasGroups ? buildGroups(options) : null;

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
        <span className={cn("flex-1 text-left truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner side="bottom" sideOffset={4} collisionPadding={8} alignItemWithTrigger={false} className="isolate z-50">
          <SelectPrimitive.Popup
            className={cn(
              "max-h-72 w-(--anchor-width) min-w-40 overflow-y-auto rounded-lg bg-popover shadow-lg",
              "ring-1 ring-foreground/10 origin-(--transform-origin)",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100"
            )}
          >
            <SelectPrimitive.List className="p-1">
              {groups
                ? groups.map(({ label: groupLabel, options: groupOpts }) => (
                    <SelectPrimitive.Group key={groupLabel} className="scroll-my-1 mt-1 first:mt-0">
                      <SelectPrimitive.GroupLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        {groupLabel}
                      </SelectPrimitive.GroupLabel>
                      {groupOpts.map((opt) => (
                        <SimpleItem key={opt.value} option={opt} />
                      ))}
                    </SelectPrimitive.Group>
                  ))
                : options.map((opt) => (
                    <SimpleItem key={opt.value} option={opt} />
                  ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ── Item ──────────────────────────────────────────────────────────────────────

function SimpleItem({ option }: { option: SimpleSelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      className={cn(
        "relative flex items-start gap-2 cursor-default rounded-md px-2 py-2 text-sm select-none outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50"
      )}
    >
      <span className="flex flex-col gap-0.5 flex-1 min-w-0">
        <SelectPrimitive.ItemText
          className={cn(option.value === "" && "text-muted-foreground")}
        >
          {option.label}
        </SelectPrimitive.ItemText>
        {option.sublabel && (
          <span className="text-xs text-muted-foreground leading-relaxed">
            {option.sublabel}
          </span>
        )}
      </span>

      <SelectPrimitive.ItemIndicator className="absolute right-2 top-2.5 flex items-center justify-center">
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildGroups(
  options: SimpleSelectOption[]
): { label: string; options: SimpleSelectOption[] }[] {
  const groups: Record<string, SimpleSelectOption[]> = {};
  for (const opt of options) {
    const key = opt.group ?? "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(opt);
  }
  return Object.entries(groups).map(([label, opts]) => ({ label, options: opts }));
}
