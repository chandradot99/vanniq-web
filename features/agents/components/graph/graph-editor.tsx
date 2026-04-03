"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { Agent } from "@/types";
import { toFlowGraph, toGraphConfig, DEFAULT_NODE_CONFIGS } from "../../utils/graph-transform";
import type { AgentFlowNode, AgentFlowEdge, NodeType } from "../../utils/graph-transform";
import { useUpdateGraph } from "../../hooks/use-agents";
import { GraphEditorHeader } from "./graph-editor-header";
import { NodePalette } from "./node-palette";
import { NodeConfigPanel } from "./node-config-panel";
import { ChatTestPanel } from "./chat-test-panel";
import { AgentNode } from "./agent-node";

const nodeTypes: NodeTypes = { agentNode: AgentNode };

interface GraphEditorInnerProps {
  agent: Agent;
}

function GraphEditorInner({ agent }: GraphEditorInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const initialGraph = agent.graph_config
    ? toFlowGraph(agent.graph_config)
    : {
        nodes: [] as AgentFlowNode[],
        edges: [] as AgentFlowEdge[],
      };

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<AgentFlowNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<AgentFlowEdge>(initialGraph.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const updateGraphMutation = useUpdateGraph(agent.id);

  // Wrap base change handlers to mark dirty

  const onNodesChange = useCallback<typeof onNodesChangeBase>(
    (changes) => {
      onNodesChangeBase(changes);
      setIsDirty(true);
    },
    [onNodesChangeBase],
  );

  const onEdgesChange = useCallback<typeof onEdgesChangeBase>(
    (changes) => {
      onEdgesChangeBase(changes);
      setIsDirty(true);
    },
    [onEdgesChangeBase],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // sourceHandle is the route label on condition/human_review nodes.
      // Preserve it in edge data so toGraphConfig() can serialize it as `condition`.
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: nanoid(8),
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: connection.sourceHandle ?? undefined,
            data: connection.sourceHandle
              ? { condition: connection.sourceHandle }
              : undefined,
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/vaaniq-node-type") as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${nodeType}_${nanoid(6)}`;

      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "agentNode",
          position,
          data: {
            nodeType,
            config: { ...DEFAULT_NODE_CONFIGS[nodeType] },
            isEntryPoint: nds.length === 0, // first node becomes entry point
          },
        },
      ]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onNodesDelete = useCallback(
    (deleted: AgentFlowNode[]) => {
      const hasEntryPoint = deleted.some((n) => n.data.isEntryPoint);
      if (hasEntryPoint) {
        toast.error("Cannot delete the entry point node");
        // Restore deleted entry nodes
        setNodes((nds) => {
          const deletedIds = new Set(deleted.map((n) => n.id));
          const restored = deleted.filter((n) => n.data.isEntryPoint);
          return [...nds.filter((n) => !deletedIds.has(n.id)), ...restored];
        });
      }
    },
    [setNodes],
  );

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
      ),
    );
  }

  function validateGraph(): string | null {
    if (nodes.length === 0) return "Add at least one node before saving";
    const hasEntry = nodes.some((n) => n.data.isEntryPoint);
    if (!hasEntry) return "Set an entry point node (click ↑ on a node)";
    return null;
  }

  function handleSave() {
    const validationError = validateGraph();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const graphConfig = toGraphConfig(nodes, edges);
    updateGraphMutation.mutate(graphConfig, {
      onSuccess: () => setIsDirty(false),
    });
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="h-full flex flex-col">
      <GraphEditorHeader
        agent={agent}
        isDirty={isDirty}
        isSaving={updateGraphMutation.isPending}
        isChatOpen={isChatOpen}
        onSave={handleSave}
        onToggleChat={() => setIsChatOpen((o) => !o)}
      />

      <div className="flex flex-1 min-h-0">
        <NodePalette />

        <div className="relative flex-1 min-h-0">
          <div
            ref={reactFlowWrapper}
            className="w-full h-full"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodesDelete={onNodesDelete}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              deleteKeyCode={["Backspace", "Delete"]}
              className="bg-background"
            >
              <Background gap={20} size={1} className="opacity-30" />
              <Controls className="!border-border/60 !bg-card !shadow-none" />
              <MiniMap
                className="!border-border/60 !bg-card"
                nodeColor={(n) => {
                  const t = (n.data as { nodeType?: NodeType })?.nodeType;
                  return t ? `hsl(var(--primary))` : "#888";
                }}
              />
            </ReactFlow>
          </div>

          {selectedNode && (
            <div className="absolute right-0 top-0 h-full z-10">
              <NodeConfigPanel
                node={selectedNode as AgentFlowNode}
                onUpdate={updateNodeConfig}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          )}

          {isChatOpen && (
            <div className="absolute right-0 top-0 h-full z-20">
              <ChatTestPanel agentId={agent.id} onClose={() => setIsChatOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  agent: Agent;
}

export function GraphEditor({ agent }: Props) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner agent={agent} />
    </ReactFlowProvider>
  );
}
