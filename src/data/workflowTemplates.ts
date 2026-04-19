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
    position: {
      x: Math.round(node.x * 1.22),
      y: Math.round(node.y * 1.18),
    },
    data: node.data,
  })),
  edges: edgePairs.map(([source, target, label]) => ({
    id: `${id}-${source}-${target}`,
    source: `${id}-${source}`,
    target: `${id}-${target}`,
    animated: true,
    label,
    type: 'workflow',
    data: { label, condition: conditionFromLabel(label) },
  })),
});

export const workflowTemplates: WorkflowTemplate[] = [
  makeWorkflow(
    'employee-onboarding',
    'Employee Onboarding',
    'A full onboarding flow with HR, manager, IT, payroll, compliance, and welcome steps.',
    [
      { id: 'start', type: 'start', x: 20, y: 260, data: start('Offer accepted', 'Recruiting system') },
      { id: 'profile', type: 'task', x: 300, y: 80, data: task('Create employee profile', 'HR coordinator', 'Create HRIS record, employee ID, and joining checklist.') },
      { id: 'documents', type: 'task', x: 300, y: 250, data: task('Collect joining documents', 'Employee', 'Collect ID proof, tax forms, bank details, and signed policies.') },
      { id: 'background', type: 'automation', x: 300, y: 430, data: automation('Trigger background check', 'create_ticket', { queue: 'Background verification', priority: 'High' }) },
      { id: 'doc-review', type: 'approval', x: 610, y: 190, data: approval('HR document approval', 'HRBP') },
      { id: 'manager', type: 'approval', x: 610, y: 390, data: approval('Manager start approval', 'Manager') },
      { id: 'it-ticket', type: 'automation', x: 920, y: 80, data: automation('Create IT provisioning ticket', 'create_ticket', { queue: 'IT onboarding', priority: 'High' }) },
      { id: 'payroll', type: 'task', x: 920, y: 250, data: task('Setup payroll and benefits', 'Payroll specialist', 'Configure salary, tax details, benefits, and statutory deductions.') },
      { id: 'access', type: 'automation', x: 920, y: 430, data: automation('Notify access team', 'notify_slack', { channel: '#it-access', message: 'Provision accounts for new hire' }) },
      { id: 'welcome', type: 'automation', x: 1230, y: 170, data: automation('Send welcome pack', 'send_email', { to: 'employee.email', subject: 'Welcome to SpaceWalker' }) },
      { id: 'orientation', type: 'task', x: 1230, y: 360, data: task('Schedule orientation', 'L&D coordinator', 'Book orientation, buddy assignment, and first-week agenda.') },
      { id: 'end', type: 'end', x: 1540, y: 260, data: end('Employee onboarding completed') },
    ],
    [
      ['start', 'profile'],
      ['start', 'documents'],
      ['start', 'background'],
      ['profile', 'doc-review'],
      ['documents', 'doc-review'],
      ['background', 'manager'],
      ['doc-review', 'it-ticket', 'Approved'],
      ['doc-review', 'orientation', 'Needs correction'],
      ['manager', 'access', 'Approved'],
      ['manager', 'orientation', 'Needs correction'],
      ['it-ticket', 'payroll'],
      ['payroll', 'welcome'],
      ['access', 'orientation'],
      ['welcome', 'end'],
      ['orientation', 'end'],
    ],
  ),
  makeWorkflow(
    'leave-approval',
    'Leave Approval',
    'A multi-check leave process with policy checks, manager approval, payroll sync, and calendar updates.',
    [
      { id: 'start', type: 'start', x: 20, y: 260, data: start('Leave request submitted', 'Employee self-service') },
      { id: 'balance', type: 'task', x: 300, y: 80, data: task('Check leave balance', 'HR operations', 'Verify available leave balance and carry-forward rules.') },
      { id: 'policy', type: 'task', x: 300, y: 250, data: task('Validate policy rules', 'HR operations', 'Check blackout dates, notice period, and leave category limits.') },
      { id: 'coverage', type: 'task', x: 300, y: 430, data: task('Check team coverage', 'Team lead', 'Confirm project coverage and backup owner during absence.') },
      { id: 'manager', type: 'approval', x: 620, y: 170, data: approval('Manager approval', 'Manager') },
      { id: 'hrbp', type: 'approval', x: 620, y: 370, data: approval('HRBP exception approval', 'HRBP') },
      { id: 'calendar', type: 'automation', x: 940, y: 80, data: automation('Create calendar block', 'create_ticket', { queue: 'HR calendar', priority: 'Medium' }) },
      { id: 'payroll', type: 'automation', x: 940, y: 250, data: automation('Sync payroll leave code', 'generate_doc', { template: 'leave_payroll_sync', recipient: 'payroll.system' }) },
      { id: 'reject', type: 'automation', x: 940, y: 430, data: automation('Send rejection note', 'send_email', { to: 'employee.email', subject: 'Leave request update' }) },
      { id: 'handoff', type: 'task', x: 1250, y: 160, data: task('Confirm handoff plan', 'Employee', 'Upload handoff notes and notify backup owner.') },
      { id: 'notify', type: 'automation', x: 1250, y: 350, data: automation('Notify stakeholders', 'notify_slack', { channel: '#team-availability', message: 'Leave request status updated' }) },
      { id: 'end', type: 'end', x: 1560, y: 260, data: end('Leave request closed') },
    ],
    [
      ['start', 'balance'],
      ['start', 'policy'],
      ['start', 'coverage'],
      ['balance', 'manager'],
      ['policy', 'manager'],
      ['coverage', 'hrbp'],
      ['manager', 'calendar', 'Approved'],
      ['manager', 'reject', 'Rejected'],
      ['manager', 'hrbp', 'Needs correction'],
      ['hrbp', 'payroll', 'Approved'],
      ['hrbp', 'reject', 'Rejected'],
      ['calendar', 'handoff'],
      ['payroll', 'notify'],
      ['reject', 'end'],
      ['handoff', 'end'],
      ['notify', 'end'],
    ],
  ),
  makeWorkflow(
    'document-verification',
    'Document Verification',
    'A compliance-heavy document verification process with checks, exceptions, correction paths, and receipts.',
    [
      { id: 'start', type: 'start', x: 20, y: 260, data: start('Document packet received', 'HR document portal') },
      { id: 'intake', type: 'task', x: 300, y: 80, data: task('Index submitted files', 'Document specialist', 'Name, tag, and classify all uploaded files.') },
      { id: 'identity', type: 'task', x: 300, y: 250, data: task('Verify identity proof', 'HR compliance', 'Match government ID with employee profile and offer data.') },
      { id: 'bank', type: 'task', x: 300, y: 430, data: task('Verify bank and tax forms', 'Payroll specialist', 'Check bank details, tax declaration, and required signatures.') },
      { id: 'ocr', type: 'automation', x: 610, y: 80, data: automation('Run OCR extraction', 'generate_doc', { template: 'ocr_extract', recipient: 'document.system' }) },
      { id: 'compliance', type: 'approval', x: 610, y: 260, data: approval('Compliance approval', 'HRBP') },
      { id: 'legal', type: 'approval', x: 610, y: 440, data: approval('Legal exception review', 'Director') },
      { id: 'correction', type: 'task', x: 930, y: 80, data: task('Request corrected documents', 'Employee', 'Ask employee to replace missing or unreadable documents.') },
      { id: 'receipt', type: 'automation', x: 930, y: 250, data: automation('Generate verification receipt', 'generate_doc', { template: 'verification_receipt', recipient: 'employee.email' }) },
      { id: 'archive', type: 'automation', x: 930, y: 430, data: automation('Archive approved packet', 'create_ticket', { queue: 'Document archive', priority: 'Low' }) },
      { id: 'notify', type: 'automation', x: 1240, y: 250, data: automation('Notify HR operations', 'notify_slack', { channel: '#hr-ops', message: 'Document packet verification completed' }) },
      { id: 'end', type: 'end', x: 1540, y: 250, data: end('Documents verified') },
    ],
    [
      ['start', 'intake'],
      ['start', 'identity'],
      ['start', 'bank'],
      ['intake', 'ocr'],
      ['identity', 'compliance'],
      ['bank', 'compliance'],
      ['ocr', 'compliance'],
      ['compliance', 'receipt', 'Approved'],
      ['compliance', 'correction', 'Needs correction'],
      ['compliance', 'legal', 'Rejected'],
      ['legal', 'archive', 'Approved'],
      ['legal', 'correction', 'Needs correction'],
      ['correction', 'notify'],
      ['receipt', 'archive'],
      ['archive', 'notify'],
      ['notify', 'end'],
    ],
  ),
  makeWorkflow(
    'asset-request',
    'Asset Request',
    'A full asset request process covering budget, stock, procurement, configuration, and handover.',
    [
      { id: 'start', type: 'start', x: 20, y: 260, data: start('Asset requested', 'Service desk') },
      { id: 'need', type: 'task', x: 300, y: 80, data: task('Validate business need', 'Manager', 'Confirm role, project, and asset justification.') },
      { id: 'stock', type: 'task', x: 300, y: 250, data: task('Check stock availability', 'Admin team', 'Check laptop, monitor, headset, and accessory stock.') },
      { id: 'budget', type: 'task', x: 300, y: 430, data: task('Estimate budget impact', 'Finance analyst', 'Estimate purchase or allocation cost.') },
      { id: 'manager', type: 'approval', x: 610, y: 160, data: approval('Manager approval', 'Manager') },
      { id: 'finance', type: 'approval', x: 610, y: 360, data: approval('Finance approval', 'Finance') },
      { id: 'procure', type: 'automation', x: 930, y: 70, data: automation('Create procurement ticket', 'create_ticket', { queue: 'Procurement', priority: 'Medium' }) },
      { id: 'configure', type: 'automation', x: 930, y: 250, data: automation('Create device setup ticket', 'create_ticket', { queue: 'IT hardware', priority: 'High' }) },
      { id: 'reject', type: 'automation', x: 930, y: 440, data: automation('Notify rejection', 'send_email', { to: 'requester.email', subject: 'Asset request decision' }) },
      { id: 'handover', type: 'task', x: 1240, y: 160, data: task('Schedule asset handover', 'Facilities coordinator', 'Confirm pickup, courier, or desk delivery plan.') },
      { id: 'ack', type: 'automation', x: 1240, y: 350, data: automation('Generate asset acknowledgement', 'generate_doc', { template: 'asset_acknowledgement', recipient: 'employee.email' }) },
      { id: 'end', type: 'end', x: 1540, y: 260, data: end('Asset request completed') },
    ],
    [
      ['start', 'need'],
      ['start', 'stock'],
      ['start', 'budget'],
      ['need', 'manager'],
      ['stock', 'manager'],
      ['budget', 'finance'],
      ['manager', 'configure', 'Approved'],
      ['manager', 'reject', 'Rejected'],
      ['manager', 'finance', 'Needs correction'],
      ['finance', 'procure', 'Approved'],
      ['finance', 'reject', 'Rejected'],
      ['procure', 'configure'],
      ['configure', 'handover'],
      ['handover', 'ack'],
      ['ack', 'end'],
      ['reject', 'end'],
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
