import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

export type ValidationResult = {
  errors: string[];
  nodeErrors: Record<string, string[]>;
};

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
  const errors: string[] = [];
  const nodeErrors: Record<string, string[]> = {};
  const addNodeError = (nodeId: string, message: string) => {
    nodeErrors[nodeId] = [...(nodeErrors[nodeId] ?? []), message];
    errors.push(message);
  };

  const startNodes = nodes.filter((node) => node.data.type === 'start');
  const endNodes = nodes.filter((node) => node.data.type === 'end');

  if (startNodes.length !== 1) {
    errors.push('Workflow must contain exactly one Start node.');
    startNodes.forEach((node) => addNodeError(node.id, 'Only one Start node is allowed.'));
  }

  if (endNodes.length < 1) {
    errors.push('Workflow must contain at least one End node.');
  }

  nodes.forEach((node) => {
    const incoming = edges.filter((edge) => edge.target === node.id);
    const outgoing = edges.filter((edge) => edge.source === node.id);

    if (node.data.type === 'start' && incoming.length > 0) {
      addNodeError(node.id, 'Start node must be the first step and cannot have incoming connections.');
    }

    if (node.data.type !== 'start' && incoming.length === 0) {
      addNodeError(node.id, `${node.data.label} needs an incoming connection.`);
    }

    if (node.data.type !== 'end' && outgoing.length === 0) {
      addNodeError(node.id, `${node.data.label} needs an outgoing connection.`);
    }

    if (node.data.type === 'task' && !node.data.title.trim()) {
      addNodeError(node.id, 'Task title is required.');
    }

    if (node.data.type === 'automation' && !node.data.actionId) {
      addNodeError(node.id, 'Automated Step requires an action.');
    }
  });

  if (hasCycle(nodes, edges)) {
    errors.push('Workflow contains a cycle. Simulation requires a directed path.');
  }

  return { errors: Array.from(new Set(errors)), nodeErrors };
}

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const graph = new Map<string, string[]>();
  nodes.forEach((node) => graph.set(node.id, []));
  edges.forEach((edge) => graph.set(edge.source, [...(graph.get(edge.source) ?? []), edge.target]));

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const nextId of graph.get(id) ?? []) {
      if (visit(nextId)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return nodes.some((node) => visit(node.id));
}
