"use client";

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AgentFlowNode, NodeType } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES } from "../../utils/graph-transform";
import { GROUP_COLORS } from "./group-node";
import {
  GotoForm,
  LlmResponseForm,
  ConditionForm,
  HumanReviewForm,
  CollectDataForm,
  SetVariableForm,
  HttpRequestForm,
  RunToolForm,
  TransferHumanForm,
  EndSessionForm,
  RagSearchForm,
  PostSessionActionForm,
} from "./config-forms";

interface Props {
  node: AgentFlowNode;
  allNodes: AgentFlowNode[];
  onUpdate: (nodeId: string, config: Record<string, unknown>) => void;
  onUpdateLabel: (nodeId: string, label: string) => void;
  onClose: () => void;
  onUpdateGotoTarget?: (nodeId: string, target: string) => void;
}

// Extract all {{collected.X}} variable names from collect_data nodes in the graph
function getCollectedVariables(allNodes: AgentFlowNode[]): string[] {
  const vars: string[] = [];
  for (const n of allNodes) {
    if (n.data.nodeType === "collect_data") {
      const fields = n.data.config.fields as Array<{ name: string }> | undefined;
      if (fields) {
        for (const f of fields) {
          if (f.name) vars.push(f.name);
        }
      }
    }
  }
  return vars;
}

// Extract saved response variable names from run_tool / http_request nodes
function getSavedResponseVariables(allNodes: AgentFlowNode[]): string[] {
  const vars: string[] = [];
  for (const n of allNodes) {
    if (n.data.nodeType === "run_tool" || n.data.nodeType === "http_request") {
      const key = n.data.config.save_response_to as string | undefined;
      if (key) vars.push(key);
    }
  }
  return vars;
}

export function NodeConfigPanel({ node, allNodes, onUpdate, onUpdateLabel, onClose }: Props) {
  const nodeType = node.data.nodeType as NodeType;
  const isGroup = node.type === "groupNode";
  const isGoto = node.type === "gotoNode";
  const colors = NODE_COLOR_CLASSES[nodeType] ?? NODE_COLOR_CLASSES.group;
  const collectedVars = getCollectedVariables(allNodes);
  const savedVars = getSavedResponseVariables(allNodes);

  function handleChange(config: Record<string, unknown>) {
    onUpdate(node.id, config);
  }

  const formProps = {
    config: node.data.config,
    onChange: handleChange,
    collectedVariables: collectedVars,
    savedVariables: savedVars,
  };

  return (
    <div className="w-72 h-full border-l border-border/60 bg-card flex flex-col overflow-hidden shadow-xl">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-5 w-5 rounded ${colors.bg} flex items-center justify-center shrink-0`}>
            <span className={`text-[9px] font-bold ${colors.icon}`}>
              {NODE_LABELS[nodeType][0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground font-mono">{nodeType}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editable node name */}
      <div className="px-4 py-2 border-b border-border/60 shrink-0">
        <Input
          value={node.data.label ?? NODE_LABELS[nodeType]}
          onChange={(e) => onUpdateLabel(node.id, e.target.value)}
          className="h-7 text-xs font-medium"
          placeholder="Node name…"
        />
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Group color picker */}
        {isGroup && (
          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-1.5 flex-wrap">
              {GROUP_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onUpdate(node.id, { ...node.data.config, colorIndex: i })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    (node.data.colorIndex ?? 0) === i ? "border-foreground scale-110" : "border-transparent"
                  } ${c.bg.replace("/5", "/30")} ${c.border}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        )}


        {isGoto && (
          <GotoForm
            config={node.data.config}
            onChange={handleChange}
            allNodes={allNodes}
            currentNodeId={node.id}
          />
        )}
        {!isGroup && !isGoto && nodeType === "llm_response" && <LlmResponseForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "condition" && <ConditionForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "human_review" && <HumanReviewForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "collect_data" && <CollectDataForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "set_variable" && <SetVariableForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "http_request" && <HttpRequestForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "run_tool" && <RunToolForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "transfer_human" && <TransferHumanForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "end_session" && <EndSessionForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "rag_search" && <RagSearchForm {...formProps} />}
        {!isGroup && !isGoto && nodeType === "post_session_action" && <PostSessionActionForm {...formProps} />}
      </div>
    </div>
  );
}
