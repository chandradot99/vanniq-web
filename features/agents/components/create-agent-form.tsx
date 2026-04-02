"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAgent } from "../hooks/use-agents";
import type { Agent } from "@/types";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish (Hindi + English)" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
];

const INITIAL_FORM = { name: "", language: "en" };

export function CreateAgentForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);

  const createMutation = useCreateAgent({
    onSuccess: (agent: Agent) => router.push(`/agents/${agent.id}`),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ ...form, system_prompt: "", simple_mode: true });
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-lg mx-auto py-12 px-6">
        {/* Back link */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Agents
        </Link>

        {/* Page heading */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">New agent</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Give your agent a name to get started — you&apos;ll build its behavior in the visual editor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Agent name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Customer Support Bot"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
              >
                <SelectTrigger id="language" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Primary language your agent will speak
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Link href="/agents" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
            <Button type="submit" disabled={!form.name.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Continue to editor →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
