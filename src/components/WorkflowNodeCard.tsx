import { Handle, Position } from '@xyflow/react';
import { AlertTriangle } from 'lucide-react';
import { templateByType } from '../data/nodeTemplates';
import type { WorkflowNodeData } from '../types/workflow';

export function WorkflowNodeCard({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  const template = templateByType[data.type];
  const Icon = template.icon;
  const hasErrors = Boolean(data.validationErrors?.length);

  return (
    <div
      className={[
        'workflow-node',
        selected ? 'workflow-node--selected' : '',
        hasErrors ? 'workflow-node--error' : '',
      ].join(' ')}
      style={{ '--node-color': template.color } as React.CSSProperties}
    >
      {data.type !== 'start' && <Handle className="node-handle" type="target" position={Position.Left} />}
      <div className="node-icon">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="node-copy">
        <span>{template.label}</span>
        <strong>{data.label}</strong>
        <small>{subtitleFor(data)}</small>
      </div>
      {hasErrors && (
        <div className="node-alert" title={data.validationErrors?.join('\n')}>
          <AlertTriangle size={15} />
        </div>
      )}
      {data.type !== 'end' && <Handle className="node-handle" type="source" position={Position.Right} />}
    </div>
  );
}

function subtitleFor(data: WorkflowNodeData) {
  switch (data.type) {
    case 'start':
      return `${data.metadata.length} metadata fields`;
    case 'task':
      return data.assignee ? `Assigned to ${data.assignee}` : 'Unassigned task';
    case 'approval':
      return `${data.approverRole} approval`;
    case 'automation':
      return data.actionId || 'Choose an action';
    case 'end':
      return data.summary ? 'Includes summary' : 'No summary';
  }
}
