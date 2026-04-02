"use client";

import { X } from "lucide-react";
import type { AgentFlowNode, NodeType } from "../../utils/graph-transform";
import { NODE_LABELS, NODE_COLOR_CLASSES } from "../../utils/graph-transform";
import {
  LlmResponseForm,
  ConditionForm,
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
  onUpdate: (nodeId: string, config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onClose }: Props) {
  const nodeType = node.data.nodeType as NodeType;
  const colors = NODE_COLOR_CLASSES[nodeType];

  function handleChange(config: Record<string, unknown>) {
    onUpdate(node.id, config);
  }

  const formProps = { config: node.data.config, onChange: handleChange };

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
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{NODE_LABELS[nodeType]}</p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">{node.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto p-4">
        {nodeType === "llm_response" && <LlmResponseForm {...formProps} />}
        {nodeType === "condition" && <ConditionForm {...formProps} />}
        {nodeType === "collect_data" && <CollectDataForm {...formProps} />}
        {nodeType === "set_variable" && <SetVariableForm {...formProps} />}
        {nodeType === "http_request" && <HttpRequestForm {...formProps} />}
        {nodeType === "run_tool" && <RunToolForm {...formProps} />}
        {nodeType === "transfer_human" && <TransferHumanForm {...formProps} />}
        {nodeType === "end_session" && <EndSessionForm {...formProps} />}
        {nodeType === "rag_search" && <RagSearchForm {...formProps} />}
        {nodeType === "post_session_action" && <PostSessionActionForm {...formProps} />}
      </div>
    </div>
  );
}
