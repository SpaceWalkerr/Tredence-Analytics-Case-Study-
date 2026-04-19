import { ArrowRight, FileClock, PlusCircle } from 'lucide-react';
import { workflowTemplates } from '../data/workflowTemplates';

type Props = {
  hasSavedWorkflow: boolean;
  onCreateBlank: () => void;
  onOpenSaved: () => void;
  onSelectTemplate: (templateId: string) => void;
};

export function WorkflowDashboard({ hasSavedWorkflow, onCreateBlank, onOpenSaved, onSelectTemplate }: Props) {
  return (
    <main className="dashboard-screen">
      <section className="dashboard-hero">
        <div className="brand">
          <div className="brand-mark">SW</div>
          <div>
            <strong>SpaceWalker</strong>
            <span>HR Workflow Studio</span>
          </div>
        </div>
        <h1>Choose a workflow to design</h1>
        <p>Start from a realistic HR process, then edit the canvas, forms, approvals, and simulation paths.</p>
        {hasSavedWorkflow ? (
          <button className="primary-button" type="button" onClick={onOpenSaved}>
            <FileClock size={16} />
            Continue Saved Workflow
          </button>
        ) : null}
      </section>

      <section className="workflow-grid">
        <button className="workflow-list-card workflow-list-card--blank" type="button" onClick={onCreateBlank}>
          <span>Create From Scratch</span>
          <p>Start with an empty canvas and build your own workflow using Start, Task, Approval, Automation, and End nodes.</p>
          <strong>
            New blank workflow
            <PlusCircle size={15} />
          </strong>
        </button>
        {workflowTemplates.map((template) => (
          <button className="workflow-list-card" key={template.id} type="button" onClick={() => onSelectTemplate(template.id)}>
            <span>{template.name}</span>
            <p>{template.description}</p>
            <strong>
              Open template
              <ArrowRight size={15} />
            </strong>
          </button>
        ))}
      </section>
    </main>
  );
}
