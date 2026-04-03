"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function HumanReviewForm({ config, onChange }: Props) {
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
        <Label htmlFor="context_variable">Context variable (optional)</Label>
        <Input
          id="context_variable"
          placeholder="e.g. email_body"
          className="text-sm font-mono"
          value={(config.context_variable as string) ?? ""}
          onChange={(e) => onChange({ ...config, context_variable: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Name of a collected field to show alongside the approval request — helps the reviewer understand what they&apos;re approving.
        </p>
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
