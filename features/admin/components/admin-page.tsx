"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { PageBody } from "@/components/layout/page-body";
import { cn } from "@/lib/utils";
import { usePlatformSchemas, usePlatformConfigs, useDeletePlatformConfig } from "../hooks/use-admin";
import { PlatformConfigDialog } from "./platform-config-dialog";
import type { ProviderSchema, PlatformConfig } from "@/types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "voice" | "oauth" | "observability";

const TABS: { id: Tab; label: string; description: string }[] = [
  {
    id: "voice",
    label: "Voice & Telephony",
    description:
      "Default STT, TTS, and telephony credentials for this deployment. All voice calls fall back to these unless an organisation has connected their own credentials via Integrations.",
  },
  {
    id: "oauth",
    label: "OAuth Apps",
    description:
      "OAuth app registrations shared by all organisations on this instance. Required before users can connect Google Calendar, Gmail, or Slack via Integrations.",
  },
  {
    id: "observability",
    label: "Observability",
    description:
      "Monitoring and tracing applied globally to all agent runs on this instance.",
  },
];

// ── Provider logos ────────────────────────────────────────────────────────────

function LogoBadge({ bg, text }: { bg: string; text: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${bg}`}
    >
      {text}
    </div>
  );
}

const PROVIDER_LOGOS: Record<string, React.ReactNode> = {
  deepgram:   <LogoBadge bg="bg-[#101010]" text="Dg" />,
  cartesia:   <LogoBadge bg="bg-[#7c3aed]" text="Ca" />,
  elevenlabs: <LogoBadge bg="bg-[#1a1a1a]" text="11" />,
  sarvam:     <LogoBadge bg="bg-[#f97316]" text="Sa" />,
  twilio:     <LogoBadge bg="bg-[#f22f46]" text="Tw" />,
  google:     <LogoBadge bg="bg-[#4285F4]" text="G" />,
  slack:      <LogoBadge bg="bg-[#4a154b]" text="Sl" />,
  langsmith:  <LogoBadge bg="bg-[#1868db]" text="Ls" />,
  sentry:     <LogoBadge bg="bg-[#362d59]" text="Se" />,
};

// ── Provider card ─────────────────────────────────────────────────────────────

function ProviderCard({
  schema,
  config,
  onConfigure,
  onDelete,
}: {
  schema: ProviderSchema;
  config: PlatformConfig | undefined;
  onConfigure: () => void;
  onDelete: () => void;
}) {
  const configured = !!config;
  const logo =
    PROVIDER_LOGOS[schema.provider] ?? (
      <LogoBadge bg="bg-muted-foreground/20" text={schema.display_name[0].toUpperCase()} />
    );

  return (
    <Card className="flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1 gap-4">
        {/* Header: logo + name */}
        <div className="flex items-center gap-3">
          {logo}
          <span className="font-semibold text-sm leading-tight">{schema.display_name}</span>
        </div>

        {/* Description — clamped so cards stay uniform height */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {schema.description}
        </p>

        {/* Footer: status + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          {configured ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Configured
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not configured</span>
          )}

          <div className="flex items-center gap-1.5">
            {configured && (
              <button
                onClick={onDelete}
                title="Remove"
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              size="sm"
              variant={configured ? "outline" : "default"}
              onClick={onConfigure}
            >
              {configured ? (
                <>
                  <Pencil className="h-3 w-3 mr-1.5" />
                  Update
                </>
              ) : (
                "Configure"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const [activeSchema, setActiveSchema] = useState<ProviderSchema | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as Tab) ?? "voice";

  function setTab(tab: Tab) {
    router.replace(`/settings/platform?tab=${tab}`);
  }

  const { data: schemas = [], isLoading: schemasLoading } = usePlatformSchemas();
  const { data: configs = [], isLoading: configsLoading } = usePlatformConfigs();
  const deleteMutation = useDeletePlatformConfig();

  const isLoading = schemasLoading || configsLoading;

  function configByProvider(provider: string): PlatformConfig | undefined {
    return configs.find((c) => c.provider === provider);
  }

  const tabSchemas = schemas.filter((s) => s.category === activeTab);
  const activeTabDef = TABS.find((t) => t.id === activeTab);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <PageHeader
          title="Platform Settings"
          description="Deployment-wide defaults — configure once here instead of editing .env files. Org Integrations always take priority."
        />

        {/* Tab bar */}
        <div className="shrink-0 border-b border-border bg-background">
          <div className="max-w-[1600px] mx-auto px-8 flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <PageBody>
          <div className="space-y-4">
            {/* Tab description */}
            {activeTabDef && (
              <p className="text-sm text-muted-foreground">{activeTabDef.description}</p>
            )}

            {/* Content */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : tabSchemas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No providers available in this category.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tabSchemas.map((schema) => (
                  <ProviderCard
                    key={schema.provider}
                    schema={schema}
                    config={configByProvider(schema.provider)}
                    onConfigure={() => setActiveSchema(schema)}
                    onDelete={() => deleteMutation.mutate(schema.provider)}
                  />
                ))}
              </div>
            )}
          </div>
        </PageBody>
      </div>

      <PlatformConfigDialog
        key={activeSchema?.provider ?? "none"}
        schema={activeSchema}
        existing={activeSchema ? configByProvider(activeSchema.provider) : undefined}
        onOpenChange={(open) => !open && setActiveSchema(null)}
      />
    </>
  );
}
