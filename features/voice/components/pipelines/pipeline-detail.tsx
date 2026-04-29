"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PhoneIcon,
  Bot,
  Settings2,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Save,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Agent, VoiceConfig } from "@/types";
import {
  usePhoneNumber,
  useRemovePhoneNumber,
  useReassignPhoneNumber,
  useUpdatePhoneNumberConfig,
  useUpdatePhoneNumberName,
} from "@/features/voice/hooks/use-phone-numbers";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { toast } from "sonner";
import {
  useSTTProviders,
  useSTTModels,
  useTTSProviders,
  useTTSModels,
  useTTSVoices,
} from "@/features/voice/hooks/use-voice-providers";
import { voicePreviewApi } from "@/features/voice/api";
import {
  isLanguageCompatible,
  LANGUAGE_RECOMMENDATIONS,
} from "@/features/voice/utils/language";
import { ModelSelect } from "@/features/voice/components/pipelines/model-select";
import { SimpleSelect } from "@/features/voice/components/pipelines/simple-select";
import type { SimpleSelectOption } from "@/features/voice/components/pipelines/simple-select";

// ── Static data ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "", label: "Use agent language" },
  { value: "en-US", label: "English" },
  { value: "hi-IN", label: "Hindi" },
  { value: "es-US", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Mandarin)" },
];

const CARTESIA_EMOTIONS = [
  { value: "", label: "None (neutral)" },
  { value: "positivity:high", label: "Positive — high" },
  { value: "positivity:medium", label: "Positive — medium" },
  { value: "positivity:low", label: "Positive — low" },
  { value: "curiosity:high", label: "Curious — high" },
  { value: "curiosity:medium", label: "Curious — medium" },
  { value: "surprise:high", label: "Surprised — high" },
  { value: "surprise:medium", label: "Surprised — medium" },
  { value: "sadness:high", label: "Sad — high" },
  { value: "sadness:medium", label: "Sad — medium" },
  { value: "anger:medium", label: "Angry — medium" },
  { value: "negativity:medium", label: "Negative — medium" },
];

// Returns true for ISO 639-1 ("en", "fr") and BCP-47 ("en-US", "zh-CN") codes.
// ElevenLabs uses freeform labels ("english", "american english") — those return false
// and we skip language filtering for them so valid multilingual voices aren't hidden.
function looksLikeIsoCode(lang: string): boolean {
  return /^[a-z]{2}(-[a-zA-Z]{2,4})?$/i.test(lang.trim());
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function initForm(vc: VoiceConfig | null): Required<VoiceConfig> {
  return {
    language: vc?.language ?? "",
    stt_provider: vc?.stt_provider ?? "",
    stt_model: vc?.stt_model ?? "",
    tts_provider: vc?.tts_provider ?? "",
    tts_voice_id: vc?.tts_voice_id ?? "",
    tts_model: vc?.tts_model ?? "",
    tts_speed: vc?.tts_speed ?? null,
    tts_emotion: vc?.tts_emotion ?? "",
    tts_stability: vc?.tts_stability ?? null,
    tts_style: vc?.tts_style ?? null,
    tts_instructions: vc?.tts_instructions ?? "",
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
    tts_emotion: form.tts_emotion || null,
    tts_stability: form.tts_stability ?? null,
    tts_style: form.tts_style ?? null,
    tts_instructions: form.tts_instructions || null,
  };
}


// ── Small UI atoms ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="text-sm font-medium">{children}</label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function BatchWarning() {
  return (
    <p className="flex items-center gap-1 text-xs text-amber-600 mt-1.5">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      Batch only — cannot be used for live voice calls.
    </p>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "voice" | "danger";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <PhoneIcon className="h-3.5 w-3.5" /> },
  { id: "voice", label: "Voice Settings", icon: <Settings2 className="h-3.5 w-3.5" /> },
  { id: "danger", label: "Danger Zone", icon: <Trash2 className="h-3.5 w-3.5" /> },
];

// ── TTS Preview ───────────────────────────────────────────────────────────────

const PREVIEW_TEXTS: Record<string, string> = {
  "en": "Hello! I'm your AI assistant. How can I help you today?",
  "hi": "नमस्ते! मैं आपका AI सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
  "es": "¡Hola! Soy tu asistente de inteligencia artificial. ¿Cómo puedo ayudarte hoy?",
  "fr": "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
  "de": "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
  "pt": "Olá! Sou seu assistente de IA. Como posso ajudá-lo hoje?",
  "ja": "こんにちは！私はAIアシスタントです。今日はどのようにお手伝いできますか？",
  "zh": "你好！我是您的AI助手。今天我能为您做些什么？",
};

function getPreviewText(lang: string): string {
  // Match on BCP-47 prefix (e.g. "hi-IN" → "hi", "en-US" → "en")
  const prefix = lang.split("-")[0].toLowerCase();
  return PREVIEW_TEXTS[prefix] ?? PREVIEW_TEXTS["en"];
}

function TTSPreviewSection({ form, activeLang }: { form: Required<VoiceConfig>; activeLang: string }) {
  const router = useRouter();
  const [previewText, setPreviewText] = useState(() => getPreviewText(activeLang));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  function showPreviewError(raw: string) {
    if (raw.includes("No API key") || raw.includes("integration")) {
      toast.error("API key not configured", {
        description: `No ${form.tts_provider} key found. Add one in Integrations to use preview.`,
        duration: 8000,
        action: {
          label: "Open Integrations",
          onClick: () => router.push("/integrations"),
        },
      });
    } else if (raw.includes("not supported") || raw.includes("501")) {
      toast.info("Preview not available", {
        description: "This provider doesn't support audio preview.",
        duration: 4000,
      });
    } else if (raw.includes("Playback")) {
      toast.error("Playback failed", {
        description: "Audio was synthesised but your browser couldn't play it.",
        duration: 5000,
      });
    } else {
      toast.error("Preview failed", {
        description: raw,
        duration: 5000,
      });
    }
  }

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Reset preview text when language changes
  useEffect(() => {
    stopAudio();
    setPreviewText(getPreviewText(activeLang));
  }, [activeLang, stopAudio]);

  async function handlePlay() {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    try {
      const url = await voicePreviewApi.synthesize(
        form.tts_provider!,
        previewText.trim() || getPreviewText(activeLang),
        form,
      );
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.play().catch(() => { stopAudio(); showPreviewError("Playback failed."); });
      audio.addEventListener("ended", stopAudio);
      audio.addEventListener("error", () => { stopAudio(); showPreviewError("Playback failed."); });
    } catch (err) {
      showPreviewError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section>
      <SectionLabel>Voice Preview</SectionLabel>
      <div className="max-w-2xl rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Preview the selected voice using all current settings — provider, model, voice, speed, and expressiveness.
        </p>

        <div>
          <FieldLabel>Sample text</FieldLabel>
          <textarea
            rows={2}
            value={previewText}
            onChange={(e) => { setPreviewText(e.target.value); stopAudio(); }}
            placeholder={getPreviewText(activeLang)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            disabled={isLoading || !previewText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {isLoading ? "Synthesising…" : isPlaying ? "Stop" : "Play Preview"}
          </button>

          {isPlaying && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Playing…
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Voice Settings tab ────────────────────────────────────────────────────────

function VoiceSettingsTab({
  numberId,
  voiceConfig,
  agentLanguage,
}: {
  numberId: string;
  voiceConfig: VoiceConfig | null;
  agentLanguage: string;
}) {
  const [form, setForm] = useState<Required<VoiceConfig>>(() => initForm(voiceConfig));
  const updateConfig = useUpdatePhoneNumberConfig();

  const { data: sttProviders = [] } = useSTTProviders();
  const { data: ttsProviders = [] } = useTTSProviders();
  const { data: rawSttModels = [] } = useSTTModels(form.stt_provider || null);
  const { data: rawTtsModels = [] } = useTTSModels(form.tts_provider || null);

  const ttsProviderMeta = ttsProviders.find((p) => p.provider_id === form.tts_provider);
  const supportsVoices = ttsProviderMeta?.supports_voices ?? false;
  const { data: ttsVoices = [] } = useTTSVoices(form.tts_provider || null, supportsVoices);

  const activeLang = form.language || agentLanguage || "";
  const sttModels = rawSttModels.filter((m) => isLanguageCompatible(m.languages, activeLang));
  const ttsModels = rawTtsModels.filter((m) => isLanguageCompatible(m.languages, activeLang));

  const selectedSttModel = rawSttModels.find((m) => m.id === form.stt_model);
  const selectedTtsModel = rawTtsModels.find((m) => m.id === form.tts_model);
  const sttNonStreaming = !!selectedSttModel && !selectedSttModel.streaming;
  const ttsNonStreaming = !!selectedTtsModel && !selectedTtsModel.streaming;

  const recommendation = LANGUAGE_RECOMMENDATIONS[activeLang] ?? null;
  const showSuggestion = recommendation !== null && !form.stt_provider && !form.tts_provider;

  const ttsVoiceIsAgentLevel = form.tts_provider === "sarvam";

  function set<K extends keyof Required<VoiceConfig>>(key: K, value: Required<VoiceConfig>[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "stt_provider") next.stt_model = "";
      if (key === "tts_provider") { next.tts_model = ""; next.tts_voice_id = ""; }
      if (key === "language") {
        const newLang = value as string;
        if (newLang) {
          // Clear STT provider if it doesn't support the new language
          const sttProviderMeta = sttProviders.find((p) => p.provider_id === prev.stt_provider);
          if (sttProviderMeta && !isLanguageCompatible(sttProviderMeta.languages, newLang)) {
            next.stt_provider = "";
            next.stt_model = "";
          } else if (prev.stt_model) {
            // Provider is compatible — but clear the model if it isn't
            const currentSttModel = rawSttModels.find((m) => m.id === prev.stt_model);
            if (currentSttModel && !isLanguageCompatible(currentSttModel.languages, newLang)) {
              next.stt_model = "";
            }
          }

          // Clear TTS provider if it doesn't support the new language
          const ttsProviderMeta = ttsProviders.find((p) => p.provider_id === prev.tts_provider);
          if (ttsProviderMeta && !isLanguageCompatible(ttsProviderMeta.languages, newLang)) {
            next.tts_provider = "";
            next.tts_model = "";
            next.tts_voice_id = "";
          } else {
            // Provider is compatible — clear model if it isn't
            if (prev.tts_model) {
              const currentTtsModel = rawTtsModels.find((m) => m.id === prev.tts_model);
              if (currentTtsModel && !isLanguageCompatible(currentTtsModel.languages, newLang)) {
                next.tts_model = "";
              }
            }
            // Clear voice if it has a reliable language tag that no longer matches
            if (prev.tts_voice_id) {
              const currentVoice = ttsVoices.find((v) => v.id === prev.tts_voice_id);
              if (currentVoice?.language && looksLikeIsoCode(currentVoice.language) &&
                  !isLanguageCompatible([currentVoice.language], newLang)) {
                next.tts_voice_id = "";
              }
            }
          }
        }
      }
      return next;
    });
  }

  function applyRecommendation() {
    if (!recommendation) return;
    setForm((prev) => ({
      ...prev,
      stt_provider: recommendation.stt_provider,
      stt_model: recommendation.stt_model,
      tts_provider: recommendation.tts_provider,
      tts_model: recommendation.tts_model,
      tts_voice_id: recommendation.tts_voice_id ?? "",
    }));
  }

  function handleSave() {
    updateConfig.mutate({ id: numberId, voice_config: toPayload(form) });
  }

  const input = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  const activeLangForFilter = form.language || "";
  const languageOptions: SimpleSelectOption[] = LANGUAGES.map((l) => ({ value: l.value, label: l.label }));

  // Filter voices by language where the voice carries a reliable ISO language tag.
  // Voices with no language or freeform labels (ElevenLabs) are always included —
  // most ElevenLabs voices work across all languages via multilingual models.
  const filteredVoices = activeLangForFilter
    ? ttsVoices.filter((v) => {
        if (!v.language || !looksLikeIsoCode(v.language)) return true;
        return isLanguageCompatible([v.language], activeLangForFilter);
      })
    : ttsVoices;

  const compatibleSttProviders = activeLangForFilter
    ? sttProviders.filter((p) => isLanguageCompatible(p.languages, activeLangForFilter))
    : sttProviders;
  const compatibleTtsProviders = activeLangForFilter
    ? ttsProviders.filter((p) => isLanguageCompatible(p.languages, activeLangForFilter))
    : ttsProviders;

  const sttProviderOptions: SimpleSelectOption[] = [
    { value: "", label: "Auto-detect (org default)" },
    ...compatibleSttProviders.map((p) => ({ value: p.provider_id, label: p.display_name })),
  ];
  const ttsProviderOptions: SimpleSelectOption[] = [
    { value: "", label: "Auto-detect (org default)" },
    ...compatibleTtsProviders.map((p) => ({ value: p.provider_id, label: p.display_name })),
  ];
  const voiceOptions: SimpleSelectOption[] = [
    { value: "", label: "Default" },
    ...filteredVoices.map((v) => ({
      value: v.id,
      label: v.name,
      sublabel: [v.gender, v.language, v.category].filter(Boolean).join(" · "),
    })),
  ];
  const emotionOptions: SimpleSelectOption[] = CARTESIA_EMOTIONS.map((e) => ({ value: e.value, label: e.label }));

  return (
    <div className="space-y-10">
      {/* Language */}
      <section>
        <SectionLabel>Language</SectionLabel>
        <div className="max-w-xs">
          <FieldLabel hint="Overrides the agent's default language for calls on this number only.">
            Voice Language
          </FieldLabel>
          <SimpleSelect
            options={languageOptions}
            value={form.language ?? ""}
            onChange={(v) => set("language", v)}
          />
        </div>
      </section>

      {/* Smart suggestion */}
      {showSuggestion && activeLang && (
        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 max-w-2xl">
          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 mb-0.5">Recommended for {activeLang}</p>
            <p className="text-sm text-blue-700">{recommendation!.rationale}</p>
          </div>
          <button
            onClick={applyRecommendation}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 shrink-0 flex items-center gap-1"
          >
            Apply <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* STT */}
      <section>
        <SectionLabel>Speech-to-Text (STT)</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl sm:items-end">
          <div>
            <FieldLabel hint="The provider that transcribes caller speech.">Provider</FieldLabel>
            <SimpleSelect
              options={sttProviderOptions}
              value={form.stt_provider ?? ""}
              onChange={(v) => set("stt_provider", v)}
            />
          </div>

          {form.stt_provider && sttModels.length > 0 && (
            <div>
              <FieldLabel hint="Filtered to models that support the selected language.">Model</FieldLabel>
              <ModelSelect
                models={sttModels}
                value={form.stt_model ?? ""}
                onChange={(id) => set("stt_model", id)}
              />
              {sttNonStreaming && <BatchWarning />}
            </div>
          )}
        </div>
      </section>

      {/* TTS */}
      <section>
        <SectionLabel>Text-to-Speech (TTS)</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl sm:items-end">
          <div>
            <FieldLabel hint="The provider that synthesises the agent's voice.">Provider</FieldLabel>
            <SimpleSelect
              options={ttsProviderOptions}
              value={form.tts_provider ?? ""}
              onChange={(v) => set("tts_provider", v)}
            />
          </div>

          {/* Voice dropdown */}
          {supportsVoices && !ttsVoiceIsAgentLevel && (
            <div>
              <FieldLabel>Voice</FieldLabel>
              <SimpleSelect
                options={voiceOptions}
                value={form.tts_voice_id ?? ""}
                onChange={(v) => set("tts_voice_id", v)}
                placeholder="Default"
              />
            </div>
          )}

          {/* Free-text voice ID */}
          {form.tts_provider && !supportsVoices && !ttsVoiceIsAgentLevel && (
            <div>
              <FieldLabel hint="Provider-specific voice identifier.">Voice ID</FieldLabel>
              <input
                type="text"
                value={form.tts_voice_id ?? ""}
                onChange={(e) => set("tts_voice_id", e.target.value)}
                placeholder="e.g. a0e99841-438c-4a64-b679-ae501e7d6091"
                className={input}
              />
            </div>
          )}

          {form.tts_provider && ttsModels.length > 0 && (
            <div>
              <FieldLabel hint="Filtered to models that support the selected language.">Model</FieldLabel>
              <ModelSelect
                models={ttsModels}
                value={form.tts_model ?? ""}
                onChange={(id) => set("tts_model", id)}
              />
              {ttsNonStreaming && <BatchWarning />}
            </div>
          )}

          {form.tts_provider && (
            <div>
              <FieldLabel hint="1.0 is the provider default. Range: 0.5–2.0.">Speed</FieldLabel>
              <input
                type="number"
                min={0.5} max={2.0} step={0.1}
                value={form.tts_speed ?? ""}
                onChange={(e) => set("tts_speed", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="1.0"
                className={input}
              />
            </div>
          )}

          {ttsVoiceIsAgentLevel && (
            <p className="text-sm text-muted-foreground col-span-2 -mt-2">
              Sarvam voice is selected automatically based on the call language.
            </p>
          )}
        </div>
      </section>

      {/* Emotion / Expressiveness */}
      {form.tts_provider && (form.tts_provider === "cartesia" || form.tts_provider === "elevenlabs" || form.tts_provider === "openai") && (
        <section>
          <SectionLabel>Emotion &amp; Expressiveness</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl sm:items-end">

            {form.tts_provider === "cartesia" && (
              <div>
                <FieldLabel hint="Infuses the synthesis with a specific emotional tone.">Emotion</FieldLabel>
                <SimpleSelect
                  options={emotionOptions}
                  value={form.tts_emotion ?? ""}
                  onChange={(v) => set("tts_emotion", v)}
                />
              </div>
            )}

            {form.tts_provider === "elevenlabs" && (
              <>
                <div>
                  <FieldLabel hint="Higher = more consistent delivery. Lower = more natural variance. Default: 0.5.">
                    Stability (0 – 1)
                  </FieldLabel>
                  <input
                    type="number" min={0} max={1} step={0.05}
                    value={form.tts_stability ?? ""}
                    onChange={(e) => set("tts_stability", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.5"
                    className={input}
                  />
                </div>
                <div>
                  <FieldLabel hint="Higher = more expressive / style-exaggerated. Default: 0.0.">
                    Style (0 – 1)
                  </FieldLabel>
                  <input
                    type="number" min={0} max={1} step={0.05}
                    value={form.tts_style ?? ""}
                    onChange={(e) => set("tts_style", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.0"
                    className={input}
                  />
                </div>
              </>
            )}

            {form.tts_provider === "openai" && (
              <div className="sm:col-span-2">
                <FieldLabel hint="Free-form instruction for gpt-4o-mini-tts. Controls tone and delivery style.">
                  Voice Instructions
                </FieldLabel>
                <textarea
                  rows={3}
                  value={form.tts_instructions ?? ""}
                  onChange={(e) => set("tts_instructions", e.target.value)}
                  placeholder="e.g. Speak in a warm, friendly tone with gentle enthusiasm."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* TTS Preview */}
      {form.tts_provider && (
        <TTSPreviewSection form={form} activeLang={activeLang} />
      )}

      {/* Save */}
      <div className="pt-2">
        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateConfig.isPending ? "Saving…" : "Save Voice Settings"}
        </Button>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  numberId,
  number,
  friendlyName,
  provider,
  agentId,
  agentName,
  agentLanguage,
  voiceConfig,
  agents,
}: {
  numberId: string;
  number: string;
  friendlyName: string | null;
  provider: string;
  agentId: string;
  agentName: string | undefined;
  agentLanguage: string;
  voiceConfig: VoiceConfig | null;
  agents: Agent[];
}) {
  const [reassignId, setReassignId] = useState(agentId);
  const [nameValue, setNameValue] = useState(friendlyName ?? "");
  const reassign = useReassignPhoneNumber();
  const updateName = useUpdatePhoneNumberName();

  const vc = voiceConfig;
  const agentOptions: SimpleSelectOption[] = agents.map((a) => ({ value: a.id, label: a.name }));
  const inputClass = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  function handleReassign() {
    if (reassignId === agentId) return;
    reassign.mutate({ id: numberId, agent_id: reassignId });
  }

  function handleRenameSave() {
    const trimmed = nameValue.trim();
    if (trimmed === (friendlyName ?? "")) return;
    updateName.mutate({ id: numberId, friendly_name: trimmed || null });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Pipeline name */}
      <section>
        <SectionLabel>Pipeline Name</SectionLabel>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Give this pipeline a memorable name. Names must be unique within your org.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
              placeholder="e.g. Support Line, Sales US"
              className={inputClass}
            />
            <Button
              onClick={handleRenameSave}
              disabled={
                nameValue.trim() === (friendlyName ?? "") ||
                updateName.isPending
              }
              variant="outline"
            >
              {updateName.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </section>

      {/* Number details */}
      <section>
        <SectionLabel>Phone Number</SectionLabel>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <Row label="Number" value={<span className="font-mono font-semibold">{number}</span>} />
          <Row label="Provider" value={<span className="capitalize">{provider}</span>} />
          <Row
            label="Language"
            value={vc?.language ?? <span className="text-muted-foreground italic">Agent default ({agentLanguage})</span>}
          />
        </div>
      </section>

      {/* Voice config summary */}
      <section>
        <SectionLabel>Current Voice Config</SectionLabel>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <Row
            label="STT"
            value={
              vc?.stt_provider ? (
                <span className="capitalize">
                  {vc.stt_provider}{vc.stt_model ? ` · ${vc.stt_model}` : ""}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Auto (org default)</span>
              )
            }
          />
          <Row
            label="TTS"
            value={
              vc?.tts_provider ? (
                <span className="capitalize">
                  {vc.tts_provider}
                  {vc.tts_model ? ` · ${vc.tts_model}` : ""}
                  {vc.tts_voice_id ? ` / ${vc.tts_voice_id}` : ""}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Auto (org default)</span>
              )
            }
          />
          {vc?.tts_speed != null && (
            <Row label="Speed" value={`${vc.tts_speed}×`} />
          )}
          {vc?.tts_emotion && (
            <Row label="Emotion" value={vc.tts_emotion} />
          )}
          {(vc?.tts_stability != null || vc?.tts_style != null) && (
            <Row
              label="Expressiveness"
              value={`Stability ${vc?.tts_stability ?? "–"} / Style ${vc?.tts_style ?? "–"}`}
            />
          )}
          {vc?.tts_instructions && (
            <Row label="Instructions" value={<span className="italic">&ldquo;{vc.tts_instructions}&rdquo;</span>} />
          )}
        </div>
      </section>

      {/* Reassign agent */}
      <section>
        <SectionLabel>Agent</SectionLabel>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Reassign this number to a different agent. The current agent is{" "}
            <Link href={`/agents/${agentId}`} className="font-medium text-foreground underline underline-offset-2">
              {agentName ?? agentId}
            </Link>
            .
          </p>
          <div className="flex gap-3">
            <SimpleSelect
              options={agentOptions}
              value={reassignId}
              onChange={setReassignId}
            />
            <Button
              onClick={handleReassign}
              disabled={reassignId === agentId || reassign.isPending}
              variant="outline"
            >
              {reassign.isPending ? "Saving…" : "Reassign"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

// ── Danger zone tab ───────────────────────────────────────────────────────────

function DangerZoneTab({ numberId, number }: { numberId: string; number: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remove = useRemovePhoneNumber();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-sm font-semibold text-destructive mb-1">Remove Pipeline</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently disconnect <strong>{number}</strong> from this agent. The number remains in your
          telephony account — it just won&apos;t route calls to Naaviq anymore.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Remove Pipeline
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove pipeline"
        description={`Remove ${number}? The number will be disconnected from its agent.`}
        onConfirm={() =>
          remove.mutate(numberId, {
            onSuccess: () => router.push("/voice"),
          })
        }
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border bg-card" />
      <div className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full">
        <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PipelineDetail({ numberId }: { numberId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("voice");
  const { data: phoneNumber, isLoading, isError } = usePhoneNumber(numberId);
  const { data: agents = [] } = useAgents();

  if (isLoading) return <DetailSkeleton />;
  if (isError || !phoneNumber) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <PhoneIcon className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Pipeline not found.</p>
        <Link href="/voice" className="text-sm text-primary hover:underline">
          ← Back to pipelines
        </Link>
      </div>
    );
  }

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));
  const agent = agents.find((a) => a.id === phoneNumber.agent_id);
  const agentLanguage = agent?.language ?? "en-US";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center gap-4">
          <Link
            href="/voice"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Pipelines
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono text-sm font-semibold">{phoneNumber.number}</span>
          {phoneNumber.friendly_name && (
            <Badge variant="secondary" className="text-xs">{phoneNumber.friendly_name}</Badge>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            <span>{agentMap[phoneNumber.agent_id] ?? "Unknown agent"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          {activeTab === "overview" && (
            <OverviewTab
              numberId={numberId}
              number={phoneNumber.number}
              friendlyName={phoneNumber.friendly_name}
              provider={phoneNumber.provider}
              agentId={phoneNumber.agent_id}
              agentName={agentMap[phoneNumber.agent_id]}
              agentLanguage={agentLanguage}
              voiceConfig={phoneNumber.voice_config}
              agents={agents}
            />
          )}
          {activeTab === "voice" && (
            <VoiceSettingsTab
              numberId={numberId}
              voiceConfig={phoneNumber.voice_config}
              agentLanguage={agentLanguage}
            />
          )}
          {activeTab === "danger" && (
            <DangerZoneTab numberId={numberId} number={phoneNumber.number} />
          )}
        </div>
      </main>
    </div>
  );
}
