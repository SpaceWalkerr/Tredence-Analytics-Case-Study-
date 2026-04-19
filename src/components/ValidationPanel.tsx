import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type ValidationIssue = {
  id: string;
  message: string;
  nodeId?: string;
};

type Props = {
  issues: ValidationIssue[];
  onIssueClick: (issue: ValidationIssue) => void;
};

export function ValidationPanel({ issues, onIssueClick }: Props) {
  const hasIssues = issues.length > 0;

  return (
    <div className="validation-panel">
      <div className="validation-heading">
        {hasIssues ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
        <strong>Validation</strong>
      </div>
      {hasIssues ? (
        issues.slice(0, 5).map((issue) => (
          <button
            className={issue.nodeId ? 'validation-issue validation-issue--clickable' : 'validation-issue'}
            disabled={!issue.nodeId}
            key={issue.id}
            type="button"
            onClick={() => onIssueClick(issue)}
          >
            {issue.message}
          </button>
        ))
      ) : (
        <p>Structure looks ready for testing.</p>
      )}
    </div>
  );
}
