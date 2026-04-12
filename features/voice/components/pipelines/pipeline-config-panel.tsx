"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhoneNumber, VoiceConfig } from "@/types";
import { useUpdatePhoneNumberConfig } from "../../hooks/use-phone-numbers";

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
  { value: "nova-3-phonecall", label: "Nova 3 Phone Call (recommended for PSTN)" },
  { value: "nova-2", label: "Nova 2" },
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
  { value: "aura-2-orion-en", label: "Orion (Male, US)" },
  { value: "aura-2-arcas-en", label: "Arcas (Male, US)" },
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
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Mandarin)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type FormState = Required<VoiceConfig>;

function toFormState(vc: VoiceConfig | null): FormState {
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

function toPayload(form: FormState): VoiceConfig {
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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  phoneNumber: PhoneNumber;
  onClose: () => void;
}

export function PipelineConfigPanel({ phoneNumber, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => toFormState(phoneNumber.voice_config));
  const updateConfig = useUpdatePhoneNumberConfig();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "stt_provider") next.stt_model = "";
      if (key === "tts_provider") { next.tts_model = ""; next.tts_voice_id = ""; }
      return next;
    });
  }

  function handleSave() {
    updateConfig.mutate(
      { id: phoneNumber.id, voice_config: toPayload(form) },
      { onSuccess: onClose },
    );
  }

  const ttsVoiceOptions = form.tts_provider === "deepgram" ? DEEPGRAM_TTS_VOICES : null;
  const ttsModelOptions =
    form.tts_provider === "cartesia" ? CARTESIA_MODELS :
    form.tts_provider === "elevenlabs" ? ELEVENLABS_MODELS :
    null;

  return (
    <div className="w-80 border-l border-border bg-card h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-semibold">Voice Settings</p>
          <p className="text-xs text-muted-foreground truncate">{phoneNumber.number}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Language */}
        <div>
          <label className="text-xs font-medium block mb-1">Language</label>
          <select
            value={form.language ?? ""}
            onChange={(e) => set("language", e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* STT */}
        <div>
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">STT</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Provider</label>
              <select
                value={form.stt_provider ?? ""}
                onChange={(e) => set("stt_provider", e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {STT_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {form.stt_provider === "deepgram" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Model</label>
                <select
                  value={form.stt_model ?? ""}
                  onChange={(e) => set("stt_model", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {DEEPGRAM_STT_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TTS */}
        <div>
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">TTS</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Provider</label>
              <select
                value={form.tts_provider ?? ""}
                onChange={(e) => set("tts_provider", e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {TTS_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {ttsVoiceOptions && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Voice</label>
                <select
                  value={form.tts_voice_id ?? ""}
                  onChange={(e) => set("tts_voice_id", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {ttsVoiceOptions.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            )}

            {!ttsVoiceOptions && form.tts_provider && form.tts_provider !== "azure" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Voice ID</label>
                <input
                  type="text"
                  value={form.tts_voice_id ?? ""}
                  onChange={(e) => set("tts_voice_id", e.target.value)}
                  placeholder="Provider voice ID"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                />
              </div>
            )}

            {ttsModelOptions && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Model</label>
                <select
                  value={form.tts_model ?? ""}
                  onChange={(e) => set("tts_model", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {ttsModelOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}

            {form.tts_provider && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Speed (0.5–2.0)</label>
                <input
                  type="number"
                  min={0.5} max={2.0} step={0.1}
                  value={form.tts_speed ?? ""}
                  onChange={(e) => set("tts_speed", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="1.0"
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="w-full h-8"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {updateConfig.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
