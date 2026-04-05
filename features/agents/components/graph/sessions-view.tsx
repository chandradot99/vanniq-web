"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Wrench,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { useAgentSessions, useSession, useSessionTimeline } from "../../hooks/use-agents";
import { ExecutionGraphView } from "./execution-graph-view";
import type { SessionSummary, ToolCallDetail, Agent, TranscriptMessage } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── Session list item ─────────────────────────────────────────────────────────

function SessionRow({
  session,
  selected,
  onClick,
}: {
  session: SessionSummary;
  selected: boolean;
  onClick: () => void;
}) {
  const ended = session.status === "ended";
  const failed = ended && session.had_error;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-accent/50 transition-colors ${
        selected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {failed ? (
            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          ) : ended ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
          )}
          <span className="text-xs font-mono text-muted-foreground truncate">
            {session.id.slice(0, 8)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {relativeTime(session.created_at)}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {session.message_count}
        </span>
        {session.tool_call_count > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {session.tool_call_count}
          </span>
        )}
        {session.duration_seconds != null && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(session.duration_seconds)}
          </span>
        )}
        {session.sentiment && (
          <span
            className={`text-xs ${
              session.sentiment === "positive"
                ? "text-emerald-500"
                : session.sentiment === "negative"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {session.sentiment}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Tool call card ────────────────────────────────────────────────────────────

function ToolCallCard({ tc }: { tc: ToolCallDetail }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-mono font-medium">{tc.tool_name}</span>
        <span
          className={`ml-auto shrink-0 ${tc.success ? "text-emerald-500" : "text-red-500"}`}
        >
          {tc.success ? "success" : "error"}
        </span>
      </button>
      {expanded && (
        <div className="divide-y divide-border">
          <div className="px-3 py-2 space-y-1">
            <p className="text-muted-foreground font-medium uppercase tracking-wide text-[10px]">Input</p>
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-foreground">
              {JSON.stringify(tc.input, null, 2)}
            </pre>
          </div>
          <div className="px-3 py-2 space-y-1">
            <p className="text-muted-foreground font-medium uppercase tracking-wide text-[10px]">Output</p>
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-foreground">
              {JSON.stringify(tc.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Execution graph tab ───────────────────────────────────────────────────────

function ExecutionTab({ sessionId, graphConfig, sessionStatus, transcript }: {
  sessionId: string;
  graphConfig: Agent["graph_config"];
  sessionStatus: "active" | "ended";
  transcript: TranscriptMessage[];
}) {
  const { data: timeline, isLoading } = useSessionTimeline(sessionId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-2 w-48">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!graphConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No graph config available.</p>
      </div>
    );
  }

  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">No execution data recorded.</p>
          <p className="text-xs text-muted-foreground">Events are captured from the next session onwards.</p>
        </div>
      </div>
    );
  }

  return (
    <ExecutionGraphView
      graphConfig={graphConfig}
      timeline={timeline}
      sessionStatus={sessionStatus}
      transcript={transcript}
    />
  );
}

// ── Session detail ────────────────────────────────────────────────────────────

type DetailTab = "transcript" | "execution";

function SessionDetailPanel({ sessionId, graphConfig }: { sessionId: string; graphConfig: Agent["graph_config"] }) {
  const { data: session, isLoading } = useSession(sessionId);
  const [activeTab, setActiveTab] = useState<DetailTab>("execution");

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!session) return null;

  const langsmithUrl = session.meta?.langsmith_url as string | undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Metadata bar */}
      <div className="px-5 py-2.5 border-b border-border/60 bg-card flex items-center gap-4 flex-wrap shrink-0">
        <span className="text-xs text-muted-foreground">
          {format(new Date(session.created_at), "MMM d, yyyy · HH:mm")}
        </span>
        {session.duration_seconds != null && (
          <span className="text-xs text-muted-foreground">
            Duration: {formatDuration(session.duration_seconds)}
          </span>
        )}
        {session.sentiment && (
          <span className="text-xs text-muted-foreground capitalize">
            Sentiment: {session.sentiment}
          </span>
        )}
        <span className={`text-xs ml-auto ${
          session.status === "ended" && session.meta?.failed
            ? "text-red-500"
            : session.status === "ended"
            ? "text-emerald-500"
            : "text-amber-500"
        }`}>
          {session.status === "ended" && session.meta?.failed ? "failed" : session.status}
        </span>
        {langsmithUrl && (
          <a
            href={langsmithUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View Trace
          </a>
        )}
      </div>

      {/* Sub-tabs: Execution | Transcript */}
      <div className="flex border-b border-border/60 shrink-0">
        {(["execution", "transcript"] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "execution" ? (
        <ExecutionTab
          sessionId={sessionId}
          graphConfig={graphConfig}
          sessionStatus={session.status}
          transcript={session.transcript}
        />
      ) : activeTab === "transcript" ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* Transcript */}
          <div className="space-y-3">
            {session.transcript.length === 0 ? (
              <p className="text-xs text-muted-foreground">No messages.</p>
            ) : (
              <div className="space-y-2">
                {session.transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool calls */}
          {session.tool_calls.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tool Calls ({session.tool_calls.length})
              </h3>
              <div className="space-y-2">
                {session.tool_calls.map((tc, i) => (
                  <ToolCallCard key={i} tc={tc} />
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {session.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{session.summary}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Main sessions view ────────────────────────────────────────────────────────

export function SessionsView({ agent }: { agent: Agent }) {
  const agentId = agent.id;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useAgentSessions(agentId);

  const sessions = data?.sessions ?? [];

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
          <p className="text-xs text-muted-foreground">
            Run a test chat to see executions here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Sessions list */}
      <div className="w-64 shrink-0 border-r border-border/60 overflow-y-auto">
        <div className="px-4 py-2.5 border-b border-border/60 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {data?.total ?? 0} Executions
          </span>
        </div>
        {sessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            selected={selectedId === s.id}
            onClick={() => setSelectedId(s.id)}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedId ? (
        <SessionDetailPanel sessionId={selectedId} graphConfig={agent.graph_config} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <p className="text-sm text-muted-foreground">Select a session to view details.</p>
        </div>
      )}
    </div>
  );
}
