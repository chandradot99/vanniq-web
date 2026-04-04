"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  collectedVariables?: string[];
}

const NONE_VALUE = "__none__";

export function HumanReviewForm({ config, onChange, collectedVariables = [] }: Props) {
  const contextVariable = (config.context_variable as string) ?? "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Review message</Label>
        <Textarea
          id="message"
          placeholder="Please review and approve this action."
          rows={3}
          className="resize-none text-sm"
          value={(config.message as string) ?? ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Shown to the reviewer in the approval UI.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Show context variable (optional)</Label>
        {collectedVariables.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No collected fields yet — add a Collect Data node upstream.
          </p>
        ) : (
          <>
            <Select
              value={contextVariable || NONE_VALUE}
              onValueChange={(v) =>
                onChange({ ...config, context_variable: v === NONE_VALUE ? "" : v })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {collectedVariables.map((v) => (
                  <SelectItem key={v} value={v}>
                    <span className="font-mono">{`{{collected.${v}}}`}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Value is shown alongside the approval message so the reviewer knows what they&apos;re approving.
            </p>
          </>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-medium">This node has two output handles:</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span><strong>approve</strong> — user clicked Approve</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span><strong>reject</strong> — user clicked Reject</span>
        </div>
      </div>
    </div>
  );
}
