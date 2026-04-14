"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

export function PlatformConfigDialog({ schema, existing, onOpenChange }: Props) {
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
        if (val) credentials[field.key] = val;
      } else {
        config[field.key] = val;
      }
    }

    upsert.mutate({ provider: schema.provider, data: { credentials, config, enabled: true } });
  }

  const isValid =
    schema?.fields
      .filter((f) => f.required)
      .every((f) => {
        const val = values[f.key]?.trim() ?? "";
        if (f.secret && existing) return true;
        return val.length > 0;
      }) ?? false;

  return (
    <Dialog open={!!schema} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        {schema && (
          <>
            <DialogHeader>
              <DialogTitle>{schema.display_name}</DialogTitle>
              <DialogDescription>
                {schema.description}
                {existing && (
                  <span className="block mt-1">
                    Leave secret fields empty to keep the current values.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {schema.fields.map((field: FieldSchema) => (
                <div key={field.key} className="space-y-1.5">
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

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isValid || upsert.isPending}>
                {upsert.isPending ? "Saving…" : existing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
