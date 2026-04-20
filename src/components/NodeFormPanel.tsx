import { Trash2 } from 'lucide-react';
import { templateByType } from '../data/nodeTemplates';
import type { AutomationDefinition, WorkflowNode, WorkflowNodeData } from '../types/workflow';
import { KeyValueEditor } from './KeyValueEditor';

type Props = {
  automations: AutomationDefinition[];
  node?: WorkflowNode;
  onDelete: (nodeId: string) => void;
  onUpdate: (nodeId: string, data: WorkflowNodeData) => void;
};

export function NodeFormPanel({ automations, node, onDelete, onUpdate }: Props) {
  if (!node) {
    return null;
  }

  const template = templateByType[node.data.type];
  const Icon = template.icon;
  const patch = (data: Partial<WorkflowNodeData>) => {
    const next = { ...node.data, ...data } as WorkflowNodeData;
    onUpdate(node.id, { ...next, label: displayLabel(next) });
  };

  return (
    <div>
      <div className="panel-title">
        <span className="template-icon" style={{ color: template.color }}>
          <Icon size={18} />
        </span>
        <div>
          <p className="section-label">Node Form Panel</p>
          <h2>{template.label}</h2>
        </div>
      </div>

      {node.data.validationErrors?.length ? (
        <div className="error-box">
          {node.data.validationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="form-stack">{renderForm(node.data, patch, automations)}</div>

      <section className="history-panel">
        <p className="section-label">Version History</p>
        {node.data.versionHistory?.length ? (
          node.data.versionHistory.map((entry) => (
            <div className="history-row" key={entry.id}>
              <strong>{entry.field} changed</strong>
              <span>
                {entry.previousValue} → {entry.nextValue}
              </span>
              <small>{new Date(entry.changedAt).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p className="empty-copy">No changes tracked yet.</p>
        )}
      </section>

      <button className="danger-button" type="button" onClick={() => onDelete(node.id)}>
        <Trash2 size={16} />
        Delete Node
      </button>
    </div>
  );
}

function renderForm(
  data: WorkflowNodeData,
  patch: (data: Partial<WorkflowNodeData>) => void,
  automations: AutomationDefinition[],
) {
  switch (data.type) {
    case 'start':
      return (
        <>
          <Field label="Start title">
            <input required value={data.startTitle} onChange={(event) => patch({ startTitle: event.target.value })} />
          </Field>
          <KeyValueEditor label="Metadata" rows={data.metadata} onChange={(metadata) => patch({ metadata })} />
        </>
      );
    case 'task':
      return (
        <>
          <Field label="Title" required>
            <input required value={data.title} onChange={(event) => patch({ title: event.target.value })} />
          </Field>
          <Field label="Description">
            <textarea value={data.description} onChange={(event) => patch({ description: event.target.value })} />
          </Field>
          <Field label="Assignee">
            <input value={data.assignee} onChange={(event) => patch({ assignee: event.target.value })} />
          </Field>
          <Field label="Due date">
            <input type="date" value={data.dueDate} onChange={(event) => patch({ dueDate: event.target.value })} />
          </Field>
          <KeyValueEditor label="Custom fields" rows={data.customFields} onChange={(customFields) => patch({ customFields })} />
        </>
      );
    case 'approval':
      return (
        <>
          <Field label="Title" required>
            <input required value={data.title} onChange={(event) => patch({ title: event.target.value })} />
          </Field>
          <Field label="Approver role" required>
            <select required value={data.approverRole} onChange={(event) => patch({ approverRole: event.target.value })}>
              <option>Manager</option>
              <option>HRBP</option>
              <option>Director</option>
              <option>Finance</option>
            </select>
          </Field>
          <Field label="Auto-approve threshold" required>
            <input
              min="0"
              required
              type="number"
              value={data.autoApproveThreshold}
              onChange={(event) => patch({ autoApproveThreshold: Number(event.target.value) })}
            />
          </Field>
        </>
      );
    case 'automation': {
      const selected = automations.find((automation) => automation.id === data.actionId) ?? automations[0];
      return (
        <>
          <Field label="Title" required>
            <input required value={data.title} onChange={(event) => patch({ title: event.target.value })} />
          </Field>
          <Field label="Action" required>
            <select
              required
              value={data.actionId}
              onChange={(event) => {
                const next = automations.find((automation) => automation.id === event.target.value);
                patch({
                  actionId: event.target.value,
                  actionParams: Object.fromEntries((next?.params ?? []).map((param) => [param, data.actionParams[param] ?? ''])),
                });
              }}
            >
              {automations.map((automation) => (
                <option value={automation.id} key={automation.id}>
                  {automation.label}
                </option>
              ))}
            </select>
          </Field>
          {selected?.params.map((param) => (
            <Field label={humanize(param)} key={param} required>
              <input
                required
                value={data.actionParams[param] ?? ''}
                onChange={(event) =>
                  patch({ actionParams: { ...data.actionParams, [param]: event.target.value } })
                }
              />
            </Field>
          ))}
        </>
      );
    }
    case 'end':
      return (
        <>
          <Field label="End message" required>
            <textarea required value={data.endMessage} onChange={(event) => patch({ endMessage: event.target.value })} />
          </Field>
          <label className="toggle-row">
            <input type="checkbox" checked={data.summary} onChange={(event) => patch({ summary: event.target.checked })} />
            <span>Include run summary</span>
          </label>
        </>
      );
  }
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="field-group">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayLabel(data: WorkflowNodeData) {
  switch (data.type) {
    case 'start':
      return data.startTitle || 'Untitled start';
    case 'task':
      return data.title || 'Untitled task';
    case 'approval':
      return data.title || 'Untitled approval';
    case 'automation':
      return data.title || 'Untitled automation';
    case 'end':
      return data.endMessage || 'Untitled end';
  }
}
