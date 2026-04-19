import type {
  ApprovalOutcome,
  AutomationDefinition,
  SimulationResult,
  SimulationStep,
  WorkflowEdge,
  WorkflowNode,
} from '../types/workflow';
import { validateWorkflow } from '../utils/validation';

const automations: AutomationDefinition[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'create_ticket', label: 'Create IT Ticket', params: ['queue', 'priority'] },
  { id: 'notify_slack', label: 'Notify Slack Channel', params: ['channel', 'message'] },
];

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function getAutomations(): Promise<AutomationDefinition[]> {
  await delay(250);
  return automations;
}

export async function simulateWorkflow(payload: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  approvalOutcome?: ApprovalOutcome;
}): Promise<SimulationResult> {
  await delay(550);
  const validation = validateWorkflow(payload.nodes, payload.edges);

  if (validation.errors.length > 0) {
    return {
      ok: false,
      runId: `sim_${Date.now()}`,
      errors: validation.errors,
      steps: [],
    };
  }

  const orderedNodes = topologicalWalk(payload.nodes, payload.edges, payload.approvalOutcome ?? 'approved');
  const steps: SimulationStep[] = orderedNodes.map(({ node, via }, index) => ({
    nodeId: node.id,
    nodeType: node.data.type,
    title: node.data.label,
    status: statusFor(node),
    owner: ownerFor(node),
    durationMinutes: durationFor(node),
    pathLabel: via?.data?.label ?? String(via?.label ?? ''),
    chosenPath: Boolean(via?.data?.condition && via.data.condition !== 'standard'),
    detail: describeStep(node, index + 1, via),
  }));

  return {
    ok: true,
    runId: `sim_${Date.now()}`,
    errors: [],
    steps,
    summary: {
      totalSteps: steps.length,
      completedSteps: steps.filter((step) => step.status === 'completed').length,
      totalMinutes: steps.reduce((sum, step) => sum + step.durationMinutes, 0),
      outcome: steps.some((step) => step.status === 'failed') ? 'blocked' : 'success',
    },
  };
}

function topologicalWalk(nodes: WorkflowNode[], edges: WorkflowEdge[], approvalOutcome: ApprovalOutcome) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, WorkflowEdge[]>();
  edges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  });

  const start = nodes.find((node) => node.data.type === 'start') ?? nodes[0];
  const visited = new Set<string>();
  const ordered: Array<{ node: WorkflowNode; via?: WorkflowEdge }> = [];
  const queue: Array<{ id: string; via?: WorkflowEdge }> = start ? [{ id: start.id }] : [];

  while (queue.length > 0) {
    const { id, via } = queue.shift()!;
    if (visited.has(id)) continue;
    const node = byId.get(id);
    if (!node) continue;
    visited.add(id);
    ordered.push({ node, via });

    const nextEdges = outgoing.get(id) ?? [];
    const chosenEdges = node.data.type === 'approval' ? chooseApprovalPath(nextEdges, approvalOutcome) : nextEdges;
    queue.push(...chosenEdges.map((edge) => ({ id: edge.target, via: edge })));
  }

  return ordered;
}

function chooseApprovalPath(edges: WorkflowEdge[], approvalOutcome: ApprovalOutcome) {
  const matching = edges.find((edge) => edge.data?.condition === approvalOutcome);
  if (matching) return [matching];

  const fallback =
    edges.find((edge) => edge.data?.condition === 'approved') ??
    edges.find((edge) => edge.data?.condition === 'standard') ??
    edges[0];

  return fallback ? [fallback] : [];
}

function describeStep(node: WorkflowNode, stepNumber: number, via?: WorkflowEdge) {
  const path = via?.data?.label || via?.label ? ` via "${via.data?.label ?? via.label}"` : '';
  switch (node.data.type) {
    case 'start':
      return `Step ${stepNumber}: received trigger "${node.data.startTitle}".`;
    case 'task':
      return `Step ${stepNumber}${path}: assigned "${node.data.title}" to ${node.data.assignee || 'an owner'}.`;
    case 'approval':
      return `Step ${stepNumber}${path}: requested ${node.data.approverRole} approval and followed the selected approval outcome.`;
    case 'automation':
      return `Step ${stepNumber}${path}: executed automation "${node.data.actionId}".`;
    case 'end':
      return `Step ${stepNumber}${path}: completed with message "${node.data.endMessage}".`;
  }
}

function ownerFor(node: WorkflowNode) {
  switch (node.data.type) {
    case 'start':
      return 'HR system';
    case 'task':
      return node.data.assignee || 'Unassigned owner';
    case 'approval':
      return node.data.approverRole;
    case 'automation':
      return 'SpaceWalker automation';
    case 'end':
      return 'Workflow archive';
  }
}

function durationFor(node: WorkflowNode) {
  switch (node.data.type) {
    case 'start':
      return 1;
    case 'task':
      return 120;
    case 'approval':
      return node.data.autoApproveThreshold > 0 ? 5 : 240;
    case 'automation':
      return 2;
    case 'end':
      return 1;
  }
}

function statusFor(node: WorkflowNode): SimulationStep['status'] {
  if (node.data.type === 'task' && !node.data.assignee) return 'waiting';
  return 'completed';
}
