"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Bot, User, Loader2, RotateCcw } from "lucide-react";
import { chatApi, type ChatMessage } from "../../api";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!starting && !loading && !sessionEnded) {
      inputRef.current?.focus();
    }
  }, [starting, loading, sessionEnded]);

  async function startSession() {
    setStarting(true);
    setError(null);
    setMessages([]);
    setSessionId(null);
    setSessionEnded(false);
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

  async function sendMessage() {
    const text = input.trim();
    if (!text || !sessionId || loading || sessionEnded) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await chatApi.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, ...res.messages]);
      setSessionEnded(res.session_ended);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
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
        ) : messages.length === 0 && !error ? (
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
                    msg.role === "user"
                      ? "bg-primary/10"
                      : "bg-muted"
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
                </div>
              </div>
            ))}

            {loading && (
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
            placeholder={sessionEnded ? "Session ended" : "Type a message…"}
            disabled={starting || sessionEnded}
            className="flex-1 h-8 rounded-md border border-border/60 bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || starting || sessionEnded}
            className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
