import { Database, Redo2, RotateCcw, Trash2, Undo2, Wand2 } from 'lucide-react';

type Props = {
  canRedo: boolean;
  canUndo: boolean;
  errors: string[];
  nodeCount: number;
  onAutoLayout: () => void;
  onClearSaved: () => void;
  onRedo: () => void;
  onReset: () => void;
  onRun: () => void;
  onUndo: () => void;
  savedAt?: string;
};

export function TopBar({
  canRedo,
  canUndo,
  errors,
  nodeCount,
  onAutoLayout,
  onClearSaved,
  onRedo,
  onReset,
  onRun,
  onUndo,
  savedAt,
}: Props) {
  return (
    <header className="topbar">
      <div>
        <h1>SpaceWalker Workflow Studio</h1>
        <p>
          {nodeCount} steps ·{' '}
          {errors.length ? `${errors.length} validation issue${errors.length === 1 ? '' : 's'}` : 'Ready to simulate'}
          {savedAt ? ` · saved ${savedAt}` : ''}
        </p>
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
        <button className="ghost-button" type="button" onClick={onReset}>
          <Database size={16} />
          Reset
        </button>
        <button className="icon-button" type="button" onClick={onClearSaved} title="Clear saved workflow">
          <Trash2 size={16} />
        </button>
        <button className="primary-button" type="button" onClick={onRun}>
          <Wand2 size={16} />
          Test Workflow
        </button>
      </div>
    </header>
  );
}
