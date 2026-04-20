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

export type SidebarPageId =
  | 'dashboard'
  | 'compliance'
  | 'scheduler'
  | 'analytics'
  | 'integrations'
  | 'repository'
  | 'workflows'
  | 'members'
  | 'inbox'
  | 'messages'
  | 'settings'
  | 'help';

type Props = {
  activePage: SidebarPageId;
  onNavigate: (page: SidebarPageId) => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export function Sidebar({ activePage, onExport, onImport, onNavigate }: Props) {
  const itemClass = (page: SidebarPageId) => ['nav-item', activePage === page ? 'nav-item--active' : ''].join(' ');

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">HR</div>
        <div>
          <strong>HR Workflow Designer</strong>
          <span>Workflow OS</span>
        </div>
      </div>

      <section className="nav-section">
        <p className="section-label">General</p>
        <button className={itemClass('dashboard')} type="button" onClick={() => onNavigate('dashboard')}>
          <Gauge size={16} />
          Dashboard
        </button>
        <button className={itemClass('compliance')} type="button" onClick={() => onNavigate('compliance')}>
          <ShieldCheck size={16} />
          Compliance
        </button>
        <button className={itemClass('scheduler')} type="button" onClick={() => onNavigate('scheduler')}>
          <CalendarClock size={16} />
          Scheduler
        </button>
        <button className={itemClass('analytics')} type="button" onClick={() => onNavigate('analytics')}>
          <BarChart3 size={16} />
          Analytics
        </button>
      </section>

      <section className="nav-section">
        <p className="section-label">Automation</p>
        <button className={itemClass('integrations')} type="button" onClick={() => onNavigate('integrations')}>
          <Link size={16} />
          Integrations
        </button>
        <button className={itemClass('repository')} type="button" onClick={() => onNavigate('repository')}>
          <GitBranch size={16} />
          Repository
        </button>
        <button className={itemClass('workflows')} type="button" onClick={() => onNavigate('workflows')}>
          <Workflow size={16} />
          Workflows
        </button>
      </section>

      <section className="nav-section">
        <p className="section-label">Resources</p>
        <button className={itemClass('members')} type="button" onClick={() => onNavigate('members')}>
          <Users size={16} />
          Members
        </button>
        <button className={itemClass('inbox')} type="button" onClick={() => onNavigate('inbox')}>
          <Inbox size={16} />
          Inbox
        </button>
        <button className={itemClass('messages')} type="button" onClick={() => onNavigate('messages')}>
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
        <button className={itemClass('settings')} type="button" onClick={() => onNavigate('settings')}>
          <Settings size={16} />
          Settings
        </button>
        <button className={itemClass('help')} type="button" onClick={() => onNavigate('help')}>
          <HelpCircle size={16} />
          Help & Support
        </button>
      </div>
    </aside>
  );
}
