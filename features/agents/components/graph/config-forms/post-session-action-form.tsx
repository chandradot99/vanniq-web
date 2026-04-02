"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function PostSessionActionForm({ config, onChange }: Props) {
  const actions = (config.actions as string[]) ?? [];

  function updateAction(index: number, value: string) {
    const updated = actions.map((a, i) => (i === index ? value : a));
    onChange({ ...config, actions: updated });
  }

  function addAction() {
    onChange({ ...config, actions: [...actions, ""] });
  }

  function removeAction(index: number) {
    onChange({ ...config, actions: actions.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Actions</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addAction} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add action
        </Button>
      </div>

      {actions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No actions. E.g. <code className="font-mono bg-muted px-1 rounded">create_crm_lead</code>
        </p>
      )}

      {actions.map((action, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="e.g. create_crm_lead"
            className="h-7 text-xs flex-1"
            value={action}
            onChange={(e) => updateAction(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeAction(i)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
