"use client";

import { useState } from "react";
import { PhoneIcon, PlusIcon, Trash2Icon, PhoneOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePhoneNumbers, useRemovePhoneNumber } from "@/features/voice/hooks/use-phone-numbers";
import { ConnectNumberDialog } from "./connect-number-dialog";
import type { PhoneNumber } from "@/types";

interface Props {
  agentId: string;
  agentName: string;
}

function NumberCard({
  pn,
  onRemove,
}: {
  pn: PhoneNumber;
  onRemove: (pn: PhoneNumber) => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <PhoneIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold tracking-wide">{pn.number}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize text-[10px]">
              {pn.provider}
            </Badge>
            {pn.friendly_name && (
              <span className="text-xs text-muted-foreground truncate">{pn.friendly_name}</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRemove(pn)}
        className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        title="Disconnect number"
      >
        <Trash2Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AgentPhoneNumbers({ agentId, agentName }: Props) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [toRemove, setToRemove] = useState<PhoneNumber | null>(null);

  const { data: numbers = [], isLoading } = usePhoneNumbers(agentId);
  const remove = useRemovePhoneNumber();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Phone Numbers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Incoming calls to these numbers will be handled by <span className="font-medium text-foreground">{agentName}</span>
            </p>
          </div>
          <Button size="sm" onClick={() => setConnectOpen(true)}>
            <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
            Connect Number
          </Button>
        </div>

        {/* Numbers */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl border border-border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : numbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <PhoneOffIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No phone numbers connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect a Twilio number so calls route to this agent
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)}>
              <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
              Connect Number
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {numbers.map((pn) => (
              <NumberCard key={pn.id} pn={pn} onRemove={setToRemove} />
            ))}
          </div>
        )}

        {/* Info callout */}
        {numbers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Each number can only be connected to one agent at a time. To move a number, disconnect it here and connect it to another agent.
          </p>
        )}
      </div>

      <ConnectNumberDialog
        open={connectOpen}
        agentId={agentId}
        onClose={() => setConnectOpen(false)}
      />

      <ConfirmDialog
        open={!!toRemove}
        title="Disconnect phone number"
        description={`Disconnect ${toRemove?.number}? Incoming calls will stop routing to ${agentName}.`}
        confirmLabel="Disconnect"
        onConfirm={() => {
          if (toRemove) remove.mutate(toRemove.id);
          setToRemove(null);
        }}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
