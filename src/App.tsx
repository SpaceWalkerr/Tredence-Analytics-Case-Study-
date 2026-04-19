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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EdgeFormPanel } from './components/EdgeFormPanel';
import { NodeFormPanel } from './components/NodeFormPanel';
import { SandboxPanel } from './components/SandboxPanel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ValidationPanel } from './components/ValidationPanel';
import { WorkflowNodeCard } from './components/WorkflowNodeCard';
import { templateByType } from './data/nodeTemplates';
import { cloneWorkflow, defaultWorkflowTemplate, workflowTemplates } from './data/workflowTemplates';
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

const STORAGE_KEY = 'peopleops-workflow-designer';

const initialWorkflow = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SerializedWorkflow;
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return { nodes: parsed.nodes, edges: parsed.edges };
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return cloneWorkflow(defaultWorkflowTemplate);
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
  const starter = useMemo(() => initialWorkflow(), []);
  const [nodes, setNodes] = useState<WorkflowNode[]>(starter.nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(starter.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const [history, setHistory] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [future, setFuture] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult>();
  const [isRunning, setIsRunning] = useState(false);
  const [savedAt, setSavedAt] = useState<string>();

  useEffect(() => {
    const payload: SerializedWorkflow = { nodes, edges, exportedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()));
  }, [nodes, edges]);

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
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

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
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const label = sourceNode?.data.type === 'approval' ? 'Approved' : '';
      const nextEdges = addEdge(
        {
          ...connection,
          animated: true,
          label,
          data: { label, condition: label ? 'approved' : 'standard' },
        },
        edges,
      );
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
      setSelectedEdgeId(undefined);
    },
    [commit, edges, nodes, screenToFlowPosition],
  );

  const updateNode = (nodeId: string, data: WorkflowNodeData) => {
    const current = nodes.find((node) => node.id === nodeId);
    const nextData = current ? addNodeHistory(current.data, data) : data;
    commit(
      nodes.map((node) => (node.id === nodeId ? { ...node, data: nextData } : node)),
      edges,
    );
  };

  const updateEdge = (edgeId: string, edge: WorkflowEdge) => {
    commit(
      nodes,
      edges.map((item) => (item.id === edgeId ? edge : item)),
    );
  };

  const deleteNode = (nodeId: string) => {
    commit(
      nodes.filter((node) => node.id !== nodeId),
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    setSelectedNodeId(undefined);
  };

  const deleteEdge = (edgeId: string) => {
    commit(
      nodes,
      edges.filter((edge) => edge.id !== edgeId),
    );
    setSelectedEdgeId(undefined);
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

  const loadTemplate = (templateId: string) => {
    const template = workflowTemplates.find((item) => item.id === templateId);
    if (!template) return;
    if (!window.confirm(`Load "${template.name}" and replace the current canvas?`)) return;
    const workflow = cloneWorkflow(template);
    commit(workflow.nodes, workflow.edges);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setSimulation(undefined);
  };

  const resetWorkflow = () => {
    if (!window.confirm('Reset the canvas to the sample Employee Onboarding workflow?')) return;
    const workflow = cloneWorkflow(defaultWorkflowTemplate);
    commit(workflow.nodes, workflow.edges);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
  };

  const clearSavedWorkflow = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedAt(undefined);
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
      setSelectedEdgeId(undefined);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar onExport={exportWorkflow} onImport={importWorkflow} onLoadTemplate={loadTemplate} />
      <main className="designer">
        <TopBar
          canRedo={future.length > 0}
          canUndo={history.length > 0}
          errors={validation.errors}
          nodeCount={nodes.length}
          onAutoLayout={autoLayout}
          onClearSaved={clearSavedWorkflow}
          onRedo={redo}
          onReset={resetWorkflow}
          onRun={runSimulation}
          onUndo={undo}
          savedAt={savedAt}
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
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(undefined);
            }}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(undefined);
            }}
            onNodesChange={onNodesChange}
            onPaneClick={() => {
              setSelectedNodeId(undefined);
              setSelectedEdgeId(undefined);
            }}
            fitView
          >
            <Background color="#cad4dd" gap={20} size={1.2} variant={BackgroundVariant.Dots} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
          <ValidationPanel errors={validation.errors} />
        </section>
      </main>
      <aside className="inspector">
        <NodeFormPanel automations={automations} node={selectedNode} onDelete={deleteNode} onUpdate={updateNode} />
        <EdgeFormPanel edge={selectedEdge} onDelete={deleteEdge} onUpdate={updateEdge} />
        {!selectedNode && !selectedEdge ? (
          <div className="inspector-empty-inner">
            <p className="section-label">Edit Panel</p>
            <h2>Select a step or connection</h2>
            <p>Click a node to edit its form, or click a line to edit its path label.</p>
          </div>
        ) : null}
      </aside>
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

function addNodeHistory(previous: WorkflowNodeData, next: WorkflowNodeData): WorkflowNodeData {
  const changes = trackedChanges(previous, next);
  if (changes.length === 0) return next;

  return {
    ...next,
    versionHistory: [
      ...changes.map((change) => ({
        id: crypto.randomUUID(),
        changedAt: new Date().toISOString(),
        ...change,
      })),
      ...(previous.versionHistory ?? []),
    ].slice(0, 8),
  } as WorkflowNodeData;
}

function trackedChanges(previous: WorkflowNodeData, next: WorkflowNodeData) {
  const fields: Array<[string, string | number | undefined, string | number | undefined]> = [];

  if ('title' in previous && 'title' in next) fields.push(['Title', previous.title, next.title]);
  if (previous.type === 'task' && next.type === 'task') fields.push(['Assignee', previous.assignee, next.assignee]);
  if (previous.type === 'approval' && next.type === 'approval') fields.push(['Approval role', previous.approverRole, next.approverRole]);
  if (previous.type === 'automation' && next.type === 'automation') fields.push(['Automation action', previous.actionId, next.actionId]);

  return fields
    .filter(([, before, after]) => String(before ?? '') !== String(after ?? ''))
    .map(([field, before, after]) => ({
      field,
      previousValue: String(before ?? 'Empty'),
      nextValue: String(after ?? 'Empty'),
    }));
}
