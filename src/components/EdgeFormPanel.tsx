import { GitBranch, Trash2 } from 'lucide-react';
import type { WorkflowEdge } from '../types/workflow';

type Props = {
  edge?: WorkflowEdge;
  onDelete: (edgeId: string) => void;
  onUpdate: (edgeId: string, edge: WorkflowEdge) => void;
};

export function EdgeFormPanel({ edge, onDelete, onUpdate }: Props) {
  if (!edge) return null;

  const label = String(edge.label ?? edge.data?.label ?? '');

  const patchLabel = (nextLabel: string) => {
    onUpdate(edge.id, {
      ...edge,
      label: nextLabel,
      type: 'workflow',
      data: {
        ...edge.data,
        label: nextLabel,
        condition: conditionFromLabel(nextLabel),
      },
    });
  };

  return (
    <div className="edge-editor">
      <div className="panel-title">
        <span className="template-icon">
          <GitBranch size={18} />
        </span>
        <div>
          <p className="section-label">Edge Form</p>
          <h2>Connection Label</h2>
        </div>
      </div>

      <label className="field-group">
        <span>Path label</span>
        <select value={label} onChange={(event) => patchLabel(event.target.value)}>
          <option value="">No label</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Needs correction">Needs correction</option>
          <option value="Ready for review">Ready for review</option>
          <option value="Completed">Completed</option>
        </select>
      </label>

      <label className="field-group">
        <span>Custom label</span>
        <input value={label} onChange={(event) => patchLabel(event.target.value)} />
      </label>

      <button className="danger-button" type="button" onClick={() => onDelete(edge.id)}>
        <Trash2 size={16} />
        Delete Connection
      </button>
    </div>
  );
}

function conditionFromLabel(label: string) {
  if (label === 'Approved') return 'approved';
  if (label === 'Rejected') return 'rejected';
  if (label === 'Needs correction') return 'needs_correction';
  return 'standard';
}
