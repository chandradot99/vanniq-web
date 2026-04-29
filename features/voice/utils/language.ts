/**
 * Language compatibility utilities for voice provider model/voice filtering.
 *
 * Matching rules:
 *  - languages: ["*"]      → compatible with everything
 *  - empty language        → show everything (no filter)
 *  - model has "en"        → matches "en-US", "en-IN", "en-GB" (base covers all regions)
 *  - model has "en-IN"     → matches "en-IN" exactly, and also bare "en" (no region)
 *  - "en-US" vs "en-IN"   → NOT a match — different regional variants
 */

export function isLanguageCompatible(modelLangs: string[], language: string): boolean {
  if (!language) return true;
  if (modelLangs.includes("*")) return true;
  if (modelLangs.includes(language)) return true;

  const prefix = language.split("-")[0];
  const hasRegion = language.includes("-");

  // Model declares base code ("en") → compatible with any regional variant ("en-US", "en-IN")
  if (modelLangs.includes(prefix)) return true;

  // User selected a bare code without region ("en") → compatible with any regional variant
  // ("en-US", "en-IN"). But "en-US" does NOT match "en-IN" — skip this check when a
  // specific region is already selected to prevent cross-region false positives (e.g.
  // Sarvam's "en-IN" incorrectly matching when the user picks English / "en-US").
  if (!hasRegion && modelLangs.some((l) => l.startsWith(prefix + "-"))) return true;

  return false;
}

// ── Smart recommendations ─────────────────────────────────────────────────────
// Suggested STT + TTS combos per language, ranked by quality/latency.
// Used to show a "Recommended for this language" chip in the UI.

export interface LanguageRecommendation {
  stt_provider: string;
  stt_model: string;
  tts_provider: string;
  tts_model: string;
  tts_voice_id?: string;
  rationale: string;
}

export const LANGUAGE_RECOMMENDATIONS: Record<string, LanguageRecommendation> = {
  // Indian languages — Sarvam is purpose-built
  "hi-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "meera",
    rationale: "Sarvam AI is purpose-built for Hindi and Indian languages",
  },
  "ta-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "pavithra",
    rationale: "Sarvam AI is purpose-built for Tamil and Indian languages",
  },
  "te-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "arvind",
    rationale: "Sarvam AI is purpose-built for Telugu and Indian languages",
  },
  "bn-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "amartya",
    rationale: "Sarvam AI is purpose-built for Bengali and Indian languages",
  },
  "mr-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "aarohi",
    rationale: "Sarvam AI is purpose-built for Marathi and Indian languages",
  },
  "gu-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "manisha",
    rationale: "Sarvam AI is purpose-built for Gujarati and Indian languages",
  },
  "kn-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "roopa",
    rationale: "Sarvam AI is purpose-built for Kannada and Indian languages",
  },
  "ml-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "indu",
    rationale: "Sarvam AI is purpose-built for Malayalam and Indian languages",
  },
  "pa-IN": {
    stt_provider: "sarvam",
    stt_model: "saaras:v3",
    tts_provider: "sarvam",
    tts_model: "bulbul:v3",
    tts_voice_id: "nirmal",
    rationale: "Sarvam AI is purpose-built for Punjabi and Indian languages",
  },
  // English — Deepgram Nova 3 + Cartesia Sonic 3
  "en-US": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "cartesia",
    tts_model: "sonic-3",
    rationale: "Deepgram Nova 3 + Cartesia Sonic 3 gives lowest latency for English",
  },
  "en-GB": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "cartesia",
    tts_model: "sonic-3",
    rationale: "Deepgram Nova 3 + Cartesia Sonic 3 gives lowest latency for English",
  },
  "en-IN": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "cartesia",
    tts_model: "sonic-3",
    rationale: "Deepgram Nova 3 supports en-IN; Cartesia Sonic 3 for TTS",
  },
  // Other major languages — Deepgram Nova 3 + ElevenLabs Flash
  "es-ES": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for Spanish",
  },
  "fr-FR": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for French",
  },
  "de-DE": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for German",
  },
  "pt-BR": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for Portuguese",
  },
  "ja-JP": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for Japanese",
  },
  "zh-CN": {
    stt_provider: "deepgram",
    stt_model: "nova-3",
    tts_provider: "elevenlabs",
    tts_model: "eleven_flash_v2_5",
    rationale: "Deepgram Nova 3 + ElevenLabs Flash v2.5 for Mandarin",
  },
};
