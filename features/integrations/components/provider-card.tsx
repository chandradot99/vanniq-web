"use client";

import { CheckCircle2, MoreHorizontal, Unplug, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <Card className="group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {def.logo}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm">{def.name}</span>
              {isConnected && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>

            {isConnected && connectedInfo && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {connectedInfo}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5",
                    "text-xs font-medium shadow-xs hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "cursor-pointer transition-colors"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Connected
                  <MoreHorizontal className="h-3.5 w-3.5 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {def.testable && (
                    <>
                      <DropdownMenuItem
                        onClick={() => testMutation.mutate(integration.id)}
                        disabled={testMutation.isPending}
                      >
                        <FlaskConical className="h-3.5 w-3.5 mr-2" />
                        Test connection
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(integration.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Unplug className="h-3.5 w-3.5 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
