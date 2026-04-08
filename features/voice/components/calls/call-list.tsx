"use client";

import { PhoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VoiceCallSummary } from "@/types";

function sentimentVariant(s: VoiceCallSummary["sentiment"]) {
  if (s === "positive") return "default";
  if (s === "negative") return "destructive";
  return "secondary";
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  calls: VoiceCallSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CallList({ calls, selectedId, onSelect }: Props) {
  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground py-16">
        <PhoneIcon className="size-8 opacity-30" />
        <p>No calls yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {calls.map((call) => {
        const isSelected = call.id === selectedId;
        const duration = formatDuration(call.duration_seconds);
        return (
          <button
            key={call.id}
            onClick={() => onSelect(call.id)}
            className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-muted/50 ${
              isSelected ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium truncate">{call.user_id}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {call.status === "active" && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                  {call.sentiment && (
                    <Badge variant={sentimentVariant(call.sentiment)} className="capitalize text-[10px]">
                      {call.sentiment}
                    </Badge>
                  )}
                  {duration && (
                    <span className="text-xs text-muted-foreground">{duration}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {formatRelative(call.created_at)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
