import Logo from '../components/ui/Logo';
import Icon from '../components/ui/Icon';

const userFeatures = [
  {
    icon: 'folder',
    title: 'Organize your work',
    text: 'Keep projects, priorities, and due dates in one clear view.',
  },
  {
    icon: 'activity',
    title: 'See progress at a glance',
    text: 'A live dashboard keeps your most important work visible.',
  },
  {
    icon: 'shield',
    title: 'Your data, secured',
    text: 'Protected sessions and role-based access keep accounts safe.',
  },
];

const adminFeatures = [
  {
    icon: 'users',
    title: 'Manage your team',
    text: 'Add users, update details, and control account access.',
  },
  {
    icon: 'shield',
    title: 'Keep roles clear',
    text: 'Grant administrator access only to the people who need it.',
  },
  {
    icon: 'activity',
    title: 'Monitor activity',
    text: 'Review user and project activity across the workspace.',
  },
];

export default function AuthLayout({ children, admin = false }) {
  const features = admin ? adminFeatures : userFeatures;

  return (
    <div className={`auth-layout ${admin ? 'auth-layout--admin' : ''}`.trim()}>
      <aside className="auth-aside">
        <div className="auth-aside__orbit auth-aside__orbit--one" />
        <div className="auth-aside__orbit auth-aside__orbit--two" />
        <div className="auth-aside__top">
          <Logo light subtitle={admin ? 'Admin console' : null} />
        </div>

        <div className="auth-aside__content">
          <span className="auth-aside__eyebrow">
            {admin ? 'Restricted administration' : 'Workspace, simplified'}
          </span>
          <h1>
            {admin
              ? 'Run your workspace with confidence.'
              : 'Keep every project moving in the right direction.'}
          </h1>
          <p>
            {admin
              ? 'A focused administration portal for managing people, access, and organization-wide activity.'
              : 'Orbit brings your projects, priorities, and progress together in one calm, organized workspace.'}
          </p>

          <ul className="auth-feature-list">
            {features.map((feature) => (
              <li key={feature.title}>
                <span className="auth-feature-list__icon">
                  <Icon name={feature.icon} size={19} />
                </span>
                <div>
                  <strong>{feature.title}</strong>
                  <span>{feature.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-aside__footer">
          <Icon name={admin ? 'shield' : 'info'} size={16} />
          <span>
            {admin
              ? 'Access is limited to authorized administrators.'
              : 'Built for teams that value clarity and focus.'}
          </span>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Logo subtitle={admin ? 'Admin console' : null} />
        </div>
        <div className="auth-panel">{children}</div>
        <p className="auth-copyright">© {new Date().getFullYear()} Orbit. All rights reserved.</p>
      </main>
    </div>
  );
}
