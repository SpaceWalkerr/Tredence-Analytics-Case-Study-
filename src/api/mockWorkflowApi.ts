import type {
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

  const orderedNodes = topologicalWalk(payload.nodes, payload.edges);
  const steps: SimulationStep[] = orderedNodes.map((node, index) => ({
    nodeId: node.id,
    nodeType: node.data.type,
    title: node.data.label,
    status: 'completed',
    detail: describeStep(node, index + 1),
  }));

  return {
    ok: true,
    runId: `sim_${Date.now()}`,
    errors: [],
    steps,
  };
}

function topologicalWalk(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  edges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  });

  const start = nodes.find((node) => node.data.type === 'start') ?? nodes[0];
  const visited = new Set<string>();
  const ordered: WorkflowNode[] = [];
  const queue = start ? [start.id] : [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    const node = byId.get(id);
    if (!node) continue;
    visited.add(id);
    ordered.push(node);
    queue.push(...(outgoing.get(id) ?? []));
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) ordered.push(node);
  });

  return ordered;
}

function describeStep(node: WorkflowNode, stepNumber: number) {
  switch (node.data.type) {
    case 'start':
      return `Step ${stepNumber}: received trigger "${node.data.startTitle}".`;
    case 'task':
      return `Step ${stepNumber}: assigned "${node.data.title}" to ${node.data.assignee || 'an owner'}.`;
    case 'approval':
      return `Step ${stepNumber}: requested ${node.data.approverRole} approval.`;
    case 'automation':
      return `Step ${stepNumber}: executed automation "${node.data.actionId}".`;
    case 'end':
      return `Step ${stepNumber}: completed with message "${node.data.endMessage}".`;
  }
}
