import { PlusCircle } from 'lucide-react';
import { nodeTemplates } from '../data/nodeTemplates';
import { workflowTemplates } from '../data/workflowTemplates';
import type { WorkflowNodeType } from '../types/workflow';

type Props = {
  onAddNode: (type: WorkflowNodeType) => void;
  onCreateBlank: () => void;
  onLoadTemplate: (templateId: string) => void;
};

export function CanvasTemplateTray({ onAddNode, onCreateBlank, onLoadTemplate }: Props) {
  const onDragStart = (event: React.DragEvent, type: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <section className="canvas-node-palette" aria-label="Node templates">
        <p className="section-label">Node Templates</p>
        <div className="canvas-node-list">
          {nodeTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                className="canvas-node-template"
                draggable
                key={template.type}
                onClick={() => onAddNode(template.type)}
                onDragStart={(event) => onDragStart(event, template.type)}
                type="button"
                title={`Add ${template.label} node`}
              >
                <span style={{ color: template.color }}>
                  <Icon size={16} />
                </span>
                {template.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="canvas-workflow-palette" aria-label="Workflow templates">
        <div className="canvas-tray-heading">
          <p className="section-label">HR Workflow Templates</p>
          <button className="canvas-workflow-chip canvas-workflow-chip--blank" type="button" onClick={onCreateBlank}>
            <PlusCircle size={15} />
            Create From Scratch
          </button>
        </div>
        <div className="canvas-workflow-list">
          {workflowTemplates.map((template) => (
            <button className="canvas-workflow-chip" key={template.id} type="button" onClick={() => onLoadTemplate(template.id)}>
              <strong>{template.name}</strong>
              <span>{template.nodes.length} steps</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
