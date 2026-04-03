"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Bot, User, Loader2, RotateCcw, Check, XCircle } from "lucide-react";
import { chatApi, type ChatMessage } from "../../api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface HumanReviewPayload {
  message: string;
  context?: string | null;
}

interface Props {
  agentId: string;
  onClose: () => void;
}

export function ChatTestPanel({ agentId, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<HumanReviewPayload | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!starting && !loading && !sessionEnded && !pendingReview) {
      inputRef.current?.focus();
    }
  }, [starting, loading, sessionEnded, pendingReview]);

  async function startSession() {
    setStarting(true);
    setError(null);
    setMessages([]);
    setSessionId(null);
    setSessionEnded(false);
    setPendingReview(null);
    try {
      const res = await chatApi.start(agentId);
      setSessionId(res.session_id);
      setMessages(res.messages);
      setSessionEnded(res.session_ended);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(message?: string) {
    const text = (message ?? input).trim();
    if (!text || !sessionId || loading || sessionEnded) return;

    if (!message) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);
    setPendingReview(null);

    // Placeholder for the streaming agent message
    const streamingIndex = messages.length + 1; // +1 for the user message we just added
    setMessages((prev) => [...prev, { role: "agent", content: "" }]);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${BASE_URL}/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSseEvent(event, streamingIndex);
          } catch {
            // malformed JSON — skip
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
      // Remove the empty streaming placeholder on error
      setMessages((prev) => prev.filter((_, i) => i !== streamingIndex));
    } finally {
      setLoading(false);
    }
  }

  function handleSseEvent(event: Record<string, unknown>, streamingIndex: number) {
    const type = event.type as string;

    if (type === "token") {
      const content = event.content as string;
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === streamingIndex ? { ...msg, content: msg.content + content } : msg,
        ),
      );
    } else if (type === "human_review") {
      // Remove empty placeholder, show approve/reject UI instead
      setMessages((prev) => prev.filter((_, i) => i !== streamingIndex));
      setPendingReview({
        message: (event.message as string) ?? "Please review and approve.",
        context: (event.context as string | null) ?? null,
      });
    } else if (type === "ended") {
      const ended = event.session_ended as boolean;
      setSessionEnded(ended);
      // Remove empty streaming placeholder if no tokens were streamed
      setMessages((prev) =>
        prev.filter((msg, i) => !(i === streamingIndex && msg.content === "")),
      );
    } else if (type === "error") {
      setError((event.message as string) ?? "Something went wrong");
      setMessages((prev) => prev.filter((_, i) => i !== streamingIndex));
    }
  }

  async function handleApprove() {
    await sendMessage("approve");
  }

  async function handleReject() {
    await sendMessage("reject");
  }

  return (
    <div className="w-80 h-full border-l border-border/60 bg-card flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-semibold">Test Chat</span>
          {sessionEnded && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Ended
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={startSession}
            title="Restart session"
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {starting ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Starting session…
            </div>
          </div>
        ) : messages.length === 0 && !error && !pendingReview ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user" ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-2.5 w-2.5 text-primary" />
                  ) : (
                    <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                  {/* Blinking cursor while streaming */}
                  {loading && i === messages.length - 1 && msg.role === "agent" && (
                    <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            ))}

            {/* Human Review approval card */}
            {pendingReview && !loading && (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <Bot className="h-2.5 w-2.5 text-yellow-600" />
                  </div>
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    Approval required
                  </p>
                </div>
                <p className="text-xs text-foreground">{pendingReview.message}</p>
                {pendingReview.context && (
                  <div className="rounded bg-muted px-2.5 py-1.5 text-xs font-mono text-muted-foreground break-all">
                    {pendingReview.context}
                  </div>
                )}
                <div className="flex gap-2 pt-0.5">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 h-7 rounded-md bg-green-600 text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 h-7 rounded-md bg-red-600 text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {loading && messages[messages.length - 1]?.role !== "agent" && (
              <div className="flex gap-2 flex-row">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {sessionEnded && (
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Session ended
                </span>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="text-[10px] text-destructive bg-destructive/10 rounded px-2 py-1.5">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/60 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              pendingReview
                ? "Use Approve / Reject above"
                : sessionEnded
                  ? "Session ended"
                  : "Type a message…"
            }
            disabled={starting || sessionEnded || !!pendingReview}
            className="flex-1 h-8 rounded-md border border-border/60 bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || starting || sessionEnded || !!pendingReview}
            className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
