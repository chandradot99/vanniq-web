"use client";

import type { TranscriptMessage } from "@/types";

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface Props {
  messages: TranscriptMessage[];
}

export function CallTranscript({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No transcript available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => {
        const isAgent = msg.role === "agent" || msg.role === "assistant";
        return (
          <div key={i} className={`flex gap-2 ${isAgent ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                isAgent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p>{msg.content}</p>
              {msg.timestamp && (
                <p className={`text-xs mt-1 ${isAgent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
