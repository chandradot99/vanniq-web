"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneIcon, Trash2Icon, ArrowRightLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePhoneNumbers, useReassignPhoneNumber, useRemovePhoneNumber } from "@/features/voice/hooks/use-phone-numbers";
import { useAgents } from "@/features/agents/hooks/use-agents";
import type { PhoneNumber } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AgentBadge({
  agentId,
  agents,
}: {
  agentId: string;
  agents: { id: string; name: string }[];
}) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return <span className="text-xs text-muted-foreground">Unknown agent</span>;
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="text-xs font-medium text-primary hover:underline truncate"
    >
      {agent.name}
    </Link>
  );
}

function NumberCard({
  pn,
  agents,
  onRemove,
}: {
  pn: PhoneNumber;
  agents: { id: string; name: string }[];
  onRemove: (pn: PhoneNumber) => void;
}) {
  const [reassigning, setReassigning] = useState(false);
  const reassign = useReassignPhoneNumber();

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors">
      {/* Top: icon + number */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <PhoneIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tracking-wide">{pn.number}</p>
            {pn.friendly_name && (
              <p className="text-xs text-muted-foreground truncate">{pn.friendly_name}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="capitalize text-[10px] shrink-0">
          {pn.provider}
        </Badge>
      </div>

      {/* Agent row */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground shrink-0">Agent:</span>
        {reassigning ? (
          <Select
            value={pn.agent_id}
            onValueChange={(newAgentId) => {
              if (newAgentId === pn.agent_id) { setReassigning(false); return; }
              reassign.mutate(
                { id: pn.id, agent_id: newAgentId },
                { onSettled: () => setReassigning(false) }
              );
            }}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <AgentBadge agentId={pn.agent_id} agents={agents} />
            <button
              onClick={() => setReassigning(true)}
              className="ml-auto shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              title="Reassign to another agent"
            >
              <ArrowRightLeftIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Footer: date + delete */}
      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground">Added {formatDate(pn.created_at)}</span>
        <button
          onClick={() => onRemove(pn)}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove number"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PhoneNumbersList() {
  const { data: phoneNumbers = [], isLoading } = usePhoneNumbers();
  const { data: agents = [] } = useAgents();
  const remove = useRemovePhoneNumber();
  const [toDelete, setToDelete] = useState<PhoneNumber | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (phoneNumbers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <PhoneIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No phone numbers yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add a number and assign it to an agent to start receiving calls
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {phoneNumbers.map((pn) => (
          <NumberCard
            key={pn.id}
            pn={pn}
            agents={agents}
            onRemove={setToDelete}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Remove phone number"
        description={`Remove ${toDelete?.number}? Incoming calls to this number will stop routing.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
