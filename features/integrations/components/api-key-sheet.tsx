"use client";

import { useState } from "react";
import { Eye, EyeOff, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateIntegration } from "../hooks/use-integrations";

// ── Provider catalog ──────────────────────────────────────────────────────────

interface ModelTag {
  name: string;
  badge: string;
  badgeColor: string;
}

interface ProviderConfig {
  provider: string;
  name: string;
  color: string;
  initial: string;
  tagline: string;
  keyPlaceholder: string;
  docsUrl: string;
  docsLabel: string;
  models: ModelTag[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    provider: "openai",
    name: "OpenAI",
    color: "#10a37f",
    initial: "O",
    tagline: "The most widely used LLM API. Power your agents with GPT-4o for best-in-class reasoning.",
    keyPlaceholder: "sk-proj-…",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "Get API key from OpenAI Platform",
    models: [
      { name: "GPT-4o",      badge: "Smart",     badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "GPT-4o Mini", badge: "Fast",       badgeColor: "text-emerald-600 bg-emerald-500/8" },
      { name: "o1 Mini",     badge: "Reasoning",  badgeColor: "text-blue-500 bg-blue-500/8" },
    ],
  },
  anthropic: {
    provider: "anthropic",
    name: "Anthropic",
    color: "#c9602f",
    initial: "A",
    tagline: "Claude models are known for thoughtful, nuanced responses and strong instruction-following.",
    keyPlaceholder: "sk-ant-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "Get API key from Anthropic Console",
    models: [
      { name: "Claude Sonnet 4.6", badge: "Latest",       badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Claude Opus 4.6",   badge: "Most capable", badgeColor: "text-orange-500 bg-orange-500/8" },
      { name: "Claude Haiku 4.5",  badge: "Fast",         badgeColor: "text-emerald-600 bg-emerald-500/8" },
    ],
  },
  groq: {
    provider: "groq",
    name: "Groq",
    color: "#f55036",
    initial: "G",
    tagline: "Groq's LPU hardware delivers the fastest inference in the industry — ideal for real-time agents.",
    keyPlaceholder: "gsk_…",
    docsUrl: "https://console.groq.com/keys",
    docsLabel: "Get API key from Groq Console",
    models: [
      { name: "Llama 3.1 70B", badge: "Smart",  badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Llama 3.1 8B",  badge: "Fastest", badgeColor: "text-emerald-600 bg-emerald-500/8" },
      { name: "Gemma 2 9B",    badge: "Google",  badgeColor: "text-blue-500 bg-blue-500/8" },
    ],
  },
  gemini: {
    provider: "gemini",
    name: "Google Gemini",
    color: "#4285F4",
    initial: "G",
    tagline: "Google's flagship multimodal models. Gemini 1.5 Pro handles long contexts up to 1M tokens.",
    keyPlaceholder: "AIza…",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsLabel: "Get API key from Google AI Studio",
    models: [
      { name: "Gemini 2.0 Flash", badge: "Latest", badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Gemini 1.5 Pro",   badge: "Smart",  badgeColor: "text-blue-500 bg-blue-500/8" },
      { name: "Gemini 1.5 Flash", badge: "Fast",   badgeColor: "text-emerald-600 bg-emerald-500/8" },
    ],
  },
  mistral: {
    provider: "mistral",
    name: "Mistral",
    color: "#ff7000",
    initial: "M",
    tagline: "European open-weight models with strong multilingual support. Great for GDPR-conscious deployments.",
    keyPlaceholder: "…",
    docsUrl: "https://console.mistral.ai/api-keys",
    docsLabel: "Get API key from Mistral Console",
    models: [
      { name: "Mistral Large", badge: "Smart", badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Mistral Small", badge: "Fast",  badgeColor: "text-emerald-600 bg-emerald-500/8" },
      { name: "Mixtral 8x22B", badge: "MoE",   badgeColor: "text-amber-600 bg-amber-500/8" },
    ],
  },
  deepgram: {
    provider: "deepgram",
    name: "Deepgram",
    color: "#101010",
    initial: "D",
    tagline: "Real-time speech-to-text and text-to-speech. Nova 3 STT + Aura 2 TTS — one API key covers both.",
    keyPlaceholder: "Token …",
    docsUrl: "https://console.deepgram.com/",
    docsLabel: "Get API key from Deepgram Console",
    models: [
      { name: "Nova 3 STT",       badge: "STT",     badgeColor: "text-blue-500 bg-blue-500/8" },
      { name: "Aura 2 TTS",       badge: "TTS",     badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Nova 2 Phone Call", badge: "Voice",  badgeColor: "text-emerald-600 bg-emerald-500/8" },
    ],
  },
  cartesia: {
    provider: "cartesia",
    name: "Cartesia",
    color: "#6c47ff",
    initial: "C",
    tagline: "Ultra-low latency TTS built for voice agents. Sonic 2 delivers near-instant, natural-sounding speech.",
    keyPlaceholder: "sk_car_…",
    docsUrl: "https://play.cartesia.ai/keys",
    docsLabel: "Get API key from Cartesia Dashboard",
    models: [
      { name: "Sonic 2",            badge: "Latest",  badgeColor: "text-violet-500 bg-violet-500/8" },
      { name: "Sonic English",      badge: "Fast",    badgeColor: "text-emerald-600 bg-emerald-500/8" },
      { name: "Sonic Multilingual", badge: "Global",  badgeColor: "text-blue-500 bg-blue-500/8" },
    ],
  },
  elevenlabs: {
    provider: "elevenlabs",
    name: "ElevenLabs",
    color: "#f5a623",
    initial: "E",
    tagline: "Industry-leading voice cloning and TTS. Turbo v2.5 optimised for real-time voice agents.",
    keyPlaceholder: "sk_…",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
    docsLabel: "Get API key from ElevenLabs",
    models: [
      { name: "Turbo v2.5",        badge: "Fastest", badgeColor: "text-emerald-600 bg-emerald-500/8" },
      { name: "Multilingual v2",   badge: "Global",  badgeColor: "text-blue-500 bg-blue-500/8" },
      { name: "Turbo v2",          badge: "Fast",    badgeColor: "text-violet-500 bg-violet-500/8" },
    ],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface ApiKeySheetProps {
  provider: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeySheet({ provider, onOpenChange }: ApiKeySheetProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const config = provider ? PROVIDER_CONFIGS[provider] : null;

  const createMutation = useCreateIntegration({
    onSuccess: () => {
      onOpenChange(false);
      setApiKey("");
      setShowKey(false);
    },
  });

  function handleSave() {
    if (!provider || !apiKey.trim()) return;
    createMutation.mutate({
      provider,
      credentials: { api_key: apiKey.trim() },
    });
  }

  function handleClose() {
    onOpenChange(false);
    setApiKey("");
    setShowKey(false);
  }

  return (
    <Sheet open={!!provider} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {config ? (
          <>
            {/* Header with provider color accent */}
            <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 space-y-0">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  {config.initial}
                </div>
                <SheetTitle className="text-base font-semibold">{config.name}</SheetTitle>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{config.tagline}</p>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* API Key input */}
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder={config.keyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="pr-10 font-mono text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <a
                  href={config.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {config.docsLabel}
                </a>
              </div>

              {/* Available models */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available models</p>
                </div>
                <div className="space-y-1.5">
                  {config.models.map((m) => (
                    <div key={m.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40 border border-border/40">
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your key is encrypted with Fernet before storage and never appears in logs or API responses.
                </p>
              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="px-6 py-4 border-t border-border/60 flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </SheetFooter>
          </>
        ) : (
          // Unknown provider — shouldn't happen but safe fallback
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Provider not supported.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
