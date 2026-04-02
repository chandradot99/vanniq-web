"use client";

import Link from "next/link";
import { Bot, Trash2 } from "lucide-react";
import type { Agent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteAgent } from "../hooks/use-agents";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const deleteMutation = useDeleteAgent();

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group relative rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 block"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon + name */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {agent.simple_mode ? "Simple mode" : "Advanced"} &middot; {agent.language.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Delete — shows on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteMutation.mutate(agent.id);
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* System prompt preview */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-3 min-h-[2.5rem]">
        {agent.system_prompt || "No system prompt configured"}
      </p>

      {/* Footer badges */}
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/40">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
          {agent.language.toUpperCase()}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
          {agent.simple_mode ? "Simple" : "Advanced"}
        </Badge>
      </div>
    </Link>
  );
}
