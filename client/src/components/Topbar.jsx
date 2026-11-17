import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './ui/Icon';
import { getInitials } from '../utils/format';
import { UserStatusBadge } from './StatusBadges';

const titles = {
  '/app': 'Overview',
  '/app/projects': 'Projects',
  '/admin': 'Overview',
  '/admin/users': 'User management',
  '/admin/projects': 'Projects',
};

export default function Topbar({ admin = false, onMenuOpen }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = titles[location.pathname] || 'Orbit';

  const handleLogout = async () => {
    try {
      await logout();
      showToast('You have been signed out.', 'success');
      navigate(admin ? '/admin/login' : '/login', { replace: true });
    } catch {
      showToast('You have been signed out.', 'success');
      navigate(admin ? '/admin/login' : '/login', { replace: true });
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu"
          onClick={onMenuOpen}
          aria-label="Open navigation"
        >
          <Icon name="menu" size={21} />
        </button>
        <div className="topbar__crumb">
          <span>{admin ? 'Admin' : 'Workspace'}</span>
          <Icon name="chevron-right" size={14} />
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div className="topbar__right">
        {admin && (
          <span className="topbar__admin-tag">
            <Icon name="shield" size={14} />
            Admin
          </span>
        )}
        <div className="topbar__user">
          <span className="avatar">{getInitials(user?.name)}</span>
          <div className="topbar__user-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          {!admin && user && <UserStatusBadge status={user.status} />}
        </div>
        <button
          type="button"
          className="icon-button topbar__logout"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  );
}
