"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { useAddPhoneNumber } from "@/features/voice/hooks/use-phone-numbers";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddPhoneNumberDialog({ open, onClose }: Props) {
  const [number, setNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [provider, setProvider] = useState("twilio");

  const { data: agents = [] } = useAgents();
  const addNumber = useAddPhoneNumber();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addNumber.mutate(
      { agent_id: agentId, number, provider },
      {
        onSuccess: () => {
          setNumber("");
          setAgentId("");
          setProvider("twilio");
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Phone Number</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="number">Phone Number</Label>
            <Input
              id="number"
              placeholder="+14155551234"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">E.164 format — include country code</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent">Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger id="agent" className="w-full">
                <SelectValue placeholder="Select agent…" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="vonage">Vonage</SelectItem>
                <SelectItem value="telnyx">Telnyx</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!number || !agentId || addNumber.isPending}
              className="w-full"
            >
              {addNumber.isPending ? "Adding…" : "Add Number"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
