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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CanvasTemplateTray } from './components/CanvasTemplateTray';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EdgeFormPanel } from './components/EdgeFormPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { NodeFormPanel } from './components/NodeFormPanel';
import { SandboxPanel } from './components/SandboxPanel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ValidationPanel, type ValidationIssue } from './components/ValidationPanel';
import { WorkflowDashboard } from './components/WorkflowDashboard';
import { WorkflowNodeCard } from './components/WorkflowNodeCard';
import { templateByType } from './data/nodeTemplates';
import { cloneWorkflow, defaultWorkflowTemplate, workflowTemplates } from './data/workflowTemplates';
import { useAutomations } from './hooks/useAutomations';
import { simulateWorkflow } from './api/mockWorkflowApi';
import type { ApprovalOutcome, SerializedWorkflow, SimulationResult, WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from './types/workflow';
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

const hasSavedWorkflow = () => {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
};

export default function App() {
  return (
    <ReactFlowProvider>
      <WorkflowDesigner />
    </ReactFlowProvider>
  );
}

function WorkflowDesigner() {
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const { automations } = useAutomations();
  const starter = useMemo(() => initialWorkflow(), []);
  const [view, setView] = useState<'dashboard' | 'designer'>('dashboard');
  const [nodes, setNodes] = useState<WorkflowNode[]>(starter.nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(starter.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const [history, setHistory] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [future, setFuture] = useState<Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>>([]);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult>();
  const [isRunning, setIsRunning] = useState(false);
  const [approvalOutcome, setApprovalOutcome] = useState<ApprovalOutcome>('approved');
  const [loadingMessage, setLoadingMessage] = useState<string>();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedAt, setSavedAt] = useState<string>();
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (view !== 'designer') return;
    setSaveStatus('saving');
    const payload: SerializedWorkflow = { nodes, edges, exportedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setSavedAt(new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()));
      setSaveStatus('saved');
    }, 450);

    return () => window.clearTimeout(saveTimer.current);
  }, [nodes, edges, view]);

  const validation = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);
  const nodesWithValidation = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
        data: {
          ...node.data,
          validationErrors: validation.nodeErrors[node.id] ?? [],
        },
      })),
    [nodes, validation.nodeErrors],
  );
  const selectedNode = nodesWithValidation.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
  const validationIssues = useMemo(() => buildValidationIssues(validation), [validation]);

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
    const result = await simulateWorkflow({ nodes, edges, approvalOutcome });
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

  const showLoading = async (message = 'Loading workflow...') => {
    setLoadingMessage(message);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setLoadingMessage(undefined);
  };

  const loadTemplate = async (templateId: string, confirmReplace = true) => {
    const template = workflowTemplates.find((item) => item.id === templateId);
    if (!template) return;
    if (confirmReplace) {
      setPendingTemplateId(templateId);
      return;
    }
    await showLoading(`Loading ${template.name}...`);
    const workflow = cloneWorkflow(template);
    commit(workflow.nodes, workflow.edges);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setSimulation(undefined);
    setView('designer');
  };

  const confirmTemplateLoad = async () => {
    if (!pendingTemplateId) return;
    const templateId = pendingTemplateId;
    setPendingTemplateId(undefined);
    await loadTemplate(templateId, false);
  };

  const resetWorkflow = () => {
    setConfirmResetOpen(true);
  };

  const confirmResetWorkflow = async () => {
    setConfirmResetOpen(false);
    await showLoading('Loading sample workflow...');
    const workflow = cloneWorkflow(defaultWorkflowTemplate);
    commit(workflow.nodes, workflow.edges);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setView('designer');
  };

  const createBlankWorkflow = async () => {
    await showLoading('Loading blank workflow...');
    commit([], []);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setSimulation(undefined);
    setView('designer');
  };

  const openSavedWorkflow = async () => {
    await showLoading('Loading saved workflow...');
    setView('designer');
  };

  const clearSavedWorkflow = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedAt(undefined);
    setSaveStatus('idle');
  };

  const selectValidationIssue = (issue: ValidationIssue) => {
    if (!issue.nodeId) return;
    const node = nodes.find((item) => item.id === issue.nodeId);
    if (!node) return;
    setSelectedNodeId(node.id);
    setSelectedEdgeId(undefined);
    setCenter(node.position.x + 120, node.position.y + 40, { duration: 450, zoom: 1.15 });
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
      await showLoading('Loading imported workflow...');
      commit(payload.nodes, payload.edges);
      setSelectedNodeId(undefined);
      setSelectedEdgeId(undefined);
      setView('designer');
    }
  };

  if (view === 'dashboard') {
    return (
      <>
        {loadingMessage ? <LoadingOverlay message={loadingMessage} /> : null}
        {pendingTemplateId ? (
          <ConfirmDialog
            title="Load this workflow?"
            description="This will replace the workflow currently on the canvas."
            onCancel={() => setPendingTemplateId(undefined)}
            onConfirm={confirmTemplateLoad}
          />
        ) : null}
        {confirmResetOpen ? (
          <ConfirmDialog
            title="Reset workflow?"
            description="This will replace the canvas with the sample Employee Onboarding workflow."
            onCancel={() => setConfirmResetOpen(false)}
            onConfirm={confirmResetWorkflow}
          />
        ) : null}
        <WorkflowDashboard
          hasSavedWorkflow={hasSavedWorkflow()}
          onCreateBlank={createBlankWorkflow}
          onOpenSaved={openSavedWorkflow}
          onSelectTemplate={(templateId) => loadTemplate(templateId, false)}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      {loadingMessage ? <LoadingOverlay message={loadingMessage} /> : null}
      {pendingTemplateId ? (
        <ConfirmDialog
          title="Load this workflow?"
          description="This will replace the workflow currently on the canvas."
          onCancel={() => setPendingTemplateId(undefined)}
          onConfirm={confirmTemplateLoad}
        />
      ) : null}
      {confirmResetOpen ? (
        <ConfirmDialog
          title="Reset workflow?"
          description="This will replace the canvas with the sample Employee Onboarding workflow."
          onCancel={() => setConfirmResetOpen(false)}
          onConfirm={confirmResetWorkflow}
        />
      ) : null}
      <Sidebar onExport={exportWorkflow} onImport={importWorkflow} />
      <main className="designer">
        <TopBar
          canRedo={future.length > 0}
          canUndo={history.length > 0}
          errors={validation.errors}
          nodeCount={nodes.length}
          onAutoLayout={autoLayout}
          onClearSaved={clearSavedWorkflow}
          onDashboard={() => setView('dashboard')}
          onRedo={redo}
          onReset={resetWorkflow}
          onRun={runSimulation}
          onUndo={undo}
          saveStatus={saveStatus}
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
            <MiniMap pannable zoomable position="top-right" />
            <Controls />
          </ReactFlow>
          <ValidationPanel issues={validationIssues} onIssueClick={selectValidationIssue} />
          <CanvasTemplateTray onCreateBlank={createBlankWorkflow} onLoadTemplate={loadTemplate} />
        </section>
      </main>
      <aside className="inspector">
        <div className="overview-panel">
          <div className="overview-header">
            <div>
              <h2>Performance Overview</h2>
              <p>Overview Performance Time</p>
            </div>
            <span aria-hidden="true">×</span>
          </div>

          <section className="overview-section">
            <div className="overview-section-title">
              <strong>Insight Metrics</strong>
              <span>+</span>
            </div>
            <div className="search-mock">Search Here...</div>
            <div className="coverage-card">
              <strong>Automation Coverage</strong>
              <p>Your last week is better 72%</p>
            </div>
            <div className="workflow-mini-card">
              <strong>Current Workflow</strong>
              <p>Triggered by HR actions</p>
              <div className="progress-strip">
                <span />
                <span />
                <span />
              </div>
              <div className="mini-tags">
                <span>Task: {nodes.filter((node) => node.data.type === 'task').length}</span>
                <span>Exec: {nodes.filter((node) => node.data.type === 'automation').length}</span>
                <span>Done: {nodes.filter((node) => node.data.type === 'end').length}</span>
              </div>
            </div>
          </section>

          <section className="overview-section">
            <div className="overview-section-title">
              <strong>Flow Objectives</strong>
              <span>+</span>
            </div>
          </section>
        </div>
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
        onOutcomeChange={setApprovalOutcome}
        onRun={runSimulation}
        outcome={approvalOutcome}
        result={simulation}
        validationErrors={validation.errors}
      />
    </div>
  );
}

function buildValidationIssues(validation: ReturnType<typeof validateWorkflow>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeMessages = new Set<string>();

  Object.entries(validation.nodeErrors).forEach(([nodeId, messages]) => {
    messages.forEach((message) => {
      nodeMessages.add(message);
      issues.push({ id: `${nodeId}-${message}`, message, nodeId });
    });
  });

  validation.errors
    .filter((message) => !nodeMessages.has(message))
    .forEach((message) => issues.push({ id: `global-${message}`, message }));

  return issues;
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
