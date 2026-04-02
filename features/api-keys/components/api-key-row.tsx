"use client";

import { CheckCircle, Trash2 } from "lucide-react";
import type { ApiKey } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceLabel } from "../constants";
import { useDeleteApiKey, useTestApiKey } from "../hooks/use-api-keys";

interface ApiKeyRowProps {
  apiKey: ApiKey;
}

export function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  const deleteMutation = useDeleteApiKey();
  const testMutation = useTestApiKey();

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{getServiceLabel(apiKey.service)}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {apiKey.key_hint}
            </Badge>
          </div>
          {apiKey.last_tested_at && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Verified {new Date(apiKey.last_tested_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testMutation.mutate(apiKey.id)}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? "Testing…" : "Test"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate(apiKey.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
