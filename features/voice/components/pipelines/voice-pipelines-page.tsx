"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneIcon, Settings2, Trash2, Plus, Bot, Mic, Volume2, PhoneCallIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePhoneNumbers, useRemovePhoneNumber } from "@/features/voice/hooks/use-phone-numbers";
import type { PhoneNumber } from "@/types";
import { AddPipelineDialog } from "./add-pipeline-dialog";
import { PipelineConfigPanel } from "./pipeline-config-panel";
import { useAgents } from "@/features/agents/hooks/use-agents";

// ── Pipeline Card ─────────────────────────────────────────────────────────────

function PipelineCard({
  pn,
  agentName,
  onConfigure,
  onRemove,
}: {
  pn: PhoneNumber;
  agentName: string | undefined;
  onConfigure: () => void;
  onRemove: () => void;
}) {
  const vc = pn.voice_config;
  const stt = vc?.stt_provider;
  const tts = vc?.tts_provider;

  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
          <PhoneIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold tracking-wide">{pn.number}</span>
            <Badge variant="secondary" className="capitalize text-[10px]">{pn.provider}</Badge>
            {pn.friendly_name && (
              <span className="text-xs text-muted-foreground">{pn.friendly_name}</span>
            )}
          </div>

          {/* Agent */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bot className="h-3 w-3 shrink-0" />
            {agentName ? (
              <Link href={`/agents/${pn.agent_id}`} className="hover:text-foreground hover:underline transition-colors">
                {agentName}
              </Link>
            ) : (
              <span className="italic">Unknown agent</span>
            )}
          </div>

          {/* Voice config summary */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              {stt ? <span className="capitalize">{stt}</span> : <span className="italic">Auto STT</span>}
            </span>
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              {tts ? <span className="capitalize">{tts}</span> : <span className="italic">Auto TTS</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onConfigure}
          title="Configure voice settings"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRemove}
          title="Remove pipeline"
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function VoicePipelinesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [removingPn, setRemovingPn] = useState<PhoneNumber | null>(null);

  const { data: phoneNumbers = [], isLoading } = usePhoneNumbers();
  const { data: agents = [] } = useAgents();
  const remove = useRemovePhoneNumber();

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));
  const configuringPn = phoneNumbers.find((pn) => pn.id === configuringId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold">Voice Pipelines</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Each pipeline connects a phone number to an agent with its own voice settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/voice/calls"
                className="inline-flex items-center h-8 px-3 rounded-md border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <PhoneCallIcon className="h-3.5 w-3.5 mr-1.5" />
                Call History
              </Link>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Pipeline
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <PhoneIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No voice pipelines yet</p>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Add a phone number and assign it to an agent to create your first voice pipeline.
              </p>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Pipeline
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {phoneNumbers.map((pn) => (
                <PipelineCard
                  key={pn.id}
                  pn={pn}
                  agentName={agentMap[pn.agent_id]}
                  onConfigure={() => setConfiguringId(pn.id)}
                  onRemove={() => setRemovingPn(pn)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Config panel slide-in */}
      {configuringPn && (
        <PipelineConfigPanel
          phoneNumber={configuringPn}
          onClose={() => setConfiguringId(null)}
        />
      )}

      <AddPipelineDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={!!removingPn}
        title="Remove pipeline"
        description={`Remove ${removingPn?.number ?? "this number"}? The number will be disconnected from the agent.`}
        onConfirm={() => {
          if (removingPn) {
            remove.mutate(removingPn.id, { onSuccess: () => setRemovingPn(null) });
          }
        }}
        onCancel={() => setRemovingPn(null)}
      />
    </div>
  );
}
