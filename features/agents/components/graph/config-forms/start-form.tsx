"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function StartForm({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="system_message">System Message</Label>
        <Textarea
          id="system_message"
          placeholder="You are a helpful assistant..."
          rows={6}
          className="resize-none text-sm"
          value={(config.system_message as string) ?? ""}
          onChange={(e) => onChange({ ...config, system_message: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Defines the agent&apos;s persona and global rules. Automatically applied to every LLM
          response node in this graph.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting">
          Greeting{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="greeting"
          placeholder="Hello! How can I help you today?"
          rows={4}
          className="resize-none text-sm"
          value={(config.greeting as string) ?? ""}
          onChange={(e) => onChange({ ...config, greeting: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Sent to the user immediately when the session opens, before any input.
        </p>
      </div>
    </div>
  );
}
