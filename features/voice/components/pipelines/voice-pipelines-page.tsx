"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PhoneIcon,
  Trash2,
  Plus,
  Bot,
  PhoneCallIcon,
  ArrowRight,
  Zap,
  Globe,
  Mic,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePhoneNumbers, useRemovePhoneNumber } from "@/features/voice/hooks/use-phone-numbers";
import type { PhoneNumber } from "@/types";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { PageHeader } from "@/components/layout/page-header";

// ── Helpers ───────────────────────────────────────────────────────────────────

function providerColor(provider: string) {
  const map: Record<string, string> = {
    twilio: "bg-red-50 text-red-700 border-red-200",
    telnyx: "bg-green-50 text-green-700 border-green-200",
    vonage: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return map[provider] ?? "bg-muted text-muted-foreground border-border";
}

// ── Pipeline Card ─────────────────────────────────────────────────────────────

function PipelineCard({
  pn,
  agentName,
  onRemove,
}: {
  pn: PhoneNumber;
  agentName: string | undefined;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const vc = pn.voice_config;

  const sttLabel = vc?.stt_provider
    ? `${vc.stt_provider}${vc.stt_model ? ` · ${vc.stt_model}` : ""}`
    : "Auto";
  const ttsLabel = vc?.tts_provider
    ? `${vc.tts_provider}${vc.tts_model ? ` · ${vc.tts_model}` : ""}`
    : "Auto";

  const hasCustomConfig = !!(vc?.stt_provider || vc?.tts_provider);
  const displayName = pn.friendly_name || pn.number;

  return (
    <Link
      href={`/voice/${pn.id}`}
      className="group block rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-5 px-6 py-5">
        {/* Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <PhoneIcon className="h-5 w-5 text-primary" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top row: name + number + provider badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-semibold">{displayName}</span>
            {pn.friendly_name && (
              <span className="font-mono text-xs text-muted-foreground">{pn.number}</span>
            )}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${providerColor(pn.provider)}`}
            >
              {pn.provider}
            </span>
          </div>

          {/* Agent row */}
          <div className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              {agentName ?? <span className="italic">Unknown agent</span>}
            </span>
          </div>

          {/* Voice config pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Mic className="h-3 w-3" />
              {sttLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <Volume2 className="h-3 w-3" />
              {ttsLabel}
            </span>
            {vc?.language && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Globe className="h-3 w-3" />
                {vc.language}
              </span>
            )}
            {hasCustomConfig && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Zap className="h-2.5 w-2.5" />
                Custom
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRemove}
            title="Remove pipeline"
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="p-2 text-muted-foreground group-hover:text-primary transition-colors">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
        <PhoneIcon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold mb-1.5">No voice pipelines yet</p>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Connect a phone number to an agent to start handling calls. Each pipeline gets its own
        STT, TTS, and language settings.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Pipeline
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function VoicePipelinesPage() {
  const router = useRouter();
  const [removingPn, setRemovingPn] = useState<PhoneNumber | null>(null);

  const { data: phoneNumbers = [], isLoading } = usePhoneNumbers();
  const { data: agents = [] } = useAgents();
  const remove = useRemovePhoneNumber();

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Voice Pipelines"
        description="Each pipeline connects a phone number to an agent with its own voice settings."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/voice/calls"
              className="inline-flex items-center h-8 px-3 rounded-md border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              <PhoneCallIcon className="h-3.5 w-3.5 mr-1.5" />
              Call History
            </Link>
            <Button size="sm" onClick={() => router.push("/voice/new")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Pipeline
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : phoneNumbers.length === 0 ? (
            <EmptyState onAdd={() => router.push("/voice/new")} />
          ) : (
            <div className="space-y-3">
              {phoneNumbers.map((pn) => (
                <PipelineCard
                  key={pn.id}
                  pn={pn}
                  agentName={agentMap[pn.agent_id]}
                  onRemove={(e) => {
                    e.preventDefault();
                    setRemovingPn(pn);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!removingPn}
        title="Remove pipeline"
        description={`Remove ${removingPn?.friendly_name ?? removingPn?.number ?? "this pipeline"}? The number will be disconnected from the agent.`}
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
