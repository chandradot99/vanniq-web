"use client";

import { useState } from "react";
import { ExternalLinkIcon, MicIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVoiceCall } from "@/features/voice/hooks/use-voice-calls";
import { CallTranscript } from "./call-transcript";

const TABS = ["Transcript", "Summary", "Collected"] as const;
type Tab = (typeof TABS)[number];

function sentimentBadgeVariant(sentiment: string | null) {
  if (sentiment === "positive") return "default";
  if (sentiment === "negative") return "destructive";
  return "secondary";
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
  sessionId: string;
}

export function CallDetail({ sessionId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Transcript");
  const { data: call, isLoading } = useVoiceCall(sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!call) return null;

  const collected = (call.meta?.collected ?? {}) as Record<string, string>;
  const recordingUrl = call.meta?.recording_url as string | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-medium">{call.meta?.from as string ?? call.user_id}</span>
          {call.sentiment && (
            <Badge variant={sentimentBadgeVariant(call.sentiment)} className="capitalize">
              {call.sentiment}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDuration(call.duration_seconds)}
          </span>
        </div>

        {recordingUrl && (
          <a
            href={recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <MicIcon className="size-3" />
            Recording
            <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-1 mr-5 text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "Transcript" && (
          <CallTranscript messages={call.transcript} />
        )}

        {activeTab === "Summary" && (
          <div className="space-y-4">
            {call.summary ? (
              <p className="text-sm leading-relaxed">{call.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No summary available</p>
            )}

            {call.tool_calls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Tool Calls
                </h3>
                <div className="space-y-2">
                  {call.tool_calls.map((tc, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tc.tool_name}</span>
                        <Badge variant={tc.success ? "default" : "destructive"} className="text-[10px]">
                          {tc.success ? "ok" : "failed"}
                        </Badge>
                      </div>
                      <pre className="text-muted-foreground overflow-x-auto text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(tc.input, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Collected" && (
          <div>
            {Object.keys(collected).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data collected during this call</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(collected).map(([key, value]) => (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium text-muted-foreground capitalize w-1/3">
                        {key.replace(/_/g, " ")}
                      </td>
                      <td className="py-2">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
