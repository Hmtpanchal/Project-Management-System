import EmptyState from './ui/EmptyState';
import Icon from './ui/Icon';
import { TableLoader } from './ui/Loader';
import { RoleBadge, UserStatusBadge } from './StatusBadges';
import { formatDate, formatDateTime, getInitials } from '../utils/format';

export default function UserTable({
  users = [],
  loading = false,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  emptyAction,
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last sign-in</th>
            <th>Joined</th>
            <th className="data-table__actions-heading">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableLoader columns={6} rows={6} />
          ) : (
            users.map((user) => {
              const isSelf = user._id === currentUserId;

              return (
                <tr key={user._id}>
                  <td>
                    <div className="table-primary">
                      <span className="avatar avatar--sm">{getInitials(user.name)}</span>
                      <div>
                        <span className="table-primary__title">
                          {user.name}
                          {isSelf && <span className="you-badge">You</span>}
                        </span>
                        <span className="table-primary__subtitle">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td>
                    <span className="date-cell">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(user.createdAt)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onView(user)}
                        title="View user"
                        aria-label={`View ${user.name}`}
                      >
                        <Icon name="eye" size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEdit(user)}
                        title="Edit user"
                        aria-label={`Edit ${user.name}`}
                      >
                        <Icon name="edit" size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => onDelete(user)}
                        disabled={isSelf}
                        title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                        aria-label={`Delete ${user.name}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan={6} className="data-table__empty">
                <EmptyState
                  compact
                  icon="users"
                  title="No users found"
                  description="Try a different search or filter, or add a new user."
                  action={emptyAction}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
