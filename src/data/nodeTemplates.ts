import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Flag,
  PlayCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflow';

export type NodeTemplate = {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
  createData: () => WorkflowNodeData;
};

const uid = () => Math.random().toString(36).slice(2, 8);

export const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Workflow entry point',
    icon: PlayCircle,
    color: '#13a8b5',
    createData: () => ({
      type: 'start',
      label: 'New onboarding request',
      startTitle: 'New onboarding request',
      metadata: [{ id: uid(), key: 'source', value: 'HR portal' }],
    }),
  },
  {
    type: 'task',
    label: 'Task',
    description: 'Human-owned work item',
    icon: ClipboardCheck,
    color: '#7c5cff',
    createData: () => ({
      type: 'task',
      label: 'Collect documents',
      title: 'Collect documents',
      description: 'Request required employee documents.',
      assignee: 'HR coordinator',
      dueDate: '',
      customFields: [{ id: uid(), key: 'documentType', value: 'ID proof' }],
    }),
  },
  {
    type: 'approval',
    label: 'Approval',
    description: 'Manager or HR approval',
    icon: CheckCircle2,
    color: '#16a36f',
    createData: () => ({
      type: 'approval',
      label: 'Manager approval',
      title: 'Manager approval',
      approverRole: 'Manager',
      autoApproveThreshold: 0,
    }),
  },
  {
    type: 'automation',
    label: 'Automated Step',
    description: 'System-triggered action',
    icon: Bot,
    color: '#e57c23',
    createData: () => ({
      type: 'automation',
      label: 'Send welcome email',
      title: 'Send welcome email',
      actionId: 'send_email',
      actionParams: { to: 'employee.email', subject: 'Welcome aboard' },
    }),
  },
  {
    type: 'end',
    label: 'End',
    description: 'Workflow completion',
    icon: Flag,
    color: '#d64550',
    createData: () => ({
      type: 'end',
      label: 'Onboarding complete',
      endMessage: 'Employee onboarding is complete.',
      summary: true,
    }),
  },
];

export const templateByType = Object.fromEntries(
  nodeTemplates.map((template) => [template.type, template]),
) as Record<WorkflowNodeType, NodeTemplate>;

export const seededWorkflow = {
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 80, y: 150 },
      data: nodeTemplates[0].createData(),
    },
    {
      id: 'task-1',
      type: 'task',
      position: { x: 370, y: 95 },
      data: nodeTemplates[1].createData(),
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 680, y: 95 },
      data: nodeTemplates[2].createData(),
    },
    {
      id: 'automation-1',
      type: 'automation',
      position: { x: 680, y: 300 },
      data: {
        ...nodeTemplates[3].createData(),
        title: 'Generate offer packet',
        label: 'Generate offer packet',
        actionId: 'generate_doc',
        actionParams: { template: 'onboarding_packet', recipient: 'employee.email' },
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 1000, y: 190 },
      data: nodeTemplates[4].createData(),
    },
  ],
  edges: [
    { id: 'e-start-task', source: 'start-1', target: 'task-1', animated: true },
    { id: 'e-task-approval', source: 'task-1', target: 'approval-1', animated: true },
    { id: 'e-approval-automation', source: 'approval-1', target: 'automation-1', animated: true },
    { id: 'e-automation-end', source: 'automation-1', target: 'end-1', animated: true },
  ],
};

export const FileCheckIcon = FileCheck2;
