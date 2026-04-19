import { Redo2, RotateCcw, Undo2, Wand2 } from 'lucide-react';

type Props = {
  canRedo: boolean;
  canUndo: boolean;
  errors: string[];
  onAutoLayout: () => void;
  onRedo: () => void;
  onRun: () => void;
  onUndo: () => void;
};

export function TopBar({ canRedo, canUndo, errors, onAutoLayout, onRedo, onRun, onUndo }: Props) {
  return (
    <header className="topbar">
      <div>
        <h1>Employee Onboarding Workflow</h1>
        <p>{errors.length ? `${errors.length} validation issue${errors.length === 1 ? '' : 's'}` : 'Ready to simulate'}</p>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 size={17} />
        </button>
        <button className="icon-button" type="button" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 size={17} />
        </button>
        <button className="ghost-button" type="button" onClick={onAutoLayout}>
          <RotateCcw size={16} />
          Layout
        </button>
        <button className="primary-button" type="button" onClick={onRun}>
          <Wand2 size={16} />
          Test Workflow
        </button>
      </div>
    </header>
  );
}
