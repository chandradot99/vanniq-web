"use client";

import { useState } from "react";
import { CheckCircle, Circle, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageBody } from "@/components/layout/page-body";
import { usePlatformSchemas, usePlatformConfigs, useDeletePlatformConfig } from "../hooks/use-admin";
import { PlatformConfigSheet } from "./platform-config-sheet";
import type { ProviderSchema, PlatformConfig } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  oauth: "OAuth Apps",
  voice: "Voice & Telephony",
  observability: "Observability",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  oauth: "OAuth app registrations shared by all organisations on this instance. Required before users can connect Google Calendar, Gmail, or Slack via Integrations.",
  voice: "Default STT, TTS, and telephony credentials for this instance. All voice calls fall back to these unless an organisation has connected their own provider keys via Integrations.",
  observability: "Monitoring and tracing applied globally to all agent runs on this instance.",
};

function EnvCallout() {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-border bg-muted/40">
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Replaces environment variables</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Credentials configured here are applied deployment-wide — no{" "}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">.env</code> edits
          required. Organisations can override any credential via{" "}
          <strong className="text-foreground font-medium">Integrations</strong>; those always take
          priority over these platform defaults.
        </p>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ProviderRow({
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

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{schema.display_name}</span>
          {configured ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Circle className="h-3 w-3" />
              Not configured
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{schema.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {configured && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Remove configuration"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <Button size="sm" variant={configured ? "outline" : "default"} onClick={onConfigure}>
          {configured ? "Update" : "Configure"}
        </Button>
      </div>
    </div>
  );
}

export function AdminPage() {
  const [activeSchema, setActiveSchema] = useState<ProviderSchema | null>(null);

  const { data: schemas = [], isLoading: schemasLoading } = usePlatformSchemas();
  const { data: configs = [], isLoading: configsLoading } = usePlatformConfigs();
  const deleteMutation = useDeletePlatformConfig();

  const isLoading = schemasLoading || configsLoading;

  function configByProvider(provider: string): PlatformConfig | undefined {
    return configs.find((c) => c.provider === provider);
  }

  // Group schemas by category
  const byCategory = schemas.reduce<Record<string, ProviderSchema[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const pageHeader = (
    <PageHeader
      title="Platform Settings"
      description="Deployment-wide defaults for all organisations on this instance."
    />
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {pageHeader}
        <PageBody>
          <div className="max-w-3xl space-y-8">
            <div className="h-16 rounded-xl border border-border bg-muted/40 animate-pulse" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </PageBody>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {pageHeader}
        <PageBody>
          <div className="max-w-3xl space-y-10">
            <EnvCallout />
            {Object.entries(byCategory).map(([category, categorySchemas]) => (
              <Section
                key={category}
                title={CATEGORY_LABELS[category] ?? category}
                description={CATEGORY_DESCRIPTIONS[category] ?? ""}
              >
                {categorySchemas.map((schema) => (
                  <ProviderRow
                    key={schema.provider}
                    schema={schema}
                    config={configByProvider(schema.provider)}
                    onConfigure={() => setActiveSchema(schema)}
                    onDelete={() => deleteMutation.mutate(schema.provider)}
                  />
                ))}
              </Section>
            ))}
          </div>
        </PageBody>
      </div>

      <PlatformConfigSheet
        key={activeSchema?.provider ?? "none"}
        schema={activeSchema}
        existing={activeSchema ? configByProvider(activeSchema.provider) : undefined}
        onOpenChange={(open) => !open && setActiveSchema(null)}
      />
    </>
  );
}
