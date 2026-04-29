"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PhoneIcon, Bot, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { useAddPhoneNumber, useTwilioNumbers } from "@/features/voice/hooks/use-phone-numbers";
import type { TwilioAvailableNumber } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Provider = "twilio" | "telnyx" | "vonage";

const PROVIDERS: { value: Provider; label: string; description: string }[] = [
  { value: "twilio", label: "Twilio", description: "Auto-import numbers from your Twilio account" },
  { value: "telnyx", label: "Telnyx", description: "Enter your number manually (E.164 format)" },
  { value: "vonage", label: "Vonage", description: "Enter your number manually (E.164 format)" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function FieldLabel({
  children,
  hint,
  optional,
}: {
  children: React.ReactNode;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium">
        {children}
        {optional && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreatePipelinePage() {
  const router = useRouter();

  const [provider, setProvider] = useState<Provider>("twilio");
  const [selectedNumber, setSelectedNumber] = useState<TwilioAvailableNumber | null>(null);
  const [manualNumber, setManualNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");

  const { data: agents = [] } = useAgents();
  const {
    data: twilioNumbers = [],
    isLoading: loadingNumbers,
    error: numbersError,
  } = useTwilioNumbers({ enabled: provider === "twilio" });
  const addNumber = useAddPhoneNumber();

  const availableNumbers = twilioNumbers.filter((n) => !n.already_imported);
  const importedNumbers = twilioNumbers.filter((n) => n.already_imported);

  const phoneNumber = provider === "twilio" ? selectedNumber?.number : manualNumber.trim();

  // Auto-fill name from selected number's friendly_name if user hasn't typed one
  const effectiveName =
    name.trim() ||
    (provider === "twilio" && selectedNumber?.friendly_name) ||
    "";

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
        friendly_name: effectiveName || undefined,
      },
      {
        onSuccess: (created) => {
          router.push(`/voice/${created.id}`);
        },
      }
    );
  }

  const inputCls =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-8 h-14 flex items-center gap-3">
          <Link
            href="/voice"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Pipelines
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">New Pipeline</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="max-w-xl">
            <div className="mb-8">
              <h1 className="text-xl font-semibold mb-1">Create Voice Pipeline</h1>
              <p className="text-sm text-muted-foreground">
                Connect a phone number to an agent. You&apos;ll configure STT, TTS, and voice
                settings after creation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name */}
              <section>
                <SectionLabel>Pipeline Name</SectionLabel>
                <FieldLabel
                  optional
                  hint="A label to identify this pipeline. Defaults to the number's friendly name."
                >
                  Name
                </FieldLabel>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    selectedNumber?.friendly_name
                      ? selectedNumber.friendly_name
                      : "e.g. Support Line, Sales US"
                  }
                  className={inputCls}
                />
              </section>

              {/* Provider */}
              <section>
                <SectionLabel>Telephony Provider</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleProviderChange(p.value)}
                      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${
                        provider === p.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent"
                      }`}
                    >
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {p.description}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Phone number */}
              <section>
                <SectionLabel>Phone Number</SectionLabel>

                {provider === "twilio" ? (
                  <div className="space-y-3">
                    {numbersError ? (
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800">
                          Could not load Twilio numbers. Make sure you&apos;ve added a Twilio
                          integration in Settings.
                        </p>
                      </div>
                    ) : loadingNumbers ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-14 rounded-xl border border-border bg-muted animate-pulse"
                          />
                        ))}
                      </div>
                    ) : availableNumbers.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                        <PhoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          All your Twilio numbers are already imported. Purchase a new number in
                          your Twilio console.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                        {availableNumbers.map((n) => (
                          <button
                            key={n.number}
                            type="button"
                            onClick={() => setSelectedNumber(n)}
                            className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                              selectedNumber?.number === n.number
                                ? "bg-primary/5"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                                  selectedNumber?.number === n.number
                                    ? "bg-primary"
                                    : "bg-muted-foreground/25"
                                }`}
                              />
                              <div>
                                <p className="font-mono text-sm font-semibold">{n.number}</p>
                                {n.friendly_name && (
                                  <p className="text-xs text-muted-foreground">{n.friendly_name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              {n.capabilities.voice && (
                                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                                  Voice
                                </span>
                              )}
                              {n.capabilities.sms && (
                                <span className="text-[11px] bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5">
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
                        {importedNumbers.length} number
                        {importedNumbers.length > 1 ? "s" : ""} already connected to a pipeline
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <FieldLabel
                      hint={`Enter your number exactly as it appears in your ${
                        provider === "telnyx" ? "Telnyx" : "Vonage"
                      } account (E.164 format).`}
                    >
                      Number
                    </FieldLabel>
                    <input
                      type="tel"
                      value={manualNumber}
                      onChange={(e) => setManualNumber(e.target.value)}
                      placeholder="+1234567890"
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                )}
              </section>

              {/* Agent */}
              <section>
                <SectionLabel>Agent</SectionLabel>
                <FieldLabel hint="The agent that will handle calls on this number.">Agent</FieldLabel>

                {agents.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                    <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      No agents yet.{" "}
                      <Link href="/agents/new" className="text-primary hover:underline">
                        Create an agent
                      </Link>{" "}
                      first.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAgentId(a.id)}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                          agentId === a.id ? "bg-primary/5" : "hover:bg-accent"
                        }`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                            agentId === a.id ? "bg-primary" : "bg-muted-foreground/25"
                          }`}
                        />
                        <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.name}</p>
                          {a.language && (
                            <p className="text-xs text-muted-foreground capitalize">{a.language}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/voice")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {addNumber.isPending ? "Creating…" : "Create Pipeline"}
                  {!addNumber.isPending && <ChevronRight className="h-4 w-4 ml-1.5" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
