"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plug } from "lucide-react";
import { useIntegrations } from "../hooks/use-integrations";
import { integrationsApi } from "../api";
import { ProviderCard } from "./provider-card";
import type { ProviderDef } from "./provider-card";
import { ApiKeySheet } from "./api-key-sheet";
import type { Integration } from "@/types";

// ── Provider logos ────────────────────────────────────────────────────────────

function OpenAILogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#10a37f] flex items-center justify-center text-white font-bold text-sm shrink-0">
      O
    </div>
  );
}
function AnthropicLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#c9602f] flex items-center justify-center text-white font-bold text-sm shrink-0">
      A
    </div>
  );
}
function GroqLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#f55036] flex items-center justify-center text-white font-bold text-sm shrink-0">
      G
    </div>
  );
}
function GeminiLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#4285F4] flex items-center justify-center text-white font-bold text-sm shrink-0">
      G
    </div>
  );
}
function MistralLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#ff7000] flex items-center justify-center text-white font-bold text-sm shrink-0">
      M
    </div>
  );
}
function DeepgramLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#101010] flex items-center justify-center text-white font-bold text-sm shrink-0">
      Dg
    </div>
  );
}
function CartesiaLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white font-bold text-sm shrink-0">
      Ca
    </div>
  );
}
function ElevenLabsLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm shrink-0">
      11
    </div>
  );
}
function SarvamLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#f97316] flex items-center justify-center text-white font-bold text-sm shrink-0">
      Sa
    </div>
  );
}
function GoogleLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
      {/* Google G */}
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    </div>
  );
}

// ── Section layout ────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const [apiKeyProvider, setApiKeyProvider] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const { data: integrations = [], isLoading } = useIntegrations();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth callback redirects
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "google") {
      toast.success("Google account connected successfully");
      router.replace("/integrations");
    } else if (error) {
      const messages: Record<string, string> = {
        google_oauth_denied: "Google authorization was cancelled",
        invalid_state: "Authorization expired — please try again",
        token_exchange_failed: "Failed to connect Google account — please try again",
      };
      toast.error(messages[error] ?? "Something went wrong");
      router.replace("/integrations");
    }
  }, [searchParams, router]);

  function byProvider(provider: string): Integration | undefined {
    return integrations.find((i) => i.provider === provider);
  }

  async function handleConnectGoogle() {
    setConnectingGoogle(true);
    try {
      const { url } = await integrationsApi.getOAuthConnectUrl("google");
      window.location.assign(url);
    } catch {
      toast.error("Failed to start Google authorization");
      setConnectingGoogle(false);
    }
  }

  const aiModelDefs: ProviderDef[] = [
    {
      provider: "openai",
      name: "OpenAI",
      description: "Power your agents with GPT-4o and GPT-4o-mini. Used by the LLM Response and Condition nodes.",
      logo: <OpenAILogo />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("openai"),
    },
    {
      provider: "anthropic",
      name: "Anthropic",
      description: "Use Claude 3.5 Sonnet and Haiku as your agent brain. Best-in-class reasoning and instruction following.",
      logo: <AnthropicLogo />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("anthropic"),
    },
    {
      provider: "groq",
      name: "Groq",
      description: "Run Llama 3, Gemma 2, and Mixtral at ultra-low latency. Great for fast routing and condition nodes.",
      logo: <GroqLogo />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("groq"),
    },
    {
      provider: "gemini",
      name: "Google Gemini",
      description: "Use Gemini 1.5 Pro and Flash for multimodal reasoning and long-context agent flows.",
      logo: <GeminiLogo />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("gemini"),
    },
    {
      provider: "mistral",
      name: "Mistral",
      description: "European open-weight models. Mistral Large and Small offer strong multilingual performance.",
      logo: <MistralLogo />,
      authType: "apikey",
      testable: true,
      onConnect: () => setApiKeyProvider("mistral"),
    },
  ];

  const voiceDefs: ProviderDef[] = [
    {
      provider: "deepgram",
      name: "Deepgram",
      description: "Speech-to-text for your agent's voice calls. Low-latency Nova models, optimised for phone and WebRTC audio.",
      logo: <DeepgramLogo />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("deepgram"),
    },
    {
      provider: "cartesia",
      name: "Cartesia",
      description: "Ultra-low-latency text-to-speech. Sonic models deliver sub-100 ms first audio, ideal for real-time voice agents.",
      logo: <CartesiaLogo />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("cartesia"),
    },
    {
      provider: "elevenlabs",
      name: "ElevenLabs",
      description: "High-quality text-to-speech with voice cloning. Best for lifelike, expressive agent voices.",
      logo: <ElevenLabsLogo />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("elevenlabs"),
    },
    {
      provider: "sarvam",
      name: "Sarvam AI",
      description: "STT and TTS for Indian languages — Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam.",
      logo: <SarvamLogo />,
      authType: "apikey",
      testable: false,
      onConnect: () => setApiKeyProvider("sarvam"),
    },
  ];

  const appDefs: ProviderDef[] = [
    {
      provider: "google",
      name: "Google",
      description: "Access Google Calendar and Gmail from your agent graphs. Create events, send emails, list upcoming meetings.",
      logo: <GoogleLogo />,
      authType: "oauth",
      onConnect: handleConnectGoogle,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-8 max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Plug className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Integrations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect your AI models, apps, and infrastructure. All credentials are encrypted and never exposed.
            </p>
          </div>
        </div>

        {/* AI Models */}
        <Section
          title="AI Models"
          description="Language models that power agent responses and reasoning."
        >
          {aiModelDefs.map((def) => (
            <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
          ))}
        </Section>

        {/* Voice */}
        <Section
          title="Voice"
          description="STT and TTS providers for your voice agents. Your keys are used for all calls made by your organisation."
        >
          {voiceDefs.map((def) => (
            <ProviderCard key={def.provider} def={def} integration={byProvider(def.provider)} />
          ))}
        </Section>

        {/* Apps & Tools */}
        <Section
          title="Apps & Tools"
          description="Connected apps your agents can interact with during conversations."
        >
          {appDefs.map((def) => (
            <ProviderCard
              key={def.provider}
              def={{
                ...def,
                onConnect: def.provider === "google" && connectingGoogle
                  ? () => {}
                  : def.onConnect,
              }}
              integration={byProvider(def.provider)}
            />
          ))}
        </Section>
      </div>

      {/* API key sheet — slides in from right */}
      <ApiKeySheet
        provider={apiKeyProvider}
        onOpenChange={(open) => !open && setApiKeyProvider(null)}
      />
    </>
  );
}
