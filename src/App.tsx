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
  type EdgeTypes,
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
import { Sidebar, type SidebarPageId } from './components/Sidebar';
import { SimplePage } from './components/SimplePage';
import { TopBar } from './components/TopBar';
import { ValidationPanel, type ValidationIssue } from './components/ValidationPanel';
import { WorkflowDashboard } from './components/WorkflowDashboard';
import { WorkflowEdge as WorkflowEdgeView } from './components/WorkflowEdge';
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

const edgeTypes: EdgeTypes = {
  workflow: WorkflowEdgeView,
};

const STORAGE_KEY = 'peopleops-workflow-designer';
type AppView = 'dashboard' | 'designer' | Exclude<SidebarPageId, 'dashboard'>;

const initialWorkflow = (): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; name?: string } => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SerializedWorkflow;
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return { nodes: parsed.nodes, edges: parsed.edges, name: parsed.name };
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return { ...cloneWorkflow(defaultWorkflowTemplate), name: defaultWorkflowTemplate.name };
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
  const [view, setView] = useState<AppView>('dashboard');
  const [nodes, setNodes] = useState<WorkflowNode[]>(starter.nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(starter.edges);
  const [workflowName, setWorkflowName] = useState(starter.name ?? 'Employee Onboarding');
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
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [objectivesOpen, setObjectivesOpen] = useState(true);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (view !== 'designer') return;
    setSaveStatus('saving');
    const payload: SerializedWorkflow = { nodes, edges, name: workflowName, exportedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setSavedAt(new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()));
      setSaveStatus('saved');
    }, 450);

    return () => window.clearTimeout(saveTimer.current);
  }, [nodes, edges, view, workflowName]);

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
      const approvalBranch =
        sourceNode?.data.type === 'approval' ? nextApprovalBranchLabel(edges, String(connection.source ?? '')) : undefined;
      const label = approvalBranch?.label ?? '';
      const nextEdges = addEdge(
        {
          ...connection,
          animated: true,
          label,
          type: 'workflow',
          data: {
            label,
            condition: approvalBranch?.condition ?? (label ? 'approved' : 'standard'),
          },
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

  const addNodeFromPalette = (type: WorkflowNodeType) => {
    const template = templateByType[type];
    if (!template) return;
    const node: WorkflowNode = {
      id: `${type}-${crypto.randomUUID()}`,
      type,
      position: {
        x: 120 + (nodes.length % 4) * 280,
        y: 160 + Math.floor(nodes.length / 4) * 160,
      },
      data: template.createData(),
    };
    commit([...nodes, node], edges);
    setSelectedNodeId(node.id);
    setSelectedEdgeId(undefined);
  };

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
    setWorkflowName(template.name);
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
    setWorkflowName(defaultWorkflowTemplate.name);
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setView('designer');
  };

  const createBlankWorkflow = async () => {
    await showLoading('Loading blank workflow...');
    commit([], []);
    setWorkflowName('Untitled Workflow');
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

  const navigateSidebar = (page: SidebarPageId) => {
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    if (page === 'dashboard') {
      setView('dashboard');
      return;
    }
    setView(page);
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
    const payload: SerializedWorkflow = { nodes, edges, name: workflowName, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(workflowName || 'hr-workflow')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text) as Partial<SerializedWorkflow>;
    if (payload.nodes && payload.edges) {
      await showLoading('Loading imported workflow...');
      commit(payload.nodes, payload.edges);
      setWorkflowName(payload.name ?? file.name.replace(/\.json$/i, '') ?? 'Imported Workflow');
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

  if (view !== 'designer') {
    return (
      <div className="app-shell app-shell--page">
        {loadingMessage ? <LoadingOverlay message={loadingMessage} /> : null}
        <Sidebar
          activePage={view}
          onExport={exportWorkflow}
          onImport={importWorkflow}
          onNavigate={navigateSidebar}
        />
        <SimplePage page={view} />
        <aside className="inspector inspector--simple">
          <div className="overview-panel">
            <div className="overview-header">
              <div>
                <h2>Page Overview</h2>
                <p>Simple module preview</p>
              </div>
              <span aria-hidden="true">×</span>
            </div>
            <div className="coverage-card">
              <strong>{view.charAt(0).toUpperCase() + view.slice(1)}</strong>
              <p>This page is ready for future expansion.</p>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  const taskCount = nodes.filter((node) => node.data.type === 'task').length;
  const automationCount = nodes.filter((node) => node.data.type === 'automation').length;
  const approvalCount = nodes.filter((node) => node.data.type === 'approval').length;
  const endCount = nodes.filter((node) => node.data.type === 'end').length;
  const totalNodes = nodes.length;
  const actionableNodeCount = nodes.filter((node) => node.data.type !== 'start' && node.data.type !== 'end').length;
  const automationCoverage = toPercent(automationCount, actionableNodeCount || totalNodes);
  const connectedNodeCount = countConnectedNodes(nodes, edges);
  const connectivityScore = toPercent(connectedNodeCount, totalNodes);
  const branchCoverage = approvalBranchCoverage(nodes, edges);
  const branchCoveragePct = toPercent(branchCoverage.ready, branchCoverage.total || 1);
  const readinessScore = Math.max(
    0,
    Math.round((automationCoverage * 0.35) + (connectivityScore * 0.4) + (branchCoveragePct * 0.25) - validation.errors.length * 6),
  );
  const taskPct = toPercent(taskCount, totalNodes || 1);
  const automationPct = toPercent(automationCount, totalNodes || 1);
  const endPct = toPercent(endCount, totalNodes || 1);
  const objectiveNodes = nodes.slice(0, 5);
  const remainingObjectives = Math.max(nodes.length - objectiveNodes.length, 0);

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
      <Sidebar
        activePage="workflows"
        onExport={exportWorkflow}
        onImport={importWorkflow}
        onNavigate={navigateSidebar}
      />
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
          onSave={exportWorkflow}
          onUndo={undo}
          saveStatus={saveStatus}
          savedAt={savedAt}
          workflowName={workflowName}
          onWorkflowNameChange={setWorkflowName}
        />
        <section className="canvas-wrap">
          <ReactFlow
            nodes={nodesWithValidation}
            edges={edges}
            edgeTypes={edgeTypes}
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
            fitViewOptions={{ padding: 0.28 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cad4dd" gap={20} size={1.2} variant={BackgroundVariant.Dots} />
            <MiniMap pannable zoomable position="top-right" />
            <Controls />
          </ReactFlow>
          <ValidationPanel issues={validationIssues} onIssueClick={selectValidationIssue} />
          <CanvasTemplateTray
            onAddNode={addNodeFromPalette}
            onCreateBlank={createBlankWorkflow}
            onLoadTemplate={loadTemplate}
          />
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
            <button
              aria-expanded={insightsOpen}
              className="overview-section-title"
              type="button"
              onClick={() => setInsightsOpen((isOpen) => !isOpen)}
            >
              <span className="overview-section-heading">
                <strong>Insight Metrics</strong>
                <small>Live workflow signals</small>
              </span>
              <span className="dropdown-toggle">{insightsOpen ? '−' : '+'}</span>
            </button>
            {insightsOpen ? (
              <div className="overview-dropdown-content">
                <div className="search-mock">Search workflow signals</div>
                <div className="coverage-card metric-card">
                  <div>
                    <strong>Automation Coverage</strong>
                    <p>{automationCount} automated steps connected to this workflow</p>
                  </div>
                  <span className="metric-value">{automationCoverage}%</span>
                  <div className="metric-row">
                    <span>{connectedNodeCount}/{totalNodes} nodes connected</span>
                    <span>{branchCoverage.ready}/{branchCoverage.total} approvals branch-ready</span>
                  </div>
                </div>
                <div className="workflow-mini-card metric-card">
                  <div>
                    <strong>Current Workflow</strong>
                    <p>{workflowName}</p>
                  </div>
                  <div className="progress-strip">
                    <span style={{ width: `${Math.max(taskPct, 8)}%` }} />
                    <span style={{ width: `${Math.max(automationPct, 8)}%` }} />
                    <span style={{ width: `${Math.max(endPct, 8)}%` }} />
                  </div>
                  <div className="mini-tags">
                    <span>Tasks: {taskCount}</span>
                    <span>Automations: {automationCount}</span>
                    <span>Ends: {endCount}</span>
                    <span>Readiness: {readinessScore}%</span>
                    <span>Validation issues: {validation.errors.length}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="overview-section">
            <button
              aria-expanded={objectivesOpen}
              className="overview-section-title"
              type="button"
              onClick={() => setObjectivesOpen((isOpen) => !isOpen)}
            >
              <span className="overview-section-heading">
                <strong>Flow Objectives</strong>
                <small>{nodes.length} mapped workflow steps</small>
              </span>
              <span className="dropdown-toggle">{objectivesOpen ? '−' : '+'}</span>
            </button>
            {objectivesOpen ? (
              <div className="overview-dropdown-content">
                {objectiveNodes.map((node, index) => (
                  <div className="objective-card" key={`objective-${node.id}`}>
                    <div className="objective-card-top">
                      <span className="objective-step-number">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{node.data.label}</strong>
                        <p>{nodeOwnerLabel(node.data)}</p>
                      </div>
                    </div>
                    <div className="mini-tags">
                      <span>{node.data.type}</span>
                      <span>{node.data.validationErrors?.length ? 'Needs fix' : 'Ready'}</span>
                    </div>
                  </div>
                ))}
                {remainingObjectives > 0 ? (
                  <div className="objective-card objective-card--muted">
                    <strong>{remainingObjectives} more objectives</strong>
                    <p>Open the canvas to review the remaining workflow steps.</p>
                  </div>
                ) : null}
              </div>
            ) : null}
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

function nextApprovalBranchLabel(edges: WorkflowEdge[], sourceId: string): {
  label: 'Approved' | 'Rejected' | 'Needs correction';
  condition: 'approved' | 'rejected' | 'needs_correction';
} | undefined {
  const outgoing = edges.filter((edge) => edge.source === sourceId);
  const used = new Set(outgoing.map((edge) => edge.data?.condition).filter(Boolean));

  const orderedBranches: Array<{
    label: 'Approved' | 'Rejected' | 'Needs correction';
    condition: 'approved' | 'rejected' | 'needs_correction';
  }> = [
    { label: 'Approved', condition: 'approved' },
    { label: 'Rejected', condition: 'rejected' },
    { label: 'Needs correction', condition: 'needs_correction' },
  ];

  return orderedBranches.find((branch) => !used.has(branch.condition));
}

function toPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function countConnectedNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  if (nodes.length === 0) return 0;
  const connected = new Set<string>();
  edges.forEach((edge) => {
    connected.add(edge.source);
    connected.add(edge.target);
  });
  return nodes.filter((node) => connected.has(node.id)).length;
}

function approvalBranchCoverage(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const approvals = nodes.filter((node) => node.data.type === 'approval');
  const ready = approvals.filter((node) => {
    const outgoing = edges.filter((edge) => edge.source === node.id);
    const conditions = new Set(outgoing.map((edge) => edge.data?.condition));
    return (
      conditions.has('approved') &&
      conditions.has('rejected') &&
      conditions.has('needs_correction')
    );
  }).length;

  return { ready, total: approvals.length };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'hr-workflow';
}

function nodeOwnerLabel(data: WorkflowNodeData) {
  if (data.type === 'task') return data.assignee || 'People Ops team';
  if (data.type === 'approval') return `${data.approverRole} approval`;
  if (data.type === 'automation') return 'System automation';
  if (data.type === 'start') return 'Workflow trigger';
  return 'Completion summary';
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
