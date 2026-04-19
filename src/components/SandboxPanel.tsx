import { CheckCircle2, Loader2, X } from 'lucide-react';
import type { SimulationResult, WorkflowEdge, WorkflowNode } from '../types/workflow';

type Props = {
  edges: WorkflowEdge[];
  isOpen: boolean;
  isRunning: boolean;
  nodes: WorkflowNode[];
  onClose: () => void;
  onRun: () => void;
  result?: SimulationResult;
  validationErrors: string[];
};

export function SandboxPanel({
  edges,
  isOpen,
  isRunning,
  nodes,
  onClose,
  onRun,
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
          {result.ok ? (
            result.steps.map((step) => (
              <div className="timeline-row" key={`${result.runId}-${step.nodeId}`}>
                <span />
                <div>
                  <strong>{step.title}</strong>
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
