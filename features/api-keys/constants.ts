export const SERVICES = [
  // LLM
  { value: "openai", label: "OpenAI", category: "LLM" },
  { value: "anthropic", label: "Anthropic", category: "LLM" },
  { value: "gemini", label: "Google Gemini", category: "LLM" },
  { value: "groq", label: "Groq", category: "LLM" },
  { value: "azure_openai", label: "Azure OpenAI", category: "LLM" },
  { value: "mistral", label: "Mistral", category: "LLM" },
  // STT
  { value: "deepgram", label: "Deepgram", category: "STT" },
  { value: "assemblyai", label: "AssemblyAI", category: "STT" },
  { value: "sarvam", label: "Sarvam AI (Indian languages)", category: "STT" },
  // TTS
  { value: "elevenlabs", label: "ElevenLabs", category: "TTS" },
  { value: "cartesia", label: "Cartesia", category: "TTS" },
  // Telephony
  { value: "twilio", label: "Twilio", category: "Telephony" },
  { value: "vonage", label: "Vonage", category: "Telephony" },
  { value: "telnyx", label: "Telnyx", category: "Telephony" },
  // WhatsApp
  { value: "gupshup", label: "Gupshup (WhatsApp)", category: "WhatsApp" },
  // Vector DB
  { value: "pinecone", label: "Pinecone", category: "Vector DB" },
  { value: "qdrant", label: "Qdrant", category: "Vector DB" },
] as const;

export type ServiceValue = (typeof SERVICES)[number]["value"];

export function getServiceLabel(value: string): string {
  return SERVICES.find((s) => s.value === value)?.label ?? value;
}
