import { Download, Upload } from 'lucide-react';
import { nodeTemplates } from '../data/nodeTemplates';
import type { WorkflowNodeType } from '../types/workflow';

type Props = {
  onExport: () => void;
  onImport: (file: File) => void;
};

export function Sidebar({ onExport, onImport }: Props) {
  const onDragStart = (event: React.DragEvent, type: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">H</div>
        <div>
          <strong>HR Flow</strong>
          <span>Designer</span>
        </div>
      </div>

      <section className="side-section">
        <p className="section-label">Node Templates</p>
        <div className="template-list">
          {nodeTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                className="template-card"
                draggable
                key={template.type}
                onDragStart={(event) => onDragStart(event, template.type)}
                type="button"
              >
                <span className="template-icon" style={{ color: template.color }}>
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{template.label}</strong>
                  <small>{template.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="side-section">
        <p className="section-label">Workflow JSON</p>
        <div className="side-actions">
          <button className="ghost-button" type="button" onClick={onExport}>
            <Download size={16} />
            Export
          </button>
          <label className="ghost-button file-button">
            <Upload size={16} />
            Import
            <input
              accept="application/json"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </section>
    </aside>
  );
}
