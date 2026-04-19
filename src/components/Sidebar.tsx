import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  Download,
  Gauge,
  GitBranch,
  HelpCircle,
  Inbox,
  Link,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  Workflow,
} from 'lucide-react';

type Props = {
  onExport: () => void;
  onImport: (file: File) => void;
};

export function Sidebar({ onExport, onImport }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">SW</div>
        <div>
          <strong>SpaceWalker</strong>
          <span>Workflow OS</span>
        </div>
      </div>

      <section className="nav-section">
        <p className="section-label">General</p>
        <button className="nav-item nav-item--active" type="button">
          <Gauge size={16} />
          Dashboard
        </button>
        <button className="nav-item" type="button">
          <ShieldCheck size={16} />
          Compliance
        </button>
        <button className="nav-item" type="button">
          <CalendarClock size={16} />
          Scheduler
          <span>11</span>
        </button>
        <button className="nav-item" type="button">
          <BarChart3 size={16} />
          Analytics
        </button>
      </section>

      <section className="nav-section">
        <p className="section-label">Automation</p>
        <button className="nav-item" type="button">
          <Link size={16} />
          Integrations
        </button>
        <button className="nav-item" type="button">
          <GitBranch size={16} />
          Repository
          <span>7</span>
        </button>
        <button className="nav-item" type="button">
          <Workflow size={16} />
          Workflows
        </button>
      </section>

      <section className="nav-section">
        <p className="section-label">Resources</p>
        <button className="nav-item" type="button">
          <Users size={16} />
          Members
        </button>
        <button className="nav-item" type="button">
          <Inbox size={16} />
          Inbox
          <span>13</span>
        </button>
        <button className="nav-item" type="button">
          <CheckSquare size={16} />
          Messages
        </button>
      </section>

      <section className="side-section">
        <p className="section-label">Workflow JSON</p>
        <div className="side-actions">
          <button className="ghost-button" type="button" onClick={onExport}>
            <Download size={16} />
            Export
          </button>
          <label className="ghost-button file-button">
            <Upload size={16} />
            Import
            <input
              accept="application/json"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <div className="sidebar-footer">
        <button className="nav-item" type="button">
          <Settings size={16} />
          Settings
        </button>
        <button className="nav-item" type="button">
          <HelpCircle size={16} />
          Help & Support
        </button>
      </div>
    </aside>
  );
}
