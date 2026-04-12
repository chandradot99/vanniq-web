"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { useAddPhoneNumber, useTwilioNumbers } from "@/features/voice/hooks/use-phone-numbers";
import type { TwilioAvailableNumber } from "@/types";

type Provider = "twilio" | "telnyx" | "vonage";

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "twilio", label: "Twilio" },
  { value: "telnyx", label: "Telnyx" },
  { value: "vonage", label: "Vonage" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddPipelineDialog({ open, onClose }: Props) {
  const [provider, setProvider] = useState<Provider>("twilio");
  const [selectedNumber, setSelectedNumber] = useState<TwilioAvailableNumber | null>(null);
  const [manualNumber, setManualNumber] = useState("");
  const [agentId, setAgentId] = useState("");

  const { data: agents = [] } = useAgents();
  const {
    data: twilioNumbers = [],
    isLoading: loadingNumbers,
    error: numbersError,
  } = useTwilioNumbers({ enabled: provider === "twilio" });
  const addNumber = useAddPhoneNumber();

  const availableNumbers = twilioNumbers.filter((n) => !n.already_imported);

  const phoneNumber = provider === "twilio" ? selectedNumber?.number : manualNumber.trim();
  const canSubmit = !!phoneNumber && !!agentId && !addNumber.isPending;

  function handleProviderChange(val: Provider) {
    setProvider(val);
    setSelectedNumber(null);
    setManualNumber("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumber) return;
    addNumber.mutate(
      {
        agent_id: agentId,
        number: phoneNumber,
        provider,
        sid: selectedNumber?.sid ?? "",
        friendly_name: selectedNumber?.friendly_name || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  }

  function handleClose() {
    setProvider("twilio");
    setSelectedNumber(null);
    setManualNumber("");
    setAgentId("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Voice Pipeline</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Provider */}
          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={(v) => handleProviderChange(v as Provider)}>
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone number — Twilio: auto-fetched dropdown; Telnyx/Vonage: manual input */}
          <div className="space-y-1.5">
            <Label htmlFor="number">Phone Number</Label>

            {provider === "twilio" ? (
              <>
                {numbersError ? (
                  <p className="text-sm text-destructive">
                    Could not load Twilio numbers. Add a Twilio integration first.
                  </p>
                ) : (
                  <Select
                    value={selectedNumber?.number ?? ""}
                    onValueChange={(val) => {
                      const found = twilioNumbers.find((n) => n.number === val) ?? null;
                      setSelectedNumber(found);
                    }}
                    disabled={loadingNumbers}
                  >
                    <SelectTrigger id="number" className="w-full">
                      <SelectValue
                        placeholder={
                          loadingNumbers
                            ? "Loading your Twilio numbers…"
                            : availableNumbers.length === 0
                            ? "No available numbers"
                            : "Select a number…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNumbers.map((n) => (
                        <SelectItem key={n.number} value={n.number}>
                          <span className="font-mono">{n.number}</span>
                          {n.friendly_name && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              {n.friendly_name}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                      {twilioNumbers.some((n) => n.already_imported) && (
                        <>
                          <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
                            Already imported
                          </div>
                          {twilioNumbers
                            .filter((n) => n.already_imported)
                            .map((n) => (
                              <SelectItem key={n.number} value={n.number} disabled>
                                <span className="font-mono opacity-50">{n.number}</span>
                              </SelectItem>
                            ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Numbers purchased in your Twilio account
                </p>
              </>
            ) : (
              <>
                <Input
                  id="number"
                  type="tel"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the number exactly as it appears in your {provider === "telnyx" ? "Telnyx" : "Vonage"} account (E.164 format)
                </p>
              </>
            )}
          </div>

          {/* Agent */}
          <div className="space-y-1.5">
            <Label htmlFor="agent">Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger id="agent" className="w-full">
                <SelectValue placeholder="Select agent…" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {addNumber.isPending ? "Adding…" : "Add Pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
