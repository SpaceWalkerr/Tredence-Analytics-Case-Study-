import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileClock,
  GitBranch,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
        <div className="dashboard-hero-copy">
          <div className="brand">
            <div className="brand-mark">SW</div>
            <div>
              <strong>SpaceWalker</strong>
              <span>HR Workflow Studio</span>
            </div>
          </div>
          <div className="premium-eyebrow">
            <Sparkles size={14} />
            Enterprise workflow orchestration
          </div>
          <div>
            <h1>Build powerful HR workflows with precision.</h1>
            <p className="dashboard-tagline">A modern platform for designing, validating, and simulating enterprise HR processes—no coding required.</p>
          </div>
          <p>
            Start from a realistic HR process, customize every node, validate branches, and simulate approvals before exporting
            the workflow.
          </p>
          <div className="dashboard-stats">
            <span>
              <strong>4</strong>
              Ready templates
            </span>
            <span>
              <strong>12</strong>
              Steps per flow
            </span>
            <span>
              <strong>3</strong>
              Approval paths
            </span>
          </div>
          <div className="dashboard-actions">
            <button className="primary-button" type="button" onClick={onCreateBlank}>
              <PlusCircle size={16} />
              Create New Workflow
            </button>
            {hasSavedWorkflow ? (
              <button className="ghost-button" type="button" onClick={onOpenSaved}>
                <FileClock size={16} />
                Continue Saved Workflow
              </button>
            ) : null}
          </div>
        </div>

        <aside className="dashboard-command-card">
          <div className="command-card-header">
            <div>
              <p className="section-label">Live Command Center</p>
              <h2>Workflow readiness</h2>
            </div>
            <span>Live</span>
          </div>
          <div className="readiness-meter">
            <span style={{ width: '82%' }} />
          </div>
          <div className="command-metrics">
            <div>
              <ShieldCheck size={18} />
              <strong>Validated</strong>
              <p>Rules, paths, and required fields</p>
            </div>
            <div>
              <GitBranch size={18} />
              <strong>Branch-aware</strong>
              <p>Approved, rejected, correction</p>
            </div>
            <div>
              <Clock3 size={18} />
              <strong>Simulated</strong>
              <p>Owners, timing, skipped paths</p>
            </div>
          </div>
        </aside>
      </section>

      <div className="dashboard-section-title">
        <div>
          <p className="section-label">Workflow Library</p>
          <h2>Choose a starting point</h2>
        </div>
        <span>{workflowTemplates.length} templates + blank canvas</span>
      </div>

      <section className="workflow-grid">
        <button className="workflow-list-card workflow-list-card--blank" type="button" onClick={onCreateBlank}>
          <div className="card-icon card-icon--blank">
            <PlusCircle size={18} />
          </div>
          <span>Create From Scratch</span>
          <p>Start with an empty canvas and build your own workflow using Start, Task, Approval, Automation, and End nodes.</p>
          <div className="template-meta">
            <span>Custom</span>
            <span>All nodes</span>
          </div>
          <strong>
            New blank workflow
            <PlusCircle size={15} />
          </strong>
        </button>
        {workflowTemplates.map((template, index) => (
          <button className="workflow-list-card" key={template.id} type="button" onClick={() => onSelectTemplate(template.id)}>
            <div className="card-icon">
              <CheckCircle2 size={18} />
            </div>
            <span>{template.name}</span>
            <p>{template.description}</p>
            <div className="template-meta">
              <span>{template.nodes.length} steps</span>
              <span>{index + 2} approvals</span>
            </div>
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
