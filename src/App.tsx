import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useState } from 'react';
import { NodeFormPanel } from './components/NodeFormPanel';
import { SandboxPanel } from './components/SandboxPanel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ValidationPanel } from './components/ValidationPanel';
import { WorkflowNodeCard } from './components/WorkflowNodeCard';
import { seededWorkflow, templateByType } from './data/nodeTemplates';
import { useAutomations } from './hooks/useAutomations';
import { simulateWorkflow } from './api/mockWorkflowApi';
import type { SerializedWorkflow, SimulationResult, WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from './types/workflow';
import { validateWorkflow } from './utils/validation';

const nodeTypes: NodeTypes = {
  start: WorkflowNodeCard,
  task: WorkflowNodeCard,
  approval: WorkflowNodeCard,
  automation: WorkflowNodeCard,
  end: WorkflowNodeCard,
};

export default function App() {
  return (
    <ReactFlowProvider>
      <WorkflowDesigner />
    </ReactFlowProvider>
  );
}

function WorkflowDesigner() {
  const { screenToFlowPosition } = useReactFlow();
  const { automations } = useAutomations();
  const [nodes, setNodes] = useState<WorkflowNode[]>(seededWorkflow.nodes as WorkflowNode[]);
  const [edges, setEdges] = useState<WorkflowEdge[]>(seededWorkflow.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [history, setHistory] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [future, setFuture] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult>();
  const [isRunning, setIsRunning] = useState(false);

  const validation = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);
  const nodesWithValidation = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          validationErrors: validation.nodeErrors[node.id] ?? [],
        },
      })),
    [nodes, validation.nodeErrors],
  );
  const selectedNode = nodesWithValidation.find((node) => node.id === selectedNodeId);

  const commit = useCallback(
    (nextNodes: WorkflowNode[], nextEdges: WorkflowEdge[]) => {
      setHistory((items) => [...items, { nodes, edges }]);
      setFuture([]);
      setNodes(nextNodes);
      setEdges(nextEdges);
    },
    [edges, nodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const nextNodes = applyNodeChanges(changes, nodes) as WorkflowNode[];
      commit(nextNodes, edges);
    },
    [commit, edges, nodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<WorkflowEdge>[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      commit(nodes, nextEdges);
    },
    [commit, edges, nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge({ ...connection, animated: true }, edges);
      commit(nodes, nextEdges);
    },
    [commit, edges, nodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      const template = templateByType[type];
      if (!template) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const node: WorkflowNode = {
        id: `${type}-${crypto.randomUUID()}`,
        type,
        position,
        data: template.createData(),
      };
      commit([...nodes, node], edges);
      setSelectedNodeId(node.id);
    },
    [commit, edges, nodes, screenToFlowPosition],
  );

  const updateNode = (nodeId: string, data: WorkflowNodeData) => {
    commit(
      nodes.map((node) => (node.id === nodeId ? { ...node, data } : node)),
      edges,
    );
  };

  const deleteNode = (nodeId: string) => {
    commit(
      nodes.filter((node) => node.id !== nodeId),
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    setSelectedNodeId(undefined);
  };

  const runSimulation = async () => {
    setSandboxOpen(true);
    setIsRunning(true);
    const result = await simulateWorkflow({ nodes, edges });
    setSimulation(result);
    setIsRunning(false);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [{ nodes, edges }, ...items]);
    setHistory((items) => items.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, { nodes, edges }]);
    setFuture((items) => items.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const autoLayout = () => {
    const spacingX = 300;
    const spacingY = 150;
    const next = nodes.map((node, index) => ({
      ...node,
      position: { x: 80 + (index % 3) * spacingX, y: 120 + Math.floor(index / 3) * spacingY },
    }));
    commit(next, edges);
  };

  const exportWorkflow = () => {
    const payload: SerializedWorkflow = { nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hr-workflow.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text) as Partial<SerializedWorkflow>;
    if (payload.nodes && payload.edges) {
      commit(payload.nodes, payload.edges);
      setSelectedNodeId(undefined);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar onExport={exportWorkflow} onImport={importWorkflow} />
      <main className="designer">
        <TopBar
          canRedo={future.length > 0}
          canUndo={history.length > 0}
          errors={validation.errors}
          onAutoLayout={autoLayout}
          onRedo={redo}
          onRun={runSimulation}
          onUndo={undo}
        />
        <section className="canvas-wrap">
          <ReactFlow
            nodes={nodesWithValidation}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onNodesChange={onNodesChange}
            fitView
          >
            <Background color="#cad4dd" gap={20} size={1.2} variant={BackgroundVariant.Dots} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
          <ValidationPanel errors={validation.errors} />
        </section>
      </main>
      <NodeFormPanel automations={automations} node={selectedNode} onDelete={deleteNode} onUpdate={updateNode} />
      <SandboxPanel
        edges={edges}
        isOpen={sandboxOpen}
        isRunning={isRunning}
        nodes={nodesWithValidation}
        onClose={() => setSandboxOpen(false)}
        onRun={runSimulation}
        result={simulation}
        validationErrors={validation.errors}
      />
    </div>
  );
}
