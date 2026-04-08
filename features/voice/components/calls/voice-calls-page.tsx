"use client";

import { useState } from "react";
import { PhoneOutgoingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceCalls } from "@/features/voice/hooks/use-voice-calls";
import { CallList } from "./call-list";
import { CallDetail } from "./call-detail";
import { OutboundCallDialog } from "./outbound-call-dialog";

export function VoiceCallsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outboundOpen, setOutboundOpen] = useState(false);

  const { data, isLoading } = useVoiceCalls();
  const calls = data?.calls ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-base font-semibold">Voice Calls</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.total != null ? `${data.total} total calls` : "Call history"}
          </p>
        </div>
        <Button size="sm" onClick={() => setOutboundOpen(true)}>
          <PhoneOutgoingIcon className="size-4 mr-1.5" />
          Outbound Call
        </Button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: call list */}
        <div className="w-72 shrink-0 border-r border-border overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <CallList calls={calls} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        {/* Right: call detail */}
        <div className="flex-1 min-w-0">
          {selectedId ? (
            <CallDetail sessionId={selectedId} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a call to view details
            </div>
          )}
        </div>
      </div>

      <OutboundCallDialog open={outboundOpen} onClose={() => setOutboundOpen(false)} />
    </div>
  );
}
