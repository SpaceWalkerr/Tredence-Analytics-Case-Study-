import type { SidebarPageId } from './Sidebar';

type Props = {
  page: Exclude<SidebarPageId, 'dashboard'>;
};

const pageCopy: Record<Exclude<SidebarPageId, 'dashboard'>, { title: string; subtitle: string; cards: string[] }> = {
  compliance: {
    title: 'Compliance',
    subtitle: 'Track policy checks, audit readiness, and HR compliance tasks.',
    cards: ['Policy checklist', 'Audit queue', 'Risk exceptions'],
  },
  scheduler: {
    title: 'Scheduler',
    subtitle: 'Plan workflow runs, reminders, escalations, and due-date automation.',
    cards: ['Upcoming reminders', 'Scheduled approvals', 'Escalation windows'],
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Review workflow volume, completion time, and automation coverage.',
    cards: ['Completion trend', 'Bottleneck report', 'Automation savings'],
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect HRIS, payroll, email, chat, and document systems.',
    cards: ['HRIS connector', 'Email service', 'Payroll sync'],
  },
  repository: {
    title: 'Repository',
    subtitle: 'Store reusable workflow assets, documents, templates, and rules.',
    cards: ['Document templates', 'Approval rules', 'Reusable tasks'],
  },
  workflows: {
    title: 'Workflows',
    subtitle: 'Manage draft, active, paused, and archived workflow designs.',
    cards: ['Draft workflows', 'Active workflows', 'Archived workflows'],
  },
  members: {
    title: 'Members',
    subtitle: 'Manage HR admins, approvers, task owners, and viewer roles.',
    cards: ['HR admins', 'Approvers', 'Task owners'],
  },
  inbox: {
    title: 'Inbox',
    subtitle: 'Review workflow notifications, approval requests, and blockers.',
    cards: ['Needs approval', 'Blocked tasks', 'System alerts'],
  },
  messages: {
    title: 'Messages',
    subtitle: 'Draft employee notifications and internal workflow messages.',
    cards: ['Email drafts', 'Slack notices', 'Employee updates'],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure workspace defaults, workflow rules, and saved data.',
    cards: ['Workspace profile', 'Default approvals', 'Storage controls'],
  },
  help: {
    title: 'Help & Support',
    subtitle: 'Find setup guidance, demo steps, and common troubleshooting notes.',
    cards: ['Getting started', 'Workflow tips', 'Contact support'],
  },
};

export function SimplePage({ page }: Props) {
  const copy = pageCopy[page];

  return (
    <main className="simple-page">
      <section className="simple-page-hero">
        <p className="section-label">SpaceWalker Module</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </section>

      <section className="simple-card-grid">
        {copy.cards.map((card, index) => (
          <article className="simple-card" key={card}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{card}</strong>
            <p>This is a lightweight placeholder page for the case-study prototype.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
