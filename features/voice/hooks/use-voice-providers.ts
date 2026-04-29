import { useQuery } from "@tanstack/react-query";
import { voiceProvidersApi } from "@/features/voice/api";

const QK = "voice-providers";

export function useSTTProviders() {
  return useQuery({
    queryKey: [QK, "stt"],
    queryFn: voiceProvidersApi.listSTT,
    staleTime: 24 * 60 * 60 * 1000, // 24h — providers rarely change
  });
}

export function useSTTModels(provider: string | null) {
  return useQuery({
    queryKey: [QK, "stt", provider, "models"],
    queryFn: () => voiceProvidersApi.getSTTModels(provider!),
    enabled: !!provider,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useTTSProviders() {
  return useQuery({
    queryKey: [QK, "tts"],
    queryFn: voiceProvidersApi.listTTS,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useTTSModels(provider: string | null) {
  return useQuery({
    queryKey: [QK, "tts", provider, "models"],
    queryFn: () => voiceProvidersApi.getTTSModels(provider!),
    enabled: !!provider,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useTTSVoices(provider: string | null, supportsVoices: boolean) {
  return useQuery({
    queryKey: [QK, "tts", provider, "voices"],
    queryFn: () => voiceProvidersApi.getTTSVoices(provider!),
    enabled: !!provider && supportsVoices,
    staleTime: 60 * 60 * 1000, // 1h — custom voices can be added
  });
}
