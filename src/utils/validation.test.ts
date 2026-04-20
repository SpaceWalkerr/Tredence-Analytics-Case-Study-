import { describe, expect, it } from 'vitest';
import { workflowTemplates } from '../data/workflowTemplates';
import type { WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from '../types/workflow';
import { validateWorkflow } from './validation';

const makeNode = (id: string, type: WorkflowNodeType, data?: Partial<WorkflowNodeData>): WorkflowNode => {
  const base = {
    start: { type: 'start', label: 'Start', startTitle: 'Start', metadata: [] },
    task: { type: 'task', label: 'Task', title: 'Task', description: '', assignee: 'HR', dueDate: '', customFields: [] },
    approval: { type: 'approval', label: 'Approval', title: 'Approval', approverRole: 'Manager', autoApproveThreshold: 0 },
    automation: { type: 'automation', label: 'Automation', title: 'Automation', actionId: 'send_email', actionParams: {} },
    end: { type: 'end', label: 'End', endMessage: 'Done', summary: true },
  } satisfies Record<WorkflowNodeType, WorkflowNodeData>;

  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { ...base[type], ...data } as WorkflowNodeData,
  };
};

const edge = (source: string, target: string): WorkflowEdge => ({
  id: `${source}-${target}`,
  source,
  target,
});

describe('validateWorkflow', () => {
  it('accepts a simple connected workflow', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('start', 'task'), edge('task', 'end')]);

    expect(result.errors).toEqual([]);
  });

  it('requires exactly one Start node', () => {
    const nodes = [makeNode('start-a', 'start'), makeNode('start-b', 'start'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('start-a', 'end')]);

    expect(result.errors).toContain('Workflow must contain exactly one Start node.');
  });

  it('requires at least one End node', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task')];
    const result = validateWorkflow(nodes, [edge('start', 'task')]);

    expect(result.errors).toContain('Workflow must contain at least one End node.');
  });

  it('does not allow incoming edges to Start nodes', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('task', 'start'), edge('start', 'end')]);

    expect(result.nodeErrors.start).toContain('Start node must be the first step and cannot have incoming connections.');
  });

  it('requires incoming connections for non-Start nodes', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('start', 'end')]);

    expect(result.nodeErrors.task).toContain('Task needs an incoming connection.');
  });

  it('requires outgoing connections for non-End nodes', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('start', 'task')]);

    expect(result.nodeErrors.task).toContain('Task needs an outgoing connection.');
  });

  it('rejects cycles', () => {
    const nodes = [makeNode('start', 'start'), makeNode('task', 'task'), makeNode('end', 'end')];
    const result = validateWorkflow(nodes, [edge('start', 'task'), edge('task', 'start'), edge('task', 'end')]);

    expect(result.errors).toContain('Workflow contains a cycle. Simulation requires a directed path.');
  });

  it('requires Task title and Automation action', () => {
    const nodes = [
      makeNode('start', 'start'),
      makeNode('task', 'task', { title: '' } as Partial<WorkflowNodeData>),
      makeNode('automation', 'automation', { actionId: '' } as Partial<WorkflowNodeData>),
      makeNode('end', 'end'),
    ];
    const result = validateWorkflow(nodes, [edge('start', 'task'), edge('task', 'automation'), edge('automation', 'end')]);

    expect(result.nodeErrors.task).toContain('Task title is required.');
    expect(result.nodeErrors.automation).toContain('Automated Step requires an action.');
  });

  it('accepts every built-in workflow template', () => {
    const results = workflowTemplates.map((template) => ({
      name: template.name,
      nodeCount: template.nodes.length,
      errors: validateWorkflow(template.nodes, template.edges).errors,
    }));

    expect(results.map((result) => [result.name, result.nodeCount])).toEqual([
      ['Employee Onboarding', 12],
      ['Leave Approval', 12],
      ['Document Verification', 12],
      ['Asset Request', 12],
    ]);
    expect(results.flatMap((result) => result.errors)).toEqual([]);
  });
});
