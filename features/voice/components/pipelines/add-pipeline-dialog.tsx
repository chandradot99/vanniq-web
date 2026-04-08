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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/features/agents/hooks/use-agents";
import { useAddPhoneNumber, useTwilioNumbers } from "@/features/voice/hooks/use-phone-numbers";
import type { TwilioAvailableNumber } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddPipelineDialog({ open, onClose }: Props) {
  const [selectedNumber, setSelectedNumber] = useState<TwilioAvailableNumber | null>(null);
  const [agentId, setAgentId] = useState("");

  const { data: agents = [] } = useAgents();
  const { data: twilioNumbers = [], isLoading: loadingNumbers, error: numbersError } = useTwilioNumbers();
  const addNumber = useAddPhoneNumber();

  const availableNumbers = twilioNumbers.filter((n) => !n.already_imported);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNumber) return;
    addNumber.mutate(
      {
        agent_id: agentId,
        number: selectedNumber.number,
        provider: "twilio",
        sid: selectedNumber.sid,
        friendly_name: selectedNumber.friendly_name || undefined,
      },
      {
        onSuccess: () => {
          setSelectedNumber(null);
          setAgentId("");
          onClose();
        },
      }
    );
  }

  function handleClose() {
    setSelectedNumber(null);
    setAgentId("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Voice Pipeline</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="number">Phone Number</Label>

            {numbersError ? (
              <p className="text-sm text-destructive">
                Could not load Twilio numbers. Add a Twilio integration first.
              </p>
            ) : (
              <Select
                value={selectedNumber?.number ?? ""}
                onValueChange={(val) => {
                  const found = twilioNumbers.find((n) => n.number === val) ?? null;
                  setSelectedNumber(found);
                }}
                disabled={loadingNumbers}
              >
                <SelectTrigger id="number" className="w-full">
                  <SelectValue
                    placeholder={
                      loadingNumbers
                        ? "Loading your Twilio numbers…"
                        : availableNumbers.length === 0
                        ? "No available numbers"
                        : "Select a number…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableNumbers.map((n) => (
                    <SelectItem key={n.number} value={n.number}>
                      <span className="font-mono">{n.number}</span>
                      {n.friendly_name && (
                        <span className="ml-2 text-muted-foreground text-xs">
                          {n.friendly_name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                  {twilioNumbers.some((n) => n.already_imported) && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
                        Already imported
                      </div>
                      {twilioNumbers
                        .filter((n) => n.already_imported)
                        .map((n) => (
                          <SelectItem key={n.number} value={n.number} disabled>
                            <span className="font-mono opacity-50">{n.number}</span>
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Numbers purchased in your Twilio account
            </p>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedNumber || !agentId || addNumber.isPending}
            >
              {addNumber.isPending ? "Adding…" : "Add Pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
