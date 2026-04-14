"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageBody } from "@/components/layout/page-body";
import { useIntegrations } from "../hooks/use-integrations";
import { integrationsApi } from "../api";
import { ProviderCard } from "./provider-card";
import type { ProviderDef } from "./provider-card";
import { ApiKeyDialog } from "./api-key-dialog";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types";

// ── Provider logos ────────────────────────────────────────────────────────────

function Logo({ bg, text }: { bg: string; text: string }) {
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${bg}`}>
      {text}
    </div>
  );
}

function GoogleLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    </div>
  );
}

// ── Provider definitions ──────────────────────────────────────────────────────

type Tab = "provider-keys" | "connected-apps";

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const [apiKeyProvider, setApiKeyProvider] = useState<string | null>(null);
  const [connectingOAuth, setConnectingOAuth] = useState<string | null>(null);

  const { data: integrations = [], isLoading } = useIntegrations();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as Tab) ?? "provider-keys";

  function setTab(tab: Tab) {
    router.replace(`/integrations?tab=${tab}`);
  }

  // Handle OAuth callback redirects
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "google") {
      toast.success("Google account connected successfully");
      router.replace("/integrations?tab=connected-apps");
    } else if (error) {
      const messages: Record<string, string> = {
        google_oauth_denied: "Google authorization was cancelled",
        invalid_state: "Authorization expired — please try again",
        token_exchange_failed: "Failed to connect Google account — please try again",
      };
      toast.error(messages[error] ?? "Something went wrong");
      router.replace("/integrations?tab=connected-apps");
    }
  }, [searchParams, router]);

  function byProvider(provider: string): Integration | undefined {
    return integrations.find((i) => i.provider === provider);
  }

  async function handleOAuthConnect(provider: string) {
    setConnectingOAuth(provider);
    try {
      const { url } = await integrationsApi.getOAuthConnectUrl(provider);
      window.location.assign(url);
    } catch {
      toast.error(`Failed to start ${provider} authorization`);
      setConnectingOAuth(null);
    }
  }

  // ── Provider Keys definitions ───────────────────────────────────────────────

  const aiModelDefs: ProviderDef[] = [
    {
      provider: "openai",
      name: "OpenAI",
      description: "GPT-4o and GPT-4o-mini for agent responses and reasoning.",
      logo: <Logo bg="bg-[#10a37f]" text="O" />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("openai"),
    },
    {
      provider: "anthropic",
      name: "Anthropic",
      description: "Claude 3.5 Sonnet and Haiku. Best-in-class instruction following.",
      logo: <Logo bg="bg-[#c9602f]" text="A" />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("anthropic"),
    },
    {
      provider: "groq",
      name: "Groq",
      description: "Llama 3, Gemma 2, and Mixtral at ultra-low latency.",
      logo: <Logo bg="bg-[#f55036]" text="G" />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("groq"),
    },
    {
      provider: "gemini",
      name: "Google Gemini",
      description: "Gemini 1.5 Pro and Flash for multimodal and long-context flows.",
      logo: <Logo bg="bg-[#4285F4]" text="G" />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("gemini"),
    },
    {
      provider: "mistral",
      name: "Mistral",
      description: "European open-weight models with strong multilingual performance.",
      logo: <Logo bg="bg-[#ff7000]" text="M" />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("mistral"),
    },
  ];

  const voiceDefs: ProviderDef[] = [
    {
      provider: "deepgram",
      name: "Deepgram",
      description: "Low-latency STT with Nova models, optimised for phone and WebRTC audio.",
      logo: <Logo bg="bg-[#101010]" text="Dg" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("deepgram"),
    },
    {
      provider: "cartesia",
      name: "Cartesia",
      description: "Ultra-low-latency TTS. Sonic models deliver sub-100ms first audio.",
      logo: <Logo bg="bg-[#7c3aed]" text="Ca" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("cartesia"),
    },
    {
      provider: "elevenlabs",
      name: "ElevenLabs",
      description: "High-quality TTS with voice cloning. Best for lifelike agent voices.",
      logo: <Logo bg="bg-[#1a1a1a]" text="11" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("elevenlabs"),
    },
    {
      provider: "sarvam",
      name: "Sarvam AI",
      description: "STT and TTS for Indian languages — Hindi, Tamil, Telugu, and more.",
      logo: <Logo bg="bg-[#f97316]" text="Sa" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("sarvam"),
    },
  ];

  const telephonyDefs: ProviderDef[] = [
    {
      provider: "twilio",
      name: "Twilio",
      description: "Phone number management and PSTN calls. Most widely supported.",
      logo: <Logo bg="bg-[#f22f46]" text="Tw" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("twilio"),
    },
    {
      provider: "telnyx",
      name: "Telnyx",
      description: "Carrier-grade telephony with competitive per-minute rates.",
      logo: <Logo bg="bg-[#00c08b]" text="Te" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("telnyx"),
    },
    {
      provider: "vonage",
      name: "Vonage",
      description: "Voice API with global coverage and programmable PSTN.",
      logo: <Logo bg="bg-[#7c1d7c]" text="Vo" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("vonage"),
    },
  ];

  const messagingDefs: ProviderDef[] = [
    {
      provider: "gupshup",
      name: "Gupshup",
      description: "WhatsApp Business API. Most cost-effective option for India.",
      logo: <Logo bg="bg-[#25d366]" text="Gu" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("gupshup"),
    },
  ];

  // ── Connected Apps definitions ──────────────────────────────────────────────

  const connectedAppDefs: ProviderDef[] = [
    {
      provider: "google",
      name: "Google",
      description: "Access Google Calendar and Gmail. Create events, send emails, list meetings.",
      logo: <GoogleLogo />,
      authType: "oauth",
      onConnect: () => handleOAuthConnect("google"),
    },
    {
      provider: "hubspot",
      name: "HubSpot",
      description: "Create and update CRM contacts and deals from agent conversations.",
      logo: <Logo bg="bg-[#ff7a59]" text="Hs" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("hubspot"),
    },
    {
      provider: "slack",
      name: "Slack",
      description: "Post messages and alerts to Slack channels from your agents.",
      logo: <Logo bg="bg-[#4a154b]" text="Sl" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("slack"),
    },
    {
      provider: "razorpay",
      name: "Razorpay",
      description: "Create payment links and check order status during voice calls.",
      logo: <Logo bg="bg-[#072654]" text="Rz" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("razorpay"),
    },
    {
      provider: "stripe",
      name: "Stripe",
      description: "Create payment links and retrieve customer billing details.",
      logo: <Logo bg="bg-[#635bff]" text="St" />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("stripe"),
    },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader title="Integrations" description="Connect AI providers, voice services, and external apps." />
        <PageBody>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PageBody>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Integrations"
        description="Connect AI providers, voice services, and external apps."
      />

      {/* Tabs */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="max-w-[1600px] mx-auto px-8 flex gap-0">
          {(["provider-keys", "connected-apps"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "provider-keys" ? "Provider Keys" : "Connected Apps"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <PageBody>
        {activeTab === "provider-keys" ? (
          <div className="space-y-6">
            <Section
              title="AI Models"
              description="Language models that power agent responses and reasoning."
            >
              {aiModelDefs.map((def) => (
                <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
              ))}
            </Section>

            <Section
              title="Voice"
              description="STT and TTS providers for voice agents. Your keys are used for all calls made by your organisation."
            >
              {voiceDefs.map((def) => (
                <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
              ))}
            </Section>

            <Section
              title="Telephony"
              description="Phone number providers for inbound and outbound calls."
            >
              {telephonyDefs.map((def) => (
                <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
              ))}
            </Section>

            <Section
              title="Messaging"
              description="WhatsApp and messaging channels for your agents."
            >
              {messagingDefs.map((def) => (
                <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
              ))}
            </Section>
          </div>
        ) : (
          <div className="space-y-6">
            <Section
              title="Connected Apps"
              description="Connect your organisation's accounts so agents can take actions on your behalf."
            >
              {connectedAppDefs.map((def) => (
                <ProviderCard
                  key={def.provider}
                  def={{
                    ...def,
                    onConnect:
                      def.provider === "google" && connectingOAuth === "google"
                        ? () => {}
                        : def.onConnect,
                  }}
                  integration={byProvider(def.provider)}
                />
              ))}
            </Section>
          </div>
        )}
      </PageBody>

      <ApiKeyDialog
        provider={apiKeyProvider}
        onOpenChange={(open) => !open && setApiKeyProvider(null)}
      />
    </div>
  );
}
