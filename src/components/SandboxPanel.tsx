import { CheckCircle2, Loader2, X } from 'lucide-react';
import type { ApprovalOutcome, SimulationResult, WorkflowEdge, WorkflowNode } from '../types/workflow';

type Props = {
  edges: WorkflowEdge[];
  isOpen: boolean;
  isRunning: boolean;
  nodes: WorkflowNode[];
  onClose: () => void;
  onOutcomeChange: (outcome: ApprovalOutcome) => void;
  onRun: () => void;
  outcome: ApprovalOutcome;
  result?: SimulationResult;
  validationErrors: string[];
};

export function SandboxPanel({
  edges,
  isOpen,
  isRunning,
  nodes,
  onClose,
  onOutcomeChange,
  onRun,
  outcome,
  result,
  validationErrors,
}: Props) {
  if (!isOpen) return null;

  const serialized = JSON.stringify({ nodes, edges }, null, 2);

  return (
    <div className="sandbox">
      <div className="sandbox-header">
        <div>
          <p className="section-label">Workflow Test Sandbox</p>
          <h2>Simulation Run</h2>
        </div>
        <button className="icon-button" type="button" title="Close" onClick={onClose}>
          <X size={17} />
        </button>
      </div>

      <div className="sandbox-actions">
        <button className="primary-button" type="button" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
          {isRunning ? 'Running' : 'Run Simulation'}
        </button>
        <span>{nodes.length} nodes, {edges.length} edges</span>
      </div>

      <label className="field-group">
        <span>Approval outcome to test</span>
        <select value={outcome} onChange={(event) => onOutcomeChange(event.target.value as ApprovalOutcome)}>
          <option value="approved">Approved path</option>
          <option value="rejected">Rejected path</option>
          <option value="needs_correction">Needs correction path</option>
        </select>
      </label>

      {validationErrors.length ? (
        <div className="error-box">
          {validationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {result ? (
        <section className="timeline">
          <p className="section-label">Execution Log</p>
          {result.summary ? (
            <div className="simulation-summary">
              <strong>{result.summary.outcome === 'success' ? 'Successful run' : 'Blocked run'}</strong>
              <span>
                {result.summary.completedSteps}/{result.summary.totalSteps} steps · {result.summary.totalMinutes} min estimated
              </span>
            </div>
          ) : null}
          {result.ok ? (
            result.steps.map((step) => (
              <div
                className={[
                  'timeline-row',
                  `timeline-row--${step.status}`,
                  step.chosenPath ? 'timeline-row--chosen' : '',
                ].join(' ')}
                key={`${result.runId}-${step.nodeId}-${step.pathLabel ?? 'step'}`}
              >
                <span aria-hidden="true" />
                <div>
                  <strong>
                    {step.title}
                    {step.pathLabel ? <em>{step.pathLabel}</em> : null}
                  </strong>
                  <div className="step-meta">
                    <span>{step.owner}</span>
                    <span>{step.durationMinutes} min</span>
                    <span>{step.status}</span>
                  </div>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-copy">Simulation blocked until validation issues are fixed.</p>
          )}
        </section>
      ) : null}

      <section className="json-preview">
        <p className="section-label">Serialized Graph</p>
        <pre>{serialized}</pre>
      </section>
    </div>
  );
}
