import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
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
      versionHistory: [],
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
      versionHistory: [],
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
      versionHistory: [],
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
      versionHistory: [],
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
      versionHistory: [],
      endMessage: 'Employee onboarding is complete.',
      summary: true,
    }),
  },
];

export const templateByType = Object.fromEntries(
  nodeTemplates.map((template) => [template.type, template]),
) as Record<WorkflowNodeType, NodeTemplate>;
