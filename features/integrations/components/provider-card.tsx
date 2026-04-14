"use client";

import { CheckCircle2, FlaskConical, Unplug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Integration } from "@/types";
import { useDeleteIntegration, useTestIntegration } from "../hooks/use-integrations";

interface ProviderDef {
  provider: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  authType: "apikey" | "oauth";
  testable?: boolean;
  onConnect: () => void;
}

interface ProviderCardProps {
  def: ProviderDef;
  integration?: Integration;
}

export function ProviderCard({ def, integration }: ProviderCardProps) {
  const isConnected = !!integration;
  const deleteMutation = useDeleteIntegration();
  const testMutation = useTestIntegration();

  const keyHint = integration?.meta?.key_hint as string | undefined;
  const accountEmail = integration?.meta?.account_email as string | undefined;
  const connectedInfo = accountEmail ?? keyHint;

  return (
    <Card className="flex flex-col">
      <CardContent className="px-5 py-3 flex flex-col flex-1 gap-3">
        {/* Header: logo + name */}
        <div className="flex items-center gap-3">
          {def.logo}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{def.name}</span>
            {isConnected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {def.description}
        </p>

        {/* Footer: status + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          {isConnected ? (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
              {connectedInfo ?? "Connected"}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not connected</span>
          )}

          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                {def.testable && (
                  <button
                    onClick={() => testMutation.mutate(integration.id)}
                    disabled={testMutation.isPending}
                    title="Test connection"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(integration.id)}
                  disabled={deleteMutation.isPending}
                  title="Disconnect"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <Unplug className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <Button size="sm" onClick={def.onConnect}>
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { ProviderDef };
