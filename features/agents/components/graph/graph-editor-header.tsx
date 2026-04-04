"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, MessageSquare, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Agent } from "@/types";
import { useUpdateAgent } from "../../hooks/use-agents";

type ActiveTab = "builder" | "sessions";

interface Props {
  agent: Agent;
  isDirty: boolean;
  isSaving: boolean;
  isChatOpen: boolean;
  activeTab: ActiveTab;
  onSave: () => void;
  onToggleChat: () => void;
  onTabChange: (tab: ActiveTab) => void;
}

export function GraphEditorHeader({ agent, isDirty, isSaving, isChatOpen, activeTab, onSave, onToggleChat, onTabChange }: Props) {
  const [editValue, setEditValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const updateAgent = useUpdateAgent(agent.id);

  function startEditing() {
    setEditValue(agent.name);
    setIsEditing(true);
  }

  function handleNameBlur() {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== agent.name) {
      updateAgent.mutate({ name: trimmed });
    }
  }

  return (
    <div className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Agents
        </Link>

        <span className="text-border/60">/</span>

        {isEditing ? (
          <Input
            value={editValue}
            autoFocus
            className="h-7 text-sm font-medium w-48"
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setIsEditing(false);
            }}
          />
        ) : (
          <button
            onClick={startEditing}
            className="text-sm font-semibold hover:text-primary transition-colors truncate max-w-xs"
            title="Click to rename"
          >
            {agent.name}
          </button>
        )}

      </div>

      {/* Tabs */}
      <div className="flex items-center border border-border rounded-md overflow-hidden">
        <button
          onClick={() => onTabChange("builder")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "builder"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          Builder
        </button>
        <button
          onClick={() => onTabChange("sessions")}
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "sessions"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Bug className="h-3 w-3" />
          Sessions
        </button>
      </div>

      <div className="flex items-center gap-2">
        {activeTab === "builder" && isDirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        {activeTab === "builder" && (
          <>
            <Button
              size="sm"
              variant={isChatOpen ? "default" : "outline"}
              onClick={onToggleChat}
              className="h-8"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Test Chat
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className="h-8"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
