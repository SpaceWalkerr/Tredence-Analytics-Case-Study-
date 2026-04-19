import { Loader2 } from 'lucide-react';

export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-dialog">
        <Loader2 className="spin" size={24} />
        <strong>{message}</strong>
        <span>Please wait a moment</span>
      </div>
    </div>
  );
}
