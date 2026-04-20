import {
  ArrowRight,
  FileClock,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { workflowTemplates } from '../data/workflowTemplates';
import MountainVistaParallax from './ui/mountain-vista-bg';

type Props = {
  hasSavedWorkflow: boolean;
  onCreateBlank: () => void;
  onOpenSaved: () => void;
  onSelectTemplate: (templateId: string) => void;
};

const cardAccents = ['teal', 'amber', 'red', 'indigo'];


export function WorkflowDashboard({ hasSavedWorkflow, onCreateBlank, onOpenSaved, onSelectTemplate }: Props) {
  return (
    <main className="dashboard-screen">
      <section className="dashboard-hero">
        <MountainVistaParallax />
        <div className="dashboard-hero-copy">
          <div className="hero-eyebrow">
            <Sparkles size={14} />
            Visual workflow canvas
          </div>
          <div>
            <h1>Build HR workflows that are ready to run.</h1>
            <p className="dashboard-tagline">
              Design onboarding, leave approval, document verification, and internal service flows on a visual canvas.
            </p>
          </div>
          <p>
            Configure every node, validate the structure, and test the path in a sandbox before sharing the workflow.
          </p>
          <div className="dashboard-actions">
            <button className="primary-button" type="button" onClick={onCreateBlank}>
              <PlusCircle size={16} />
              Create From Scratch
            </button>
            {hasSavedWorkflow ? (
              <button className="ghost-button" type="button" onClick={onOpenSaved}>
                <FileClock size={16} />
                Continue Saved Workflow
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="dashboard-section-title">
        <div>
          <p className="section-label">Workflow Library</p>
          <h2>Choose a starting point</h2>
        </div>
      </div>

      <section className="workflow-grid">
        <button className="workflow-list-card workflow-list-card--blank" type="button" onClick={onCreateBlank}>
          <strong className="workflow-card-title">Create From Scratch</strong>
          <p>Start with an empty canvas and build your workflow using Start, Task, Approval, Automation, and End nodes.</p>
          <span className="workflow-card-action">
            New blank workflow
            <PlusCircle size={15} />
          </span>
        </button>
        {workflowTemplates.map((template, index) => {
          const accent = cardAccents[index] ?? cardAccents[0];
          return (
            <button
              className={`workflow-list-card workflow-list-card--${accent}`}
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
            >
              <strong className="workflow-card-title">{template.name}</strong>
              <p>{template.description}</p>
              <span className="workflow-card-action">
                Open template
                <ArrowRight size={15} />
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
