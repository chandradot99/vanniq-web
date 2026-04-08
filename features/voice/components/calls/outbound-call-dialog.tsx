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
import { usePhoneNumbers } from "@/features/voice/hooks/use-phone-numbers";
import { useInitiateOutbound } from "@/features/voice/hooks/use-voice-calls";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function OutboundCallDialog({ open, onClose }: Props) {
  const [agentId, setAgentId] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");

  const { data: agents = [] } = useAgents();
  const { data: allNumbers = [] } = usePhoneNumbers();
  const initiate = useInitiateOutbound();

  // Filter phone numbers to the selected agent
  const agentNumbers = allNumbers.filter((pn) => pn.agent_id === agentId);

  function handleAgentChange(id: string) {
    setAgentId(id);
    setFromNumber(""); // reset from_number when agent changes
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    initiate.mutate(
      { agent_id: agentId, from_number: fromNumber, to_number: toNumber },
      {
        onSuccess: () => {
          setAgentId("");
          setFromNumber("");
          setToNumber("");
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Outbound Call</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={handleAgentChange}>
              <SelectTrigger className="w-full">
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
            <Label>From Number</Label>
            <Select
              value={fromNumber}
              onValueChange={setFromNumber}
              disabled={!agentId || agentNumbers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !agentId
                      ? "Select an agent first"
                      : agentNumbers.length === 0
                      ? "No numbers for this agent"
                      : "Select number…"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {agentNumbers.map((pn) => (
                  <SelectItem key={pn.id} value={pn.number}>
                    {pn.number}
                    {pn.friendly_name && ` (${pn.friendly_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="to">To Number</Label>
            <Input
              id="to"
              placeholder="+919876543210"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">E.164 format — include country code</p>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!agentId || !fromNumber || !toNumber || initiate.isPending}
              className="w-full"
            >
              {initiate.isPending ? "Dialling…" : "Call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
