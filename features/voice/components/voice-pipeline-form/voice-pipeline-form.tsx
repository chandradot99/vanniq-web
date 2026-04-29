"use client";

import { useState } from "react";
import { Save, Zap, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Agent, VoiceConfig, VoiceModelInfo } from "@/types";
import { useUpdateVoiceConfig } from "@/features/agents/hooks/use-agents";
import {
  useSTTProviders,
  useSTTModels,
  useTTSProviders,
  useTTSModels,
  useTTSVoices,
} from "@/features/voice/hooks/use-voice-providers";
import {
  isLanguageCompatible,
  LANGUAGE_RECOMMENDATIONS,
} from "@/features/voice/utils/language";

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
  { value: "pa-IN", label: "Punjabi" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-US", label: "Spanish (US)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Mandarin)" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Cartesia emotion presets (name:level format used by Sonic-3 API)
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
  { value: "anger:high",        label: "Angry — high" },
  { value: "anger:medium",      label: "Angry — medium" },
  { value: "negativity:high",   label: "Negative — high" },
  { value: "negativity:medium", label: "Negative — medium" },
];

function toFormState(vc: VoiceConfig | null): Required<VoiceConfig> {
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StreamingBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1 py-px">
      <Zap className="h-2.5 w-2.5" />
      Real-time
    </span>
  );
}

function NonStreamingWarning() {
  return (
    <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      This model doesn&apos;t support real-time streaming and can&apos;t be used for live voice calls.
    </p>
  );
}

function modelLabel(m: VoiceModelInfo) {
  return m.is_default ? `${m.display_name} (default)` : m.display_name;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  agent: Agent;
}

export function VoicePipelineForm({ agent }: Props) {
  const [form, setForm] = useState<Required<VoiceConfig>>(() =>
    toFormState(agent.voice_config)
  );
  const updateVoiceConfig = useUpdateVoiceConfig(agent.id);

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
  const activeLang = form.language || agent.language || "";
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
  const showSuggestion =
    recommendation !== null &&
    !form.stt_provider &&
    !form.tts_provider;

  // Sarvam voice is configured at agent level (per-language default)
  const ttsVoiceIsAgentLevel = form.tts_provider === "sarvam";

  function set<K extends keyof Required<VoiceConfig>>(
    key: K,
    value: Required<VoiceConfig>[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "stt_provider") next.stt_model = "";
      if (key === "tts_provider") {
        next.tts_model = "";
        next.tts_voice_id = "";
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
    updateVoiceConfig.mutate(toPayload(form));
  }

  return (
    <div className="space-y-6">
      {/* Language */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Language</h3>
        <div className="max-w-xs">
          <label className="text-xs text-muted-foreground block mb-1">
            Voice language override
          </label>
          <select
            value={form.language ?? ""}
            onChange={(e) => set("language", e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Overrides the agent&apos;s default language for voice calls only.
          </p>
        </div>
      </div>

      {/* Smart suggestion */}
      {showSuggestion && activeLang && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 max-w-lg">
          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-800 mb-0.5">
              Recommended for this language
            </p>
            <p className="text-xs text-blue-700">{recommendation!.rationale}</p>
          </div>
          <button
            onClick={applyRecommendation}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 shrink-0"
          >
            Apply
          </button>
        </div>
      )}

      {/* STT */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Speech-to-Text (STT)</h3>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Provider</label>
            <select
              value={form.stt_provider}
              onChange={(e) => set("stt_provider", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Auto-detect (org default)</option>
              {sttProviders.map((p) => (
                <option key={p.provider_id} value={p.provider_id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </div>

          {form.stt_provider && sttModels.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Model</label>
              <select
                value={form.stt_model ?? ""}
                onChange={(e) => set("stt_model", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Default</option>
                {sttModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {modelLabel(m)}
                    {!m.streaming ? " ⚠ batch only" : ""}
                  </option>
                ))}
              </select>
              {form.stt_model && (
                <div className="mt-1">
                  {selectedSttModel?.streaming ? (
                    <StreamingBadge />
                  ) : null}
                  {sttNonStreaming && <NonStreamingWarning />}
                </div>
              )}
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
              value={form.tts_provider}
              onChange={(e) => set("tts_provider", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Auto-detect (org default)</option>
              {ttsProviders.map((p) => (
                <option key={p.provider_id} value={p.provider_id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice dropdown — for providers that expose a voices API */}
          {supportsVoices && !ttsVoiceIsAgentLevel && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Voice</label>
              <select
                value={form.tts_voice_id ?? ""}
                onChange={(e) => set("tts_voice_id", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Default</option>
                {ttsVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.gender ? ` (${v.gender})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Voice ID text input — for providers without a voices API */}
          {form.tts_provider && !supportsVoices && !ttsVoiceIsAgentLevel && (
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

          {form.tts_provider && ttsModels.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Model</label>
              <select
                value={form.tts_model ?? ""}
                onChange={(e) => set("tts_model", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Default</option>
                {ttsModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {modelLabel(m)}
                    {!m.streaming ? " ⚠ batch only" : ""}
                  </option>
                ))}
              </select>
              {form.tts_model && (
                <div className="mt-1">
                  {selectedTtsModel?.streaming ? (
                    <StreamingBadge />
                  ) : null}
                  {ttsNonStreaming && <NonStreamingWarning />}
                </div>
              )}
            </div>
          )}

          {form.tts_provider && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Speed{" "}
                <span className="text-muted-foreground/60">(0.5 – 2.0, default 1.0)</span>
              </label>
              <input
                type="number"
                min={0.5}
                max={2.0}
                step={0.1}
                value={form.tts_speed ?? ""}
                onChange={(e) =>
                  set("tts_speed", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="1.0"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}
        </div>

        {ttsVoiceIsAgentLevel && (
          <p className="text-xs text-muted-foreground mt-2">
            Sarvam voice is set automatically based on the call language.
          </p>
        )}
      </div>

      {/* Emotion / Expressiveness — shown only when a relevant provider is selected */}
      {form.tts_provider && (form.tts_provider === "cartesia" || form.tts_provider === "elevenlabs" || form.tts_provider === "openai") && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Emotion &amp; Expressiveness</h3>
          <div className="grid grid-cols-2 gap-4 max-w-lg">

            {/* Cartesia: emotion preset */}
            {form.tts_provider === "cartesia" && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Emotion</label>
                <select
                  value={form.tts_emotion ?? ""}
                  onChange={(e) => set("tts_emotion", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CARTESIA_EMOTIONS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Infuses the synthesis with a specific emotional tone.
                </p>
              </div>
            )}

            {/* ElevenLabs: stability + style */}
            {form.tts_provider === "elevenlabs" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Stability <span className="text-muted-foreground/60">(0 – 1)</span>
                  </label>
                  <input
                    type="number"
                    min={0} max={1} step={0.05}
                    value={form.tts_stability ?? ""}
                    onChange={(e) => set("tts_stability", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.5"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher = more consistent. Lower = more expressive variance.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Style <span className="text-muted-foreground/60">(0 – 1)</span>
                  </label>
                  <input
                    type="number"
                    min={0} max={1} step={0.05}
                    value={form.tts_style ?? ""}
                    onChange={(e) => set("tts_style", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.0"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Expressiveness / style exaggeration. 0 = neutral.
                  </p>
                </div>
              </>
            )}

            {/* OpenAI: free-form instructions */}
            {form.tts_provider === "openai" && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  Voice instructions{" "}
                  <span className="text-muted-foreground/60">(gpt-4o-mini-tts only)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.tts_instructions ?? ""}
                  onChange={(e) => set("tts_instructions", e.target.value)}
                  placeholder="e.g. Speak in a warm, friendly tone with gentle enthusiasm."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Free-form instruction guiding emotional tone and delivery style.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
