"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  useUpdateNodeInternals,
  MarkerType,
  ConnectionLineType,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { Agent } from "@/types";
import { toFlowGraph, toGraphConfig, DEFAULT_NODE_CONFIGS, NODE_LABELS } from "../../utils/graph-transform";
import type { AgentFlowNode, AgentFlowEdge, NodeType } from "../../utils/graph-transform";
import { useUpdateGraph } from "../../hooks/use-agents";
import { useTools } from "@/features/integrations/hooks/use-integrations";

import { ToolSchemasContext } from "./tool-schemas-context";
import { GraphEditorHeader } from "./graph-editor-header";
import { NodePalette } from "./node-palette";
import { NodeConfigPanel } from "./node-config-panel";
import { ChatTestPanel } from "./chat-test-panel";
import { SessionsView } from "./sessions-view";
import { AgentNode } from "./agent-node";
import { GotoNode } from "./goto-node";
import { GroupNode } from "./group-node";

const nodeTypes: NodeTypes = { agentNode: AgentNode, groupNode: GroupNode, gotoNode: GotoNode };
const edgeTypes: EdgeTypes = {};

interface GraphEditorInnerProps {
  agent: Agent;
}

function GraphEditorInner({ agent }: GraphEditorInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getIntersectingNodes, getViewport, deleteElements } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

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
  const [activeTab, setActiveTab] = useState<"builder" | "sessions">("builder");

  const updateGraphMutation = useUpdateGraph(agent.id);
  const { data: toolSchemas = [] } = useTools();

  // Warn before reload/close if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Wrap base change handlers to mark dirty

  const onNodesChange = useCallback<typeof onNodesChangeBase>(
    (changes) => {
      onNodesChangeBase(changes);
      // "select" and "dimensions" are UI-only — not real graph edits
      if (changes.some((c) => c.type !== "select" && c.type !== "dimensions")) {
        setIsDirty(true);
      }
    },
    [onNodesChangeBase],
  );

  const onEdgesChange = useCallback<typeof onEdgesChangeBase>(
    (changes) => {
      onEdgesChangeBase(changes);
      // "select" is UI-only — not a real graph edit
      if (changes.some((c) => c.type !== "select")) {
        setIsDirty(true);
      }
    },
    [onEdgesChangeBase],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Backward connection (target is to the left of source) → create a goto node
      // instead of a crossing line. The goto node serializes back to a goto edge.
      const isBackward =
        sourceNode && targetNode && targetNode.type !== "gotoNode" &&
        targetNode.position.x < sourceNode.position.x;

      if (isBackward && sourceNode && targetNode) {
        const gotoId = `goto_${nanoid(6)}`;
        // Position the goto node to the right of the source (absolute coords)
        const sourceParent = sourceNode.parentId
          ? nodes.find((n) => n.id === sourceNode.parentId)
          : null;
        const absX = sourceNode.position.x + (sourceParent?.position.x ?? 0);
        const absY = sourceNode.position.y + (sourceParent?.position.y ?? 0);

        setNodes((nds) => [
          ...nds,
          {
            id: gotoId,
            type: "gotoNode",
            position: { x: absX + ((sourceNode.measured?.width as number) ?? 224) + 50, y: absY },
            data: {
              nodeType: "goto",
              label: "Go To",
              config: { target: connection.target },
              isEntryPoint: false,
            },
          },
        ]);

        setEdges((eds) =>
          addEdge(
            {
              source: connection.source,
              sourceHandle: connection.sourceHandle ?? undefined,
              target: gotoId,
              id: nanoid(8),
              type: "default",
              markerEnd: { type: MarkerType.ArrowClosed },
              label: connection.sourceHandle ?? undefined,
              data: connection.sourceHandle ? { condition: connection.sourceHandle } : undefined,
            },
            eds,
          ),
        );
        return;
      }

      // Normal forward edge — explicitly pick fields so targetHandle: null from
      // the Connection object is never forwarded (React Flow treats null as "null" string)
      setEdges((eds) =>
        addEdge(
          {
            source: connection.source,
            sourceHandle: connection.sourceHandle ?? undefined,
            target: connection.target,
            id: nanoid(8),
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: connection.sourceHandle ?? undefined,
            data: connection.sourceHandle ? { condition: connection.sourceHandle } : undefined,
          },
          eds,
        ),
      );
    },
    [setEdges, setNodes, nodes],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/vaaniq-node-type") as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${nodeType}_${nanoid(6)}`;

      if (nodeType === "group") {
        // Groups are placed behind other nodes with a default size
        setNodes((nds) => [
          {
            id,
            type: "groupNode",
            position,
            style: { width: 420, height: 260 },
            data: { nodeType: "group", label: "Group", colorIndex: 0, config: {}, isEntryPoint: false },
          },
          ...nds, // group goes first so it renders beneath existing nodes
        ]);
        return;
      }

      if (nodeType === "goto") {
        setNodes((nds) => [
          ...nds,
          {
            id,
            type: "gotoNode",
            position,
            data: {
              nodeType: "goto",
              label: "Go To",
              config: { target: "" },
              isEntryPoint: false,
            },
          },
        ]);
        return;
      }

      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "agentNode",
          position,
          data: {
            nodeType,
            label: NODE_LABELS[nodeType],
            config: { ...DEFAULT_NODE_CONFIGS[nodeType] },
            isEntryPoint: nds.filter((n) => n.type !== "groupNode" && n.type !== "gotoNode").length === 0,
          },
        },
      ]);
    },
    [screenToFlowPosition, setNodes],
  );

  // When a node is dropped, check if it landed inside a group and set parentId.
  // node.position is RELATIVE to its current parent (if any), ABSOLUTE if unparented.
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: AgentFlowNode) => {
      if (node.type === "groupNode" || node.type === "gotoNode") return;

      const intersecting = getIntersectingNodes(node).filter((n) => n.type === "groupNode");
      const targetGroup = intersecting[0] ?? null;

      // No group change — nothing to do (onNodesChange already updated position)
      if (targetGroup?.id === node.parentId) return;
      if (!targetGroup && !node.parentId) return;

      setNodes((nds) => {
        const currentParent = node.parentId
          ? nds.find((n) => n.id === node.parentId)
          : null;

        // Convert node.position to absolute canvas coordinates
        const absX = node.position.x + (currentParent?.position.x ?? 0);
        const absY = node.position.y + (currentParent?.position.y ?? 0);

        return nds.map((n) => {
          if (n.id !== node.id) return n;

          if (targetGroup) {
            // Entering a group — position becomes relative to the group
            return {
              ...n,
              parentId: targetGroup.id,
              extent: "parent" as const,
              position: {
                x: Math.max(0, absX - targetGroup.position.x),
                y: Math.max(0, absY - targetGroup.position.y),
              },
            };
          }

          // Leaving a group — restore absolute position
          return { ...n, parentId: undefined, extent: undefined, position: { x: absX, y: absY } };
        });
      });

      // Re-register handles on the moved node so edge validation finds them immediately
      updateNodeInternals(node.id);
    },
    [getIntersectingNodes, setNodes, updateNodeInternals],
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
        setNodes((nds) => {
          const deletedIds = new Set(deleted.map((n) => n.id));
          const restored = deleted.filter((n) => n.data.isEntryPoint);
          return [...nds.filter((n) => !deletedIds.has(n.id)), ...restored];
        });
      }
      // Close config panel if the selected node was deleted
      setSelectedNodeId((prev) => {
        const deletedIds = new Set(deleted.map((n) => n.id));
        return prev && deletedIds.has(prev) ? null : prev;
      });
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      deleteElements({ nodes: [{ id: nodeId }] });
    },
    [deleteElements],
  );

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
      ),
    );
    setIsDirty(true);
  }

  function updateNodeLabel(nodeId: string, label: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
      ),
    );
    setIsDirty(true);
  }

  function updateNodeGroup(nodeId: string, groupId: string | null) {
    setNodes((nds) => {
      const group = groupId ? nds.find((n) => n.id === groupId) : null;
      return nds.map((n) => {
        if (n.id !== nodeId) return n;
        if (group) {
          return {
            ...n,
            parentId: group.id,
            extent: "parent" as const,
            position: {
              x: n.position.x - group.position.x,
              y: n.position.y - group.position.y,
            },
          };
        }
        // Remove from group — convert relative position back to absolute
        const parentGroup = nds.find((g) => g.id === n.parentId);
        return {
          ...n,
          parentId: undefined,
          extent: undefined,
          position: parentGroup
            ? { x: n.position.x + parentGroup.position.x, y: n.position.y + parentGroup.position.y }
            : n.position,
        };
      });
    });
    setIsDirty(true);
  }

  function validateGraph(): string | null {
    const realNodes = nodes.filter((n) => n.type !== "groupNode" && n.type !== "gotoNode");
    if (realNodes.length === 0) return "Add at least one node before saving";
    const hasEntry = realNodes.some((n) => n.data.isEntryPoint);
    if (!hasEntry) return "Set an entry point node (click ↑ on a node)";
    const ungotod = nodes.filter(
      (n) => n.type === "gotoNode" && !(n.data.config?.target as string),
    );
    if (ungotod.length > 0) return "All Go To nodes must have a target selected";
    return null;
  }

  function handleSave() {
    const validationError = validateGraph();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const graphConfig = toGraphConfig(nodes, edges, getViewport());
    updateGraphMutation.mutate(graphConfig, {
      onSuccess: () => setIsDirty(false),
    });
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <ToolSchemasContext.Provider value={toolSchemas}>
    <div className="h-full flex flex-col">
      <GraphEditorHeader
        agent={agent}
        isDirty={isDirty}
        isSaving={updateGraphMutation.isPending}
        isChatOpen={isChatOpen}
        activeTab={activeTab}
        onSave={handleSave}
        onToggleChat={() => setIsChatOpen((o) => !o)}
        onTabChange={(tab) => { setActiveTab(tab); if (tab === "sessions") setIsChatOpen(false); }}
      />

      {activeTab === "sessions" ? (
        <SessionsView agent={agent} />
      ) : (
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
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionLineType={ConnectionLineType.Bezier}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              {...(initialGraph.viewport
                ? { defaultViewport: initialGraph.viewport }
                : { fitView: true, fitViewOptions: { padding: 0.2 } })}
              deleteKeyCode={["Backspace", "Delete"]}
              className="bg-background"
              // Suppress error #008 — fires transiently before handle bounds are registered,
              // and also when the entry-point node has no target handle (expected).
              onError={(code) => { if (code === "008") return; console.warn(`ReactFlow error ${code}`); }}
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
                allNodes={nodes}
                onUpdate={updateNodeConfig}
                onUpdateLabel={updateNodeLabel}
                onClose={() => setSelectedNodeId(null)}
                onDelete={deleteNode}
              />
            </div>
          )}

          {/* Always mounted so the session survives close/reopen without creating a ghost session */}
          <div className={`absolute right-0 top-0 h-full z-20 ${isChatOpen ? "" : "hidden"}`}>
            <ChatTestPanel agentId={agent.id} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          </div>
        </div>
      </div>
      )}
    </div>
    </ToolSchemasContext.Provider>
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
