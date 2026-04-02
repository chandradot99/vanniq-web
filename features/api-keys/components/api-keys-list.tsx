"use client";

import { useState } from "react";
import { Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiKeys } from "../hooks/use-api-keys";
import { ApiKeyRow } from "./api-key-row";
import { AddKeyDialog } from "./add-key-dialog";

export function ApiKeysList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: keys = [], isLoading } = useApiKeys();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bring your own keys — stored encrypted, never exposed
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16 pt-4" />
            </Card>
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
            <ApiKeyRow key={key.id} apiKey={key} />
          ))}
        </div>
      )}

      <AddKeyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
