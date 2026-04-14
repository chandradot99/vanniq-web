"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Trash2, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { PageBody } from "@/components/layout/page-body";
import { cn } from "@/lib/utils";
import { usePlatformSchemas, usePlatformConfigs, useDeletePlatformConfig } from "../hooks/use-admin";
import { PlatformConfigDialog } from "./platform-config-dialog";
import type { ProviderSchema, PlatformConfig } from "@/types";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "provider" | "app";
type StatusFilter = "all" | "configured" | "not-configured";

const TABS: { id: Tab; label: string }[] = [
  { id: "provider", label: "Providers" },
  { id: "app", label: "App Setup" },
];

// ── Subcategory groupings (frontend-only) ─────────────────────────────────────

const SUBCATEGORIES: Record<Tab, { label: string; providers: string[] }[]> = {
  provider: [
    { label: "AI Models", providers: ["openai", "anthropic", "groq", "gemini", "mistral"] },
    { label: "Voice", providers: ["deepgram", "cartesia", "elevenlabs", "sarvam"] },
  ],
  app: [
    { label: "Telephony", providers: ["twilio", "telnyx", "vonage"] },
    { label: "Messaging", providers: ["gupshup"] },
    { label: "OAuth Apps", providers: ["google", "slack"] },
    { label: "Observability", providers: ["langsmith", "sentry"] },
  ],
};

// ── Provider logos ────────────────────────────────────────────────────────────

function LogoBadge({ bg, text }: { bg: string; text: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${bg}`}>
      {text}
    </div>
  );
}

const PROVIDER_LOGOS: Record<string, React.ReactNode> = {
  openai:     <LogoBadge bg="bg-[#10a37f]" text="O" />,
  anthropic:  <LogoBadge bg="bg-[#c9602f]" text="A" />,
  groq:       <LogoBadge bg="bg-[#f55036]" text="G" />,
  gemini:     <LogoBadge bg="bg-[#4285F4]" text="Ge" />,
  mistral:    <LogoBadge bg="bg-[#ff7000]" text="M" />,
  deepgram:   <LogoBadge bg="bg-[#101010]" text="Dg" />,
  cartesia:   <LogoBadge bg="bg-[#7c3aed]" text="Ca" />,
  elevenlabs: <LogoBadge bg="bg-[#1a1a1a]" text="11" />,
  sarvam:     <LogoBadge bg="bg-[#f97316]" text="Sa" />,
  telnyx:     <LogoBadge bg="bg-[#00c08b]" text="Te" />,
  gupshup:    <LogoBadge bg="bg-[#25d366]" text="Gu" />,
  twilio:     <LogoBadge bg="bg-[#f22f46]" text="Tw" />,
  vonage:     <LogoBadge bg="bg-[#7c1d7c]" text="Vo" />,
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
    <Card className="py-0">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {logo}
          <span className="font-semibold text-sm leading-tight">{schema.display_name}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {schema.description}
        </p>

        <div className="flex items-center justify-between border-t border-border/60 pt-2">
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
            <Button size="sm" variant={configured ? "outline" : "default"} onClick={onConfigure}>
              {configured ? (
                <><Pencil className="h-3 w-3 mr-1.5" />Update</>
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as Tab) ?? "provider";

  function setTab(tab: Tab) {
    router.replace(`/settings/platform?tab=${tab}`);
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  const { data: schemas = [], isLoading: schemasLoading } = usePlatformSchemas();
  const { data: configs = [], isLoading: configsLoading } = usePlatformConfigs();
  const deleteMutation = useDeletePlatformConfig();

  const isLoading = schemasLoading || configsLoading;

  function isConfigured(provider: string) {
    return configs.some((c) => c.provider === provider);
  }

  function configByProvider(provider: string): PlatformConfig | undefined {
    return configs.find((c) => c.provider === provider);
  }

  const tabSchemas = schemas.filter((s) => s.category === activeTab);
  const configuredCount = tabSchemas.filter((s) => isConfigured(s.provider)).length;

  const filteredSchemas = useMemo(() => {
    return tabSchemas.filter((s) => {
      const matchesSearch = s.display_name.toLowerCase().includes(search.toLowerCase());
      const configured = isConfigured(s.provider);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "configured" && configured) ||
        (statusFilter === "not-configured" && !configured);
      return matchesSearch && matchesStatus;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSchemas, search, statusFilter, configs]);

  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "configured", label: `Configured (${configuredCount})` },
    { id: "not-configured", label: "Not configured" },
  ];

  const subcategories = SUBCATEGORIES[activeTab];

  const typeOptions = [
    { value: "all", label: "All Types" },
    ...subcategories.map((s) => ({ value: s.label, label: s.label })),
  ];

  const visibleSubcategories = typeFilter === "all"
    ? subcategories
    : subcategories.filter((s) => s.label === typeFilter);

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
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-sm min-w-[185px]">
                <span className="flex-1 text-left text-sm">
                  {typeOptions.find((o) => o.value === typeFilter)?.label}
                </span>
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 ml-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    statusFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-28 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {visibleSubcategories.map((sub) => {
                const subSchemas = filteredSchemas
                  .filter((s) => sub.providers.includes(s.provider))
                  .sort((a, b) => (isConfigured(b.provider) ? 1 : 0) - (isConfigured(a.provider) ? 1 : 0));

                if (subSchemas.length === 0) return null;

                return (
                  <div key={sub.label} className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {sub.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {subSchemas.map((schema) => (
                        <ProviderCard
                          key={schema.provider}
                          schema={schema}
                          config={configByProvider(schema.provider)}
                          onConfigure={() => setActiveSchema(schema)}
                          onDelete={() => deleteMutation.mutate(schema.provider)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {visibleSubcategories.every((sub) =>
                filteredSchemas.filter((s) => sub.providers.includes(s.provider)).length === 0
              ) && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm font-medium">No providers found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
                </div>
              )}
            </div>
          )}
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
