"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useAddPhoneNumber } from "@/features/voice/hooks/use-phone-numbers";

interface Props {
  open: boolean;
  agentId: string;
  onClose: () => void;
}

export function ConnectNumberDialog({ open, agentId, onClose }: Props) {
  const [number, setNumber] = useState("");
  const [provider, setProvider] = useState("twilio");
  const [friendlyName, setFriendlyName] = useState("");

  const add = useAddPhoneNumber();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      {
        agent_id: agentId,
        number,
        provider,
        ...(friendlyName ? { friendly_name: friendlyName } : {}),
      } as Parameters<typeof add.mutate>[0],
      {
        onSuccess: () => {
          setNumber("");
          setProvider("twilio");
          setFriendlyName("");
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a Phone Number</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cn-number">Phone Number</Label>
            <Input
              id="cn-number"
              placeholder="+14155551234"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              E.164 format — e.g. +14155551234 or +919876543210
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cn-provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="cn-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="vonage">Vonage</SelectItem>
                <SelectItem value="telnyx">Telnyx</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cn-name">
              Friendly Name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="cn-name"
              placeholder="e.g. Sales Line India"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!number || add.isPending}
            >
              {add.isPending ? "Connecting…" : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
