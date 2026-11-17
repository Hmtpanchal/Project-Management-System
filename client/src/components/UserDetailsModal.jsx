import { useEffect, useState } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Spinner } from './ui/Button';
import EmptyState from './ui/EmptyState';
import { RoleBadge, UserStatusBadge } from './StatusBadges';
import { adminUserService } from '../services/adminService';
import { getApiError } from '../utils/apiError';
import { formatDate, formatDateTime, getInitials } from '../utils/format';

export default function UserDetailsModal({
  open,
  userId,
  currentUserId,
  onClose,
  onEdit,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !userId) return undefined;

    let active = true;
    setLoading(true);
    setError('');
    setData(null);

    adminUserService
      .get(userId)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, userId]);

  const user = data?.user;
  const isSelf = user?._id === currentUserId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="User details"
      description="Account information and project activity."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {user && onEdit && (
            <Button icon="edit" onClick={() => onEdit(user)}>
              Edit user
            </Button>
          )}
        </>
      }
    >
      {loading && (
        <div className="modal-loading">
          <Spinner size={26} />
          <span>Loading user details…</span>
        </div>
      )}

      {!loading && error && (
        <Alert type="error" title="Unable to load user">
          {error}
        </Alert>
      )}

      {!loading && user && (
        <div className="user-detail">
          <div className="user-detail__profile">
            <span className="avatar avatar--lg">{getInitials(user.name)}</span>
            <div>
              <h3>
                {user.name}
                {isSelf && <span className="you-badge">You</span>}
              </h3>
              <p>{user.email}</p>
              <div className="user-detail__badges">
                <RoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </div>

          <dl className="detail-grid detail-grid--3">
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role === 'admin' ? 'Administrator' : 'Standard user'}</dd>
            </div>
          </dl>

          <div className="user-detail__section">
            <div className="section-heading">
              <h4>Project overview</h4>
              <span>{data.projectSummary.total} total</span>
            </div>
            <div className="mini-stats">
              <div className="mini-stat">
                <span>Total projects</span>
                <strong>{data.projectSummary.total}</strong>
              </div>
              <div className="mini-stat">
                <span>Open</span>
                <strong>{data.projectSummary.open}</strong>
              </div>
              <div className="mini-stat">
                <span>Completed</span>
                <strong>{data.projectSummary.completed}</strong>
              </div>
            </div>
          </div>

          <div className="user-detail__section">
            <div className="section-heading">
              <h4>Recent projects</h4>
            </div>
            {data.recentProjects.length === 0 ? (
              <EmptyState
                compact
                title="No projects yet"
                description="This user has not created any projects."
              />
            ) : (
              <ul className="detail-list">
                {data.recentProjects.map((project) => (
                  <li key={project._id}>
                    <div>
                      <strong>{project.title}</strong>
                      <span>Due {formatDate(project.dueDate)}</span>
                    </div>
                    <span className={`mini-pill mini-pill--${project.status}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
