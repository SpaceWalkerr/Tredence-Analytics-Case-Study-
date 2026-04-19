import type { WorkflowEdge, WorkflowNode, WorkflowNodeData, WorkflowNodeType } from '../types/workflow';

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

type NodeSeed = {
  id: string;
  type: WorkflowNodeType;
  x: number;
  y: number;
  data: WorkflowNodeData;
};

const base = {
  versionHistory: [],
};

const start = (label: string, source: string): WorkflowNodeData => ({
  ...base,
  type: 'start',
  label,
  startTitle: label,
  metadata: [{ id: cryptoId(), key: 'source', value: source }],
});

const task = (label: string, assignee: string, description: string): WorkflowNodeData => ({
  ...base,
  type: 'task',
  label,
  title: label,
  description,
  assignee,
  dueDate: '',
  customFields: [],
});

const approval = (label: string, approverRole: string): WorkflowNodeData => ({
  ...base,
  type: 'approval',
  label,
  title: label,
  approverRole,
  autoApproveThreshold: 0,
});

const automation = (
  label: string,
  actionId: string,
  actionParams: Record<string, string>,
): WorkflowNodeData => ({
  ...base,
  type: 'automation',
  label,
  title: label,
  actionId,
  actionParams,
});

const end = (message: string): WorkflowNodeData => ({
  ...base,
  type: 'end',
  label: message,
  endMessage: message,
  summary: true,
});

const makeWorkflow = (
  id: string,
  name: string,
  description: string,
  nodes: NodeSeed[],
  edgePairs: Array<[string, string, string?]>,
): WorkflowTemplate => ({
  id,
  name,
  description,
  nodes: nodes.map((node) => ({
    id: `${id}-${node.id}`,
    type: node.type,
    position: { x: node.x, y: node.y },
    data: node.data,
  })),
  edges: edgePairs.map(([source, target, label]) => ({
    id: `${id}-${source}-${target}`,
    source: `${id}-${source}`,
    target: `${id}-${target}`,
    animated: true,
    label,
    data: { label, condition: conditionFromLabel(label) },
  })),
});

export const workflowTemplates: WorkflowTemplate[] = [
  makeWorkflow(
    'employee-onboarding',
    'Employee Onboarding',
    'Collect documents, approve joining, prepare systems, and finish onboarding.',
    [
      { id: 'start', type: 'start', x: 40, y: 170, data: start('New employee hired', 'Recruiting system') },
      { id: 'docs', type: 'task', x: 330, y: 100, data: task('Collect joining documents', 'HR coordinator', 'Collect ID proof, tax forms, and signed offer letter.') },
      { id: 'approval', type: 'approval', x: 650, y: 100, data: approval('Manager joining approval', 'Manager') },
      { id: 'ticket', type: 'automation', x: 650, y: 320, data: automation('Create IT setup ticket', 'create_ticket', { queue: 'IT onboarding', priority: 'High' }) },
      { id: 'email', type: 'automation', x: 960, y: 210, data: automation('Send welcome email', 'send_email', { to: 'employee.email', subject: 'Welcome to the team' }) },
      { id: 'end', type: 'end', x: 1240, y: 210, data: end('Employee onboarding completed') },
    ],
    [
      ['start', 'docs'],
      ['docs', 'approval'],
      ['approval', 'ticket', 'Approved'],
      ['approval', 'end', 'Needs correction'],
      ['ticket', 'email'],
      ['email', 'end'],
    ],
  ),
  makeWorkflow(
    'leave-approval',
    'Leave Approval',
    'Review a leave request, notify the employee, and close the request.',
    [
      { id: 'start', type: 'start', x: 60, y: 170, data: start('Leave request submitted', 'Employee self-service') },
      { id: 'review', type: 'task', x: 350, y: 120, data: task('Check leave balance', 'HR operations', 'Verify leave balance and policy eligibility.') },
      { id: 'approval', type: 'approval', x: 660, y: 120, data: approval('Manager leave approval', 'Manager') },
      { id: 'notify-ok', type: 'automation', x: 960, y: 40, data: automation('Notify approval', 'send_email', { to: 'employee.email', subject: 'Leave approved' }) },
      { id: 'notify-no', type: 'automation', x: 960, y: 250, data: automation('Notify rejection', 'send_email', { to: 'employee.email', subject: 'Leave request update' }) },
      { id: 'end', type: 'end', x: 1250, y: 150, data: end('Leave request closed') },
    ],
    [
      ['start', 'review'],
      ['review', 'approval'],
      ['approval', 'notify-ok', 'Approved'],
      ['approval', 'notify-no', 'Rejected'],
      ['notify-ok', 'end'],
      ['notify-no', 'end'],
    ],
  ),
  makeWorkflow(
    'document-verification',
    'Document Verification',
    'Collect documents, verify them, fix issues, and generate confirmation.',
    [
      { id: 'start', type: 'start', x: 60, y: 180, data: start('Document packet received', 'HR document portal') },
      { id: 'collect', type: 'task', x: 340, y: 110, data: task('Review submitted documents', 'HR compliance', 'Check that all required documents are present.') },
      { id: 'approval', type: 'approval', x: 650, y: 110, data: approval('Compliance verification', 'HRBP') },
      { id: 'fix', type: 'task', x: 650, y: 320, data: task('Request corrected documents', 'Employee', 'Ask employee to upload missing or corrected documents.') },
      { id: 'doc', type: 'automation', x: 960, y: 150, data: automation('Generate verification receipt', 'generate_doc', { template: 'verification_receipt', recipient: 'employee.email' }) },
      { id: 'end', type: 'end', x: 1240, y: 150, data: end('Documents verified') },
    ],
    [
      ['start', 'collect'],
      ['collect', 'approval'],
      ['approval', 'doc', 'Approved'],
      ['approval', 'fix', 'Needs correction'],
      ['fix', 'end'],
      ['doc', 'end'],
    ],
  ),
  makeWorkflow(
    'asset-request',
    'Asset Request',
    'Request, approve, prepare, and hand over an employee asset.',
    [
      { id: 'start', type: 'start', x: 60, y: 180, data: start('Asset requested', 'Service desk') },
      { id: 'task', type: 'task', x: 350, y: 130, data: task('Check asset availability', 'Admin team', 'Check laptop, monitor, and accessory availability.') },
      { id: 'approval', type: 'approval', x: 660, y: 130, data: approval('Budget approval', 'Director') },
      { id: 'ticket', type: 'automation', x: 960, y: 70, data: automation('Create fulfillment ticket', 'create_ticket', { queue: 'Facilities', priority: 'Medium' }) },
      { id: 'reject', type: 'automation', x: 960, y: 270, data: automation('Notify unavailable request', 'send_email', { to: 'requester.email', subject: 'Asset request update' }) },
      { id: 'end', type: 'end', x: 1260, y: 160, data: end('Asset request completed') },
    ],
    [
      ['start', 'task'],
      ['task', 'approval'],
      ['approval', 'ticket', 'Approved'],
      ['approval', 'reject', 'Rejected'],
      ['ticket', 'end'],
      ['reject', 'end'],
    ],
  ),
  makeWorkflow(
    'exit-process',
    'Exit Process',
    'Coordinate exit formalities, revoke access, and complete final confirmation.',
    [
      { id: 'start', type: 'start', x: 60, y: 190, data: start('Exit initiated', 'HRIS') },
      { id: 'handover', type: 'task', x: 340, y: 120, data: task('Collect handover checklist', 'Manager', 'Confirm knowledge transfer and project handover.') },
      { id: 'approval', type: 'approval', x: 650, y: 120, data: approval('HR exit approval', 'HRBP') },
      { id: 'access', type: 'automation', x: 960, y: 70, data: automation('Create access removal ticket', 'create_ticket', { queue: 'Security', priority: 'High' }) },
      { id: 'letter', type: 'automation', x: 960, y: 270, data: automation('Generate relieving letter', 'generate_doc', { template: 'relieving_letter', recipient: 'employee.email' }) },
      { id: 'end', type: 'end', x: 1260, y: 170, data: end('Exit process completed') },
    ],
    [
      ['start', 'handover'],
      ['handover', 'approval'],
      ['approval', 'access', 'Approved'],
      ['approval', 'letter', 'Needs correction'],
      ['access', 'letter'],
      ['letter', 'end'],
    ],
  ),
];

export const defaultWorkflowTemplate = workflowTemplates[0];

export function cloneWorkflow(template: WorkflowTemplate) {
  return {
    nodes: structuredClone(template.nodes) as WorkflowNode[],
    edges: structuredClone(template.edges) as WorkflowEdge[],
  };
}

function conditionFromLabel(label?: string) {
  if (label === 'Approved') return 'approved';
  if (label === 'Rejected') return 'rejected';
  if (label === 'Needs correction') return 'needs_correction';
  return 'standard';
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 8);
}
