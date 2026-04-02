"use client";

import { useAgent } from "../hooks/use-agents";
import { GraphEditor } from "./graph/graph-editor";

interface Props {
  agentId: string;
}

function AgentDetailSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border/60 bg-card flex items-center px-4 gap-3">
        <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
        <span className="text-border/60">/</span>
        <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
      </div>
      {/* Canvas skeleton */}
      <div className="flex flex-1 min-h-0">
        <div className="w-52 border-r border-border/60 bg-card" />
        <div className="flex-1 bg-background" />
      </div>
    </div>
  );
}

export function AgentDetail({ agentId }: Props) {
  const { data: agent, isLoading, isError } = useAgent(agentId);

  if (isLoading) return <AgentDetailSkeleton />;

  if (isError || !agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  return <GraphEditor agent={agent} />;
}
