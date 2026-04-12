"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  ParticipantEvent,
  type Participant,
  type RemoteTrack,
} from "livekit-client";
import { X, Mic, MicOff, Loader2, PhoneOff, Bot, User, Volume2 } from "lucide-react";
import { agentsApi } from "../../api";

type Status = "idle" | "connecting" | "waiting" | "ready" | "ended" | "error";

interface TranscriptLine {
  id: string;
  role: "agent" | "user";
  text: string;
}

interface Props {
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VoicePreviewPanel({ agentId, isOpen, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);

  const roomRef = useRef<Room | null>(null);
  const hasStarted = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Keep audio elements alive for the session lifetime
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  const addTranscriptLine = useCallback((role: "agent" | "user", text: string) => {
    if (!text.trim()) return;
    setTranscript((prev) => {
      // Merge consecutive messages from the same role (streaming tokens)
      const last = prev[prev.length - 1];
      if (last?.role === role) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: `${Date.now()}-${Math.random()}`, role, text }];
    });
  }, []);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    audioElementsRef.current.forEach((el) => {
      el.pause();
      el.remove();
    });
    audioElementsRef.current = [];
    setStatus("ended");
    setAgentSpeaking(false);
    setUserSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setTranscript([]);

    let preview;
    try {
      preview = await agentsApi.startVoicePreview(agentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start voice preview");
      setStatus("error");
      return;
    }

    const room = new Room({
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    // ── Agent audio tracks ────────────────────────────────────────────────────
    const handleTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return;
      const el = track.attach() as HTMLAudioElement;
      el.autoplay = true;
      el.style.display = "none";
      document.body.appendChild(el);
      audioElementsRef.current.push(el);
    };

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return;
      track.detach();
    };

    // ── Speaking detection ────────────────────────────────────────────────────
    const handleActiveSpeakerChange = (speakers: Participant[]) => {
      setAgentSpeaking(speakers.length > 0);
    };

    // ── Transcription (agent sends data messages) ─────────────────────────────
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text) as { type?: string; role?: string; text?: string; delta?: string };
        if (msg.type === "transcript" || msg.type === "transcription") {
          const role = (msg.role === "user" ? "user" : "agent") as "agent" | "user";
          addTranscriptLine(role, msg.text ?? msg.delta ?? "");
        }
      } catch {
        // non-JSON data messages — ignore
      }
    };

    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
      .on(RoomEvent.DataReceived, handleData)
      .on(RoomEvent.ParticipantConnected, () => {
        // Worker joined — agent is starting
        setStatus("ready");
      })
      .on(RoomEvent.Disconnected, () => {
        setStatus("ended");
        setAgentSpeaking(false);
        setUserSpeaking(false);
      });

    // ── Local participant speaking indicator ──────────────────────────────────
    room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, (speaking: boolean) => {
      setUserSpeaking(speaking);
    });

    try {
      await room.connect(preview.livekit_url, preview.token);
      setStatus("waiting"); // connected to room, waiting for worker to join
      // Enable mic (unmuted by default)
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect to room");
      setStatus("error");
      room.disconnect();
      roomRef.current = null;
    }
  }, [agentId, addTranscriptLine]);

  // Start when panel opens (once per panel instance)
  useEffect(() => {
    if (isOpen && !hasStarted.current) {
      hasStarted.current = true;
      connect();
    }
    return () => {
      if (!isOpen && roomRef.current) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Scroll transcript to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  async function toggleMute() {
    if (!roomRef.current) return;
    const enabled = !isMuted;
    setIsMuted(!enabled);
    await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
  }

  function handleClose() {
    disconnect();
    onClose();
  }

  const statusConfig: Record<Status, { dot: string; label: string }> = {
    idle:       { dot: "bg-muted-foreground", label: "Not started" },
    connecting: { dot: "bg-amber-500 animate-pulse", label: "Connecting…" },
    waiting:    { dot: "bg-amber-500 animate-pulse", label: "Waiting for agent…" },
    ready:      { dot: "bg-green-500", label: "Connected" },
    ended:      { dot: "bg-muted-foreground", label: "Session ended" },
    error:      { dot: "bg-destructive", label: "Error" },
  };
  const { dot, label } = statusConfig[status];

  return (
    <div className="w-80 h-full border-l border-border/60 bg-card flex flex-col shadow-xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
            <Volume2 className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-semibold">Test Voice</span>
          {/* Status dot */}
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Mic + agent speaking — fixed height */}
        <div className="flex flex-col items-center justify-center gap-5 py-7 shrink-0">
          {/* Agent speaking orb */}
          <div className="relative flex items-center justify-center h-16 w-16">
            {agentSpeaking && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <span className="absolute inset-1 rounded-full bg-primary/15 animate-ping [animation-delay:150ms]" />
              </>
            )}
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                agentSpeaking ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Bot className="h-5 w-5" />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {agentSpeaking
              ? "Agent is speaking…"
              : status === "waiting"
              ? "Waiting for agent to join…"
              : status === "connecting"
              ? "Connecting…"
              : status === "error"
              ? error
              : status === "ended"
              ? "Session ended"
              : "Agent is listening"}
          </p>

          {/* Mic button */}
          {(status === "ready" || status === "waiting") && (
            <div className="relative flex items-center justify-center h-16 w-16">
              {userSpeaking && !isMuted && (
                <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
              )}
              <button
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          )}

          {status === "connecting" && (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          )}

          {/* Disconnect */}
          {(status === "ready" || status === "waiting") && (
            <button
              onClick={disconnect}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <PhoneOff className="h-3 w-3" />
              End call
            </button>
          )}

          {/* Retry */}
          {(status === "error" || status === "ended") && (
            <button
              onClick={() => {
                hasStarted.current = false;
                connect();
              }}
              className="text-[11px] text-primary hover:underline"
            >
              Start new session
            </button>
          )}
        </div>

        {/* ── Transcript ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 border-t border-border/60">
          {transcript.length === 0 ? (
            <p className="text-center text-[10px] text-muted-foreground pt-4">
              Transcript will appear here
            </p>
          ) : (
            transcript.map((line) => (
              <div
                key={line.id}
                className={`flex gap-2 pt-2 ${line.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    line.role === "user" ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {line.role === "user" ? (
                    <User className="h-2.5 w-2.5 text-primary" />
                  ) : (
                    <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    line.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {line.text}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
