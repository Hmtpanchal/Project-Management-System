import { Link, NavLink } from 'react-router-dom';
import Logo from './ui/Logo';
import Icon from './ui/Icon';
import { NAV_ITEMS } from '../utils/constants';

export default function Sidebar({ admin = false, open, onClose }) {
  const items = NAV_ITEMS[admin ? 'admin' : 'user'];
  const home = admin ? '/admin' : '/app';

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`.trim()} aria-label="Primary navigation">
        <div className="sidebar__top">
          <Link to={home} className="sidebar__brand" onClick={onClose}>
            <Logo light subtitle={admin ? 'Admin console' : null} />
          </Link>
          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon name="close" size={19} />
          </button>
        </div>

        {admin && (
          <div className="sidebar__admin-badge">
            <Icon name="shield" size={16} />
            <span>Administrator access</span>
          </div>
        )}

        <nav className="sidebar__nav">
          <span className="sidebar__label">{admin ? 'Management' : 'Workspace'}</span>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`.trim()}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__footer-icon">
            <Icon name={admin ? 'shield' : 'lock'} size={15} />
          </span>
          <div>
            <strong>{admin ? 'Secure admin session' : 'Secure workspace'}</strong>
            <span>Protected with role-based access</span>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation overlay"
        />
      )}
    </>
  );
}
