"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentFlowNode, NodeType } from "../../../utils/graph-transform";
import { NODE_LABELS } from "../../../utils/graph-transform";

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  allNodes: AgentFlowNode[];
  currentNodeId: string;
}

export function GotoForm({ config, onChange, allNodes, currentNodeId }: Props) {
  // Only show real agent nodes as jump targets (not groups, not other goto nodes, not self)
  const targetOptions = allNodes.filter(
    (n) => n.type !== "groupNode" && n.type !== "gotoNode" && n.id !== currentNodeId,
  );

  const currentTarget = config.target as string | undefined;
  const currentTargetNode = targetOptions.find((n) => n.id === currentTarget);
  const currentTargetLabel = currentTargetNode
    ? currentTargetNode.data.label || NODE_LABELS[currentTargetNode.data.nodeType as NodeType]
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Jump to node</Label>
        <Select
          value={currentTarget ?? ""}
          onValueChange={(value) => onChange({ ...config, target: value })}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue placeholder="Select a node…" />
          </SelectTrigger>
          <SelectContent>
            {targetOptions.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.data.label || NODE_LABELS[n.data.nodeType as NodeType] || n.data.nodeType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          When execution reaches this point, it jumps to the selected node.
        </p>
      </div>

      {currentTargetLabel && (
        <div className="rounded-lg bg-indigo-500/8 border border-indigo-500/20 px-3 py-2">
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
            Flow will jump to{" "}
            <span className="font-semibold">{currentTargetLabel}</span>{" "}
            when this node is reached.
          </p>
        </div>
      )}
    </div>
  );
}
