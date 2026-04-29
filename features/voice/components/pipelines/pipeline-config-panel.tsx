"use client";

import { useState } from "react";
import { X, Save, Zap, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhoneNumber, VoiceConfig, VoiceModelInfo } from "@/types";
import { useUpdatePhoneNumberConfig } from "../../hooks/use-phone-numbers";
import {
  useSTTProviders,
  useSTTModels,
  useTTSProviders,
  useTTSModels,
  useTTSVoices,
} from "../../hooks/use-voice-providers";
import {
  isLanguageCompatible,
  LANGUAGE_RECOMMENDATIONS,
} from "../../utils/language";

// ── Static options ────────────────────────────────────────────────────────────

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

// Cartesia emotion presets
const CARTESIA_EMOTIONS = [
  { value: "", label: "None (neutral)" },
  { value: "positivity:high",   label: "Positive — high" },
  { value: "positivity:medium", label: "Positive — medium" },
  { value: "positivity:low",    label: "Positive — low" },
  { value: "curiosity:high",    label: "Curious — high" },
  { value: "curiosity:medium",  label: "Curious — medium" },
  { value: "surprise:high",     label: "Surprised — high" },
  { value: "surprise:medium",   label: "Surprised — medium" },
  { value: "sadness:high",      label: "Sad — high" },
  { value: "sadness:medium",    label: "Sad — medium" },
  { value: "anger:medium",      label: "Angry — medium" },
  { value: "negativity:medium", label: "Negative — medium" },
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
    tts_emotion: vc?.tts_emotion ?? "",
    tts_stability: vc?.tts_stability ?? null,
    tts_style: vc?.tts_style ?? null,
    tts_instructions: vc?.tts_instructions ?? "",
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
    tts_emotion: form.tts_emotion || null,
    tts_stability: form.tts_stability ?? null,
    tts_style: form.tts_style ?? null,
    tts_instructions: form.tts_instructions || null,
  };
}

function modelLabel(m: VoiceModelInfo) {
  return m.is_default ? `${m.display_name} (default)` : m.display_name;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  phoneNumber: PhoneNumber;
  onClose: () => void;
}

export function PipelineConfigPanel({ phoneNumber, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => toFormState(phoneNumber.voice_config));
  const updateConfig = useUpdatePhoneNumberConfig();

  // Provider lists
  const { data: sttProviders = [] } = useSTTProviders();
  const { data: ttsProviders = [] } = useTTSProviders();

  // Models — fetched when a provider is selected
  const { data: rawSttModels = [] } = useSTTModels(form.stt_provider || null);
  const { data: rawTtsModels = [] } = useTTSModels(form.tts_provider || null);

  // Voices — only for providers that support them
  const ttsProviderMeta = ttsProviders.find((p) => p.provider_id === form.tts_provider);
  const supportsVoices = ttsProviderMeta?.supports_voices ?? false;
  const { data: ttsVoices = [] } = useTTSVoices(form.tts_provider || null, supportsVoices);

  // Language-based filtering
  const activeLang = form.language || "";
  const sttModels = rawSttModels.filter((m) =>
    isLanguageCompatible(m.languages, activeLang)
  );
  const ttsModels = rawTtsModels.filter((m) =>
    isLanguageCompatible(m.languages, activeLang)
  );

  // Streaming state
  const selectedSttModel = rawSttModels.find((m) => m.id === form.stt_model);
  const selectedTtsModel = rawTtsModels.find((m) => m.id === form.tts_model);
  const sttNonStreaming = !!selectedSttModel && !selectedSttModel.streaming;
  const ttsNonStreaming = !!selectedTtsModel && !selectedTtsModel.streaming;

  // Smart suggestion
  const recommendation = LANGUAGE_RECOMMENDATIONS[activeLang] ?? null;
  const showSuggestion = recommendation !== null && !form.stt_provider && !form.tts_provider;

  // Sarvam voice is configured at agent level, not per-number
  const ttsVoiceIsAgentLevel = form.tts_provider === "sarvam";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "stt_provider") next.stt_model = "";
      if (key === "tts_provider") { next.tts_model = ""; next.tts_voice_id = ""; }
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
    updateConfig.mutate(
      { id: phoneNumber.id, voice_config: toPayload(form) },
      { onSuccess: onClose },
    );
  }

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

        {/* Smart suggestion */}
        {showSuggestion && activeLang && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-blue-800">Recommended</p>
                <p className="text-[11px] text-blue-700 leading-snug">
                  {recommendation!.rationale}
                </p>
              </div>
            </div>
            <button
              onClick={applyRecommendation}
              className="mt-1.5 text-[11px] font-medium text-blue-700 hover:text-blue-900"
            >
              Apply suggestion →
            </button>
          </div>
        )}

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
                <option value="">Auto-detect (org default)</option>
                {sttProviders.map((p) => (
                  <option key={p.provider_id} value={p.provider_id}>{p.display_name}</option>
                ))}
              </select>
            </div>
            {form.stt_provider && sttModels.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Model</label>
                <select
                  value={form.stt_model ?? ""}
                  onChange={(e) => set("stt_model", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Default</option>
                  {sttModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {modelLabel(m)}{!m.streaming ? " ⚠" : ""}
                    </option>
                  ))}
                </select>
                {form.stt_model && selectedSttModel?.streaming && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 mt-1">
                    <Zap className="h-2.5 w-2.5" /> Real-time
                  </span>
                )}
                {sttNonStreaming && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Batch only — not for live calls
                  </p>
                )}
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
                <option value="">Auto-detect (org default)</option>
                {ttsProviders.map((p) => (
                  <option key={p.provider_id} value={p.provider_id}>{p.display_name}</option>
                ))}
              </select>
            </div>

            {/* Voice — dropdown if provider exposes voices */}
            {supportsVoices && !ttsVoiceIsAgentLevel && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Voice</label>
                <select
                  value={form.tts_voice_id ?? ""}
                  onChange={(e) => set("tts_voice_id", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Default</option>
                  {ttsVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}{v.gender ? ` (${v.gender})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Voice ID — free-text for providers without a voices API */}
            {form.tts_provider && !supportsVoices && !ttsVoiceIsAgentLevel && (
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

            {form.tts_provider && ttsModels.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Model</label>
                <select
                  value={form.tts_model ?? ""}
                  onChange={(e) => set("tts_model", e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Default</option>
                  {ttsModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {modelLabel(m)}{!m.streaming ? " ⚠" : ""}
                    </option>
                  ))}
                </select>
                {form.tts_model && selectedTtsModel?.streaming && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 mt-1">
                    <Zap className="h-2.5 w-2.5" /> Real-time
                  </span>
                )}
                {ttsNonStreaming && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Batch only — not for live calls
                  </p>
                )}
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

            {ttsVoiceIsAgentLevel && (
              <p className="text-[11px] text-muted-foreground">
                Sarvam voice is set automatically based on language.
              </p>
            )}
          </div>
        </div>

        {/* Emotion / Expressiveness */}
        {form.tts_provider && (form.tts_provider === "cartesia" || form.tts_provider === "elevenlabs" || form.tts_provider === "openai") && (
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Expressiveness</p>
            <div className="space-y-2">

              {form.tts_provider === "cartesia" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Emotion</label>
                  <select
                    value={form.tts_emotion ?? ""}
                    onChange={(e) => set("tts_emotion", e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {CARTESIA_EMOTIONS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.tts_provider === "elevenlabs" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Stability (0–1)</label>
                    <input
                      type="number"
                      min={0} max={1} step={0.05}
                      value={form.tts_stability ?? ""}
                      onChange={(e) => set("tts_stability", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.5"
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Style (0–1)</label>
                    <input
                      type="number"
                      min={0} max={1} step={0.05}
                      value={form.tts_style ?? ""}
                      onChange={(e) => set("tts_style", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.0"
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    />
                  </div>
                </>
              )}

              {form.tts_provider === "openai" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Instructions</label>
                  <textarea
                    rows={3}
                    value={form.tts_instructions ?? ""}
                    onChange={(e) => set("tts_instructions", e.target.value)}
                    placeholder="e.g. Speak warmly and with gentle enthusiasm."
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
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
