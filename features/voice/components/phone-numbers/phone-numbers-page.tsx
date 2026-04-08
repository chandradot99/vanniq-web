"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneNumbersList } from "./phone-numbers-list";
import { AddPhoneNumberDialog } from "./add-phone-number-dialog";

export function PhoneNumbersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div>
          <h1 className="text-base font-semibold">Phone Numbers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All numbers across your org — click an agent to jump to its settings, hover a card to reassign or remove
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-4 mr-1.5" />
          Add Number
        </Button>
      </div>

      <div className="p-6">
        <PhoneNumbersList />
      </div>

      <AddPhoneNumberDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
