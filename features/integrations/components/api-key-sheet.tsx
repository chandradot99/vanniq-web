"use client";

import { useState } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateIntegration } from "../hooks/use-integrations";

interface ProviderConfig {
  provider: string;
  name: string;
  logo: React.ReactNode;
  tagline: string;
  keyLabel: string;
  keyPlaceholder: string;
  docsUrl: string;
  docsLabel: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    provider: "openai",
    name: "OpenAI",
    logo: (
      <div className="w-8 h-8 rounded-md bg-[#10a37f] flex items-center justify-center text-white font-bold text-sm">
        O
      </div>
    ),
    tagline: "Powers GPT-4o and GPT-4o-mini responses in your agents. Key is encrypted at rest and never logged.",
    keyLabel: "API Key",
    keyPlaceholder: "sk-proj-…",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "Get API key from OpenAI Platform",
  },
  anthropic: {
    provider: "anthropic",
    name: "Anthropic",
    logo: (
      <div className="w-8 h-8 rounded-md bg-[#c9602f] flex items-center justify-center text-white font-bold text-sm">
        A
      </div>
    ),
    tagline: "Powers Claude 3.5 Sonnet and Haiku responses in your agents. Key is encrypted at rest and never logged.",
    keyLabel: "API Key",
    keyPlaceholder: "sk-ant-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "Get API key from Anthropic Console",
  },
};

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
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        {config && (
          <>
            <SheetHeader className="pb-6 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                {config.logo}
                <SheetTitle className="text-base">{config.name}</SheetTitle>
              </div>
              <SheetDescription className="text-sm leading-relaxed">
                {config.tagline}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 py-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="api-key">{config.keyLabel}</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    placeholder={config.keyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
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

            <SheetFooter className="border-t border-border pt-4">
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
        )}
      </SheetContent>
    </Sheet>
  );
}
