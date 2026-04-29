"use client";

import { useState } from "react";
import { PhoneIcon, Bot, ChevronRight, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { useAddPhoneNumber, useTwilioNumbers } from "@/features/voice/hooks/use-phone-numbers";
import type { TwilioAvailableNumber } from "@/types";

type Provider = "twilio" | "telnyx" | "vonage";

const PROVIDERS: { value: Provider; label: string; description: string }[] = [
  { value: "twilio", label: "Twilio", description: "Auto-import numbers from your Twilio account" },
  { value: "telnyx", label: "Telnyx", description: "Enter your Telnyx number manually (E.164)" },
  { value: "vonage", label: "Vonage", description: "Enter your Vonage number manually (E.164)" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function AddPipelineDialog({ open, onClose, onCreated }: Props) {
  const [provider, setProvider] = useState<Provider>("twilio");
  const [selectedNumber, setSelectedNumber] = useState<TwilioAvailableNumber | null>(null);
  const [manualNumber, setManualNumber] = useState("");
  const [agentId, setAgentId] = useState("");

  const { data: agents = [] } = useAgents();
  const {
    data: twilioNumbers = [],
    isLoading: loadingNumbers,
    error: numbersError,
  } = useTwilioNumbers({ enabled: provider === "twilio" && open });
  const addNumber = useAddPhoneNumber();

  const availableNumbers = twilioNumbers.filter((n) => !n.already_imported);
  const importedNumbers = twilioNumbers.filter((n) => n.already_imported);

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
        onSuccess: (created) => {
          handleClose();
          onCreated(created.id);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Voice Pipeline</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Connect a phone number to an agent. You&apos;ll configure STT, TTS, and voice settings on the next screen.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">

          {/* Provider selection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Telephony Provider
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    provider === p.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent"
                  }`}
                >
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="text-[10px] leading-snug">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone number */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Phone Number
            </p>

            {provider === "twilio" ? (
              <div className="space-y-2">
                {numbersError ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      Could not load Twilio numbers. Make sure you&apos;ve added a Twilio integration in Settings.
                    </p>
                  </div>
                ) : loadingNumbers ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 rounded-lg border border-border bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : availableNumbers.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 p-4">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      All your Twilio numbers are already imported. Purchase a new number in your Twilio console.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-auto rounded-lg border border-border divide-y divide-border">
                    {availableNumbers.map((n) => (
                      <button
                        key={n.number}
                        type="button"
                        onClick={() => setSelectedNumber(n)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                          selectedNumber?.number === n.number
                            ? "bg-primary/5"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              selectedNumber?.number === n.number ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                          />
                          <div>
                            <p className="font-mono text-sm font-medium">{n.number}</p>
                            {n.friendly_name && (
                              <p className="text-xs text-muted-foreground">{n.friendly_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {n.capabilities.voice && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">
                              Voice
                            </span>
                          )}
                          {n.capabilities.sms && (
                            <span className="text-[10px] bg-muted text-muted-foreground border border-border rounded px-1.5 py-0.5">
                              SMS
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {importedNumbers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {importedNumbers.length} number{importedNumbers.length > 1 ? "s" : ""} already imported
                  </p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="tel"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  E.164 format — exactly as it appears in your{" "}
                  {provider === "telnyx" ? "Telnyx" : "Vonage"} account
                </p>
              </div>
            )}
          </div>

          {/* Agent selection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Agent
            </p>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agents yet — create an agent first.</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-auto rounded-lg border border-border divide-y divide-border">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgentId(a.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      agentId === a.id ? "bg-primary/5" : "hover:bg-accent"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        agentId === a.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      {a.language && (
                        <p className="text-xs text-muted-foreground capitalize">{a.language}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {addNumber.isPending ? "Creating…" : "Create Pipeline"}
              {!addNumber.isPending && <ChevronRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
