"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModelPicker } from "./model-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Field {
  name: string;
  type: string;
  prompt: string;
  required: boolean;
}

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function CollectDataForm({ config, onChange }: Props) {
  const fields = (config.fields as Field[]) ?? [];

  function updateField(index: number, patch: Partial<Field>) {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange({ ...config, fields: updated });
  }

  function addField() {
    onChange({
      ...config,
      fields: [...fields, { name: "", type: "string", prompt: "", required: true }],
    });
  }

  function removeField(index: number) {
    onChange({ ...config, fields: fields.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="instructions">
          Instructions{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="instructions"
          placeholder="e.g. User wants to book a meeting. Collect date, time, and title."
          rows={3}
          className="resize-none text-xs"
          value={(config.instructions as string) ?? ""}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Helps the node extract fields the user already mentioned upfront — skipping unnecessary questions.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label>Fields to collect</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addField} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">No fields defined.</p>
      )}
      {fields.length > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            Fields are stored as <span className="font-mono">{"{{collected.field_name}}"}</span> — use these in Run Tool inputs, HTTP Request bodies, and Human Review messages.
          </p>
        </div>
      )}

      {fields.map((field, i) => (
        <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="field_name"
              className="h-7 text-xs flex-1 font-mono"
              value={field.name}
              onChange={(e) => updateField(i, { name: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
            />
            <Select value={field.type} onValueChange={(v) => updateField(i, { type: v })}>
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["string", "number", "email", "phone", "date", "boolean"].map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => removeField(i)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input
            placeholder="Prompt shown to user"
            className="h-7 text-xs"
            value={field.prompt}
            onChange={(e) => updateField(i, { prompt: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={(v) => updateField(i, { required: v })}
              className="scale-75"
            />
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
        </div>
      ))}

      <ModelPicker config={config} onChange={onChange} />
    </div>
  );
}
