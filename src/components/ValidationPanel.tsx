import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ValidationPanel({ errors }: { errors: string[] }) {
  return (
    <div className="validation-panel">
      <div className="validation-heading">
        {errors.length ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
        <strong>Validation</strong>
      </div>
      {errors.length ? (
        errors.slice(0, 4).map((error) => <p key={error}>{error}</p>)
      ) : (
        <p>Structure looks ready for testing.</p>
      )}
    </div>
  );
}
