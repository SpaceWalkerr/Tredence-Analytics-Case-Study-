import { ArrowLeft, Database, Redo2, RotateCcw, Save, Trash2, Undo2, Wand2 } from 'lucide-react';

type Props = {
  canRedo: boolean;
  canUndo: boolean;
  errors: string[];
  nodeCount: number;
  onAutoLayout: () => void;
  onClearSaved: () => void;
  onDashboard: () => void;
  onRedo: () => void;
  onReset: () => void;
  onRun: () => void;
  onSave: () => void;
  onUndo: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  savedAt?: string;
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
};

export function TopBar({
  canRedo,
  canUndo,
  errors,
  nodeCount,
  onAutoLayout,
  onClearSaved,
  onDashboard,
  onRedo,
  onReset,
  onRun,
  onSave,
  onUndo,
  saveStatus,
  savedAt,
  workflowName,
  onWorkflowNameChange,
}: Props) {
  const saveText = saveStatus === 'saving' ? 'Saving...' : savedAt ? `Saved at ${savedAt}` : 'Not saved';

  return (
    <header className="topbar">
      <div className="topbar-main">
        <button className="back-button" type="button" onClick={onDashboard}>
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>
        <div>
          <label className="workflow-name-field">
            <span>Workflow</span>
            <input
              value={workflowName}
              onChange={(event) => onWorkflowNameChange(event.target.value)}
              placeholder="Untitled Workflow"
            />
          </label>
          <p>
            {nodeCount} steps ·{' '}
            {errors.length ? `${errors.length} validation issue${errors.length === 1 ? '' : 's'}` : 'Ready to simulate'}
            {` · ${saveText}`}
          </p>
        </div>
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
        <button className="ghost-button" type="button" onClick={onSave}>
          <Save size={16} />
          Save Workflow
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
