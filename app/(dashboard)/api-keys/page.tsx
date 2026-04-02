"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle, XCircle, Key } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { ApiKey, TestApiKeyResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "groq", label: "Groq" },
  { value: "elevenlabs", label: "ElevenLabs (TTS)" },
  { value: "deepgram", label: "Deepgram (STT)" },
  { value: "sarvam", label: "Sarvam AI (Indian languages)" },
  { value: "twilio", label: "Twilio" },
  { value: "gupshup", label: "Gupshup (WhatsApp)" },
  { value: "pinecone", label: "Pinecone" },
  { value: "cartesia", label: "Cartesia" },
];

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ service: "", key: "" });
  const [testing, setTesting] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => api.get("/v1/api-keys"),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<ApiKey>("/v1/api-keys", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setOpen(false);
      setForm({ service: "", key: "" });
      toast.success("API key saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save key"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/api-keys/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key removed");
    },
  });

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const res = await api.post<TestApiKeyResponse>(`/v1/api-keys/${id}/test`);
      if (res.valid) {
        toast.success(res.tested ? "Key is valid ✓" : "Key saved (live test not supported for this provider)");
      } else {
        toast.error(`Key invalid: ${res.error}`);
      }
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(null);
    }
  }

  const serviceLabel = (value: string) =>
    SERVICES.find((s) => s.value === value)?.label ?? value;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bring your own keys — stored encrypted, never exposed
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-16 pt-4" /></Card>
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm">Add your OpenAI or Anthropic key to run agents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{serviceLabel(key.service)}</span>
                    <Badge variant="outline" className="font-mono text-xs">{key.key_hint}</Badge>
                  </div>
                  {key.last_tested_at && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Verified {new Date(key.last_tested_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(key.id)}
                    disabled={testing === key.id}
                  >
                    {testing === key.id ? "Testing…" : "Test"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={form.service} onValueChange={(v) => setForm((f) => ({ ...f, service: v ?? "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider…" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.service || !form.key.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
