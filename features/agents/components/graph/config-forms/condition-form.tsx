"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ModelPicker } from "./model-picker";

interface Route {
  label: string;
  description: string;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function ConditionForm({ config, onChange }: Props) {
  const routes = (config.routes as Route[]) ?? [];

  function updateRoute(index: number, field: keyof Route, value: string) {
    const updated = routes.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange({ ...config, routes: updated });
  }

  function addRoute() {
    onChange({ ...config, routes: [...routes, { label: "", description: "" }] });
  }

  function removeRoute(index: number) {
    onChange({ ...config, routes: routes.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="router_prompt">Router Prompt</Label>
        <Textarea
          id="router_prompt"
          placeholder="Describe how to decide which route to take..."
          rows={4}
          className="resize-none text-sm"
          value={(config.router_prompt as string) ?? ""}
          onChange={(e) => onChange({ ...config, router_prompt: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Routes</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addRoute} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add route
          </Button>
        </div>
        {routes.length === 0 && (
          <p className="text-xs text-muted-foreground">No routes defined. Add at least one.</p>
        )}
        {routes.map((route, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Label (e.g. yes)"
                className="h-7 text-xs"
                value={route.label}
                onChange={(e) => updateRoute(i, "label", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeRoute(i)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Input
              placeholder="Description"
              className="h-7 text-xs"
              value={route.description}
              onChange={(e) => updateRoute(i, "description", e.target.value)}
            />
          </div>
        ))}
      </div>

      <ModelPicker config={config} onChange={onChange} />
    </div>
  );
}
