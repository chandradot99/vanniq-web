"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Agent, VoiceConfig } from "@/types";
import { useUpdateVoiceConfig } from "@/features/agents/hooks/use-agents";

// ── Provider / model options ──────────────────────────────────────────────────

const STT_PROVIDERS = [
  { value: "", label: "Auto-detect (org default)" },
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" },
];

const TTS_PROVIDERS = [
  { value: "", label: "Auto-detect (org default)" },
  { value: "cartesia", label: "Cartesia" },
  { value: "deepgram", label: "Deepgram Aura" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "azure", label: "Azure TTS" },
];

const DEEPGRAM_STT_MODELS = [
  { value: "", label: "Default (nova-3)" },
  { value: "nova-3", label: "Nova 3 (latest)" },
  { value: "nova-2", label: "Nova 2" },
  { value: "nova-2-general", label: "Nova 2 General" },
  { value: "nova-2-phonecall", label: "Nova 2 Phone Call" },
  { value: "nova-2-finance", label: "Nova 2 Finance" },
  { value: "enhanced", label: "Enhanced" },
  { value: "base", label: "Base" },
];

const DEEPGRAM_TTS_VOICES = [
  { value: "", label: "Default (aura-2-helena-en)" },
  { value: "aura-2-helena-en", label: "Helena (Female, US)" },
  { value: "aura-2-thalia-en", label: "Thalia (Female, US)" },
  { value: "aura-2-luna-en", label: "Luna (Female, US)" },
  { value: "aura-2-stella-en", label: "Stella (Female, US)" },
  { value: "aura-2-athena-en", label: "Athena (Female, UK)" },
  { value: "aura-2-hera-en", label: "Hera (Female, US)" },
  { value: "aura-2-orion-en", label: "Orion (Male, US)" },
  { value: "aura-2-arcas-en", label: "Arcas (Male, US)" },
  { value: "aura-2-perseus-en", label: "Perseus (Male, US)" },
  { value: "aura-2-angus-en", label: "Angus (Male, Ireland)" },
  { value: "aura-2-zeus-en", label: "Zeus (Male, US)" },
];

const CARTESIA_MODELS = [
  { value: "", label: "Default" },
  { value: "sonic-2", label: "Sonic 2 (latest)" },
  { value: "sonic-english", label: "Sonic English" },
  { value: "sonic-multilingual", label: "Sonic Multilingual" },
];

const ELEVENLABS_MODELS = [
  { value: "", label: "Default" },
  { value: "eleven_turbo_v2_5", label: "Turbo v2.5 (fastest)" },
  { value: "eleven_turbo_v2", label: "Turbo v2" },
  { value: "eleven_multilingual_v2", label: "Multilingual v2" },
  { value: "eleven_monolingual_v1", label: "Monolingual v1" },
];

const LANGUAGES = [
  { value: "", label: "Use agent language" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
  { value: "mr-IN", label: "Marathi" },
  { value: "bn-IN", label: "Bengali" },
  { value: "gu-IN", label: "Gujarati" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "pa-IN", label: "Punjabi" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-US", label: "Spanish (US)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Mandarin)" },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  agent: Agent;
}

function toFormState(vc: VoiceConfig | null): Required<VoiceConfig> {
  return {
    language: vc?.language ?? "",
    stt_provider: vc?.stt_provider ?? "",
    stt_model: vc?.stt_model ?? "",
    tts_provider: vc?.tts_provider ?? "",
    tts_voice_id: vc?.tts_voice_id ?? "",
    tts_model: vc?.tts_model ?? "",
    tts_speed: vc?.tts_speed ?? null,
  };
}

function toPayload(form: Required<VoiceConfig>): VoiceConfig {
  return {
    language: form.language || null,
    stt_provider: form.stt_provider || null,
    stt_model: form.stt_model || null,
    tts_provider: form.tts_provider || null,
    tts_voice_id: form.tts_voice_id || null,
    tts_model: form.tts_model || null,
    tts_speed: form.tts_speed ?? null,
  };
}

export function VoicePipelineForm({ agent }: Props) {
  const [form, setForm] = useState<Required<VoiceConfig>>(() => toFormState(agent.voice_config));
  const updateVoiceConfig = useUpdateVoiceConfig(agent.id);

  function set<K extends keyof Required<VoiceConfig>>(key: K, value: Required<VoiceConfig>[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset model/voice when provider changes
      if (key === "stt_provider") next.stt_model = "";
      if (key === "tts_provider") { next.tts_model = ""; next.tts_voice_id = ""; }
      return next;
    });
  }

  function handleSave() {
    updateVoiceConfig.mutate(toPayload(form));
  }

  const sttProvider = form.stt_provider;
  const ttsProvider = form.tts_provider;

  const ttsVoiceOptions = ttsProvider === "deepgram" ? DEEPGRAM_TTS_VOICES : null;
  const ttsModelOptions =
    ttsProvider === "cartesia" ? CARTESIA_MODELS :
    ttsProvider === "elevenlabs" ? ELEVENLABS_MODELS :
    null;

  return (
    <div className="space-y-6">
      {/* Language */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Language</h3>
        <div className="max-w-xs">
          <label className="text-xs text-muted-foreground block mb-1">Voice language override</label>
          <select
            value={form.language ?? ""}
            onChange={(e) => set("language", e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Overrides the agent&apos;s default language for voice calls only.
          </p>
        </div>
      </div>

      {/* STT */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Speech-to-Text (STT)</h3>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Provider</label>
            <select
              value={sttProvider}
              onChange={(e) => set("stt_provider", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {STT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {sttProvider === "deepgram" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Model</label>
              <select
                value={form.stt_model ?? ""}
                onChange={(e) => set("stt_model", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {DEEPGRAM_STT_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TTS */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Text-to-Speech (TTS)</h3>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Provider</label>
            <select
              value={ttsProvider}
              onChange={(e) => set("tts_provider", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {TTS_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {ttsVoiceOptions && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Voice</label>
              <select
                value={form.tts_voice_id ?? ""}
                onChange={(e) => set("tts_voice_id", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ttsVoiceOptions.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          )}

          {!ttsVoiceOptions && ttsProvider && ttsProvider !== "azure" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Voice ID</label>
              <input
                type="text"
                value={form.tts_voice_id ?? ""}
                onChange={(e) => set("tts_voice_id", e.target.value)}
                placeholder="Provider voice ID"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}

          {ttsModelOptions && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Model</label>
              <select
                value={form.tts_model ?? ""}
                onChange={(e) => set("tts_model", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ttsModelOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {ttsProvider && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Speed <span className="text-muted-foreground/60">(0.5 – 2.0, default 1.0)</span>
              </label>
              <input
                type="number"
                min={0.5}
                max={2.0}
                step={0.1}
                value={form.tts_speed ?? ""}
                onChange={(e) => set("tts_speed", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="1.0"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateVoiceConfig.isPending}
          className="h-8"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {updateVoiceConfig.isPending ? "Saving…" : "Save Voice Settings"}
        </Button>
      </div>
    </div>
  );
}
