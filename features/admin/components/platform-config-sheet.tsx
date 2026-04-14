"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertPlatformConfig } from "../hooks/use-admin";
import type { ProviderSchema, PlatformConfig, FieldSchema } from "@/types";

interface Props {
  schema: ProviderSchema | null;
  existing: PlatformConfig | undefined;
  onOpenChange: (open: boolean) => void;
}

export function PlatformConfigSheet({ schema, existing, onOpenChange }: Props) {
  // Lazy initializer — runs once on mount (key prop in parent forces remount when schema changes)
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!schema) return {};
    return Object.fromEntries(
      schema.fields.map((f) => [
        f.key,
        f.secret ? "" : (existing?.config?.[f.key] ?? f.default ?? ""),
      ])
    );
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const upsert = useUpsertPlatformConfig({
    onSuccess: () => onOpenChange(false),
  });

  function handleSave() {
    if (!schema) return;
    const credentials: Record<string, string> = {};
    const config: Record<string, string> = {};

    for (const field of schema.fields) {
      const val = values[field.key]?.trim() ?? "";
      if (field.secret) {
        if (val) credentials[field.key] = val; // only send if user typed something
      } else {
        config[field.key] = val;
      }
    }

    upsert.mutate({ provider: schema.provider, data: { credentials, config, enabled: true } });
  }

  const isValid = schema?.fields
    .filter((f) => f.required)
    .every((f) => {
      const val = values[f.key]?.trim() ?? "";
      // For secret required fields on existing configs, allow empty (means "keep current")
      if (f.secret && existing) return true;
      return val.length > 0;
    }) ?? false;

  return (
    <Sheet open={!!schema} onOpenChange={() => onOpenChange(false)}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        {schema && (
          <>
            <SheetHeader className="pb-6 border-b border-border">
              <SheetTitle className="text-base">{schema.display_name}</SheetTitle>
              <SheetDescription asChild>
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>{schema.description}</p>
                  {schema.category === "voice" && (
                    <p className="text-xs text-muted-foreground">
                      This is the deployment default. Organisations that connect their own{" "}
                      {schema.display_name} credentials via Integrations will use those instead.
                    </p>
                  )}
                  {existing && (
                    <p className="text-xs text-muted-foreground">
                      Leave secret fields empty to keep the current values.
                    </p>
                  )}
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 py-6 space-y-5 overflow-y-auto">
              {schema.fields.map((field: FieldSchema) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.secret && !visible[field.key] ? "password" : "text"}
                      placeholder={
                        field.secret && existing
                          ? "Leave empty to keep current value"
                          : field.placeholder
                      }
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      className={field.secret ? "pr-10 font-mono text-sm" : "text-sm"}
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {visible[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid || upsert.isPending}
                className="flex-1"
              >
                {upsert.isPending ? "Saving…" : existing ? "Update" : "Save"}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
