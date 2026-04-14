"use client";

import Link from "next/link";
import { Plus, Bot } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageBody } from "@/components/layout/page-body";
import { useAgents } from "../hooks/use-agents";
import { AgentCard } from "./agent-card";

function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted rounded animate-pulse w-28" />
          <div className="h-3 bg-muted rounded animate-pulse w-20" />
        </div>
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

export function AgentsList() {
  const { data: agents = [], isLoading } = useAgents();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Agents"
        description="Build and deploy AI agents for voice, chat, and WhatsApp."
        actions={
          <Link href="/agents/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New agent
          </Link>
        }
      />

      <PageBody>
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="font-semibold text-base mt-2">No agents yet</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Create your first AI agent to handle voice calls, chat, and WhatsApp conversations.
            </p>
            <Link href="/agents/new" className={buttonVariants({ className: "mt-6", size: "sm" })}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create your first agent
            </Link>
          </div>
        )}

        {/* Agent grid */}
        {!isLoading && agents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}
