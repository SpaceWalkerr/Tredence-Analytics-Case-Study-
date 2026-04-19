import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeType = 'start' | 'task' | 'approval' | 'automation' | 'end';

export type KeyValue = {
  id: string;
  key: string;
  value: string;
};

export type NodeHistoryEntry = {
  id: string;
  field: string;
  previousValue: string;
  nextValue: string;
  changedAt: string;
};

export type BaseNodeData = {
  label: string;
  validationErrors?: string[];
  versionHistory?: NodeHistoryEntry[];
};

export type StartNodeData = BaseNodeData & {
  type: 'start';
  startTitle: string;
  metadata: KeyValue[];
};

export type TaskNodeData = BaseNodeData & {
  type: 'task';
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValue[];
};

export type ApprovalNodeData = BaseNodeData & {
  type: 'approval';
  title: string;
  approverRole: string;
  autoApproveThreshold: number;
};

export type AutomationNodeData = BaseNodeData & {
  type: 'automation';
  title: string;
  actionId: string;
  actionParams: Record<string, string>;
};

export type EndNodeData = BaseNodeData & {
  type: 'end';
  endMessage: string;
  summary: boolean;
};

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomationNodeData
  | EndNodeData;

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

export type WorkflowEdgeData = {
  label?: string;
  condition?: 'approved' | 'rejected' | 'needs_correction' | 'standard';
};

export type WorkflowEdge = Edge<WorkflowEdgeData>;
export type ApprovalOutcome = 'approved' | 'rejected' | 'needs_correction';

export type AutomationDefinition = {
  id: string;
  label: string;
  params: string[];
};

export type SerializedWorkflow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  exportedAt: string;
};

export type SimulationStep = {
  nodeId: string;
  nodeType: WorkflowNodeType;
  title: string;
  status: 'completed' | 'waiting' | 'skipped' | 'failed';
  owner: string;
  durationMinutes: number;
  pathLabel?: string;
  chosenPath?: boolean;
  detail: string;
};

export type SimulationResult = {
  ok: boolean;
  runId: string;
  errors: string[];
  steps: SimulationStep[];
  summary?: {
    totalSteps: number;
    completedSteps: number;
    totalMinutes: number;
    outcome: 'success' | 'blocked';
  };
};
