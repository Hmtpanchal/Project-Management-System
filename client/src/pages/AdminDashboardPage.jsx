import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBreakdown from '../components/StatusBreakdown';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import EmptyState from '../components/ui/EmptyState';
import { TableLoader } from '../components/ui/Loader';
import { RoleBadge, UserStatusBadge, ProjectStatusBadge } from '../components/StatusBadges';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/adminService';
import { getApiError } from '../utils/apiError';
import { formatDate, getInitials } from '../utils/format';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardService.getAdminDashboard();
      setData(response.data);
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats || {};
  const totalProjects = stats.totalProjects || 0;
  const completionRate =
    totalProjects > 0 ? Math.round(((stats.completedProjects || 0) / totalProjects) * 100) : 0;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin overview"
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'Administrator'}`}
        description="Monitor user access and project activity across the workspace."
        actions={
          <ButtonLink to="/admin/users?create=1" icon="plus">
            Add user
          </ButtonLink>
        }
      />

      {error && (
        <Alert type="error" title="Dashboard unavailable">
          {error}
          <Button variant="secondary" size="sm" onClick={loadDashboard} className="alert__action">
            Try again
          </Button>
        </Alert>
      )}

      <section className="stat-grid" aria-label="Administration statistics">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon="users"
          tone="indigo"
          detail={`${data?.roleCounts?.admin || 0} admins`}
          loading={loading}
        />
        <StatCard
          label="Active users"
          value={stats.activeUsers}
          icon="user-check"
          tone="green"
          detail="Can sign in"
          loading={loading}
        />
        <StatCard
          label="Inactive users"
          value={stats.inactiveUsers}
          icon="user-x"
          tone="red"
          detail="Access suspended"
          loading={loading}
        />
        <StatCard
          label="Total projects"
          value={stats.totalProjects}
          icon="folder"
          tone="blue"
          detail={`${completionRate}% complete`}
          loading={loading}
        />
      </section>

      <div className="dashboard-grid dashboard-grid--admin">
        <section className="card dashboard-grid__main">
          <div className="card__header">
            <div>
              <h2>Newest users</h2>
              <p>Recently created accounts across the workspace.</p>
            </div>
            <Link to="/admin/users" className="text-link">
              Manage users
            </Link>
          </div>

          <div className="table-wrap">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoader columns={4} rows={5} />
                ) : (
                  (data?.recentUsers || []).map((member) => (
                    <tr key={member._id}>
                      <td>
                        <div className="table-primary">
                          <span className="avatar avatar--sm">{getInitials(member.name)}</span>
                          <div>
                            <span className="table-primary__title">{member.name}</span>
                            <span className="table-primary__subtitle">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={member.role} />
                      </td>
                      <td>
                        <UserStatusBadge status={member.status} />
                      </td>
                      <td>
                        <span className="date-cell">{formatDate(member.createdAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && (data?.recentUsers || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="data-table__empty">
                      <EmptyState
                        compact
                        icon="users"
                        title="No users yet"
                        description="Add the first user to this workspace."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dashboard-grid__side">
          <section className="card">
            <div className="card__header card__header--stacked">
              <div>
                <h2>Project pipeline</h2>
                <p>Organization-wide project status.</p>
              </div>
              <span className="summary-total">{totalProjects}</span>
            </div>
            {loading ? (
              <div className="skeleton-stack" aria-hidden="true">
                <span className="skeleton" style={{ height: 44 }} />
                <span className="skeleton" style={{ height: 44 }} />
                <span className="skeleton" style={{ height: 44 }} />
              </div>
            ) : (
              <StatusBreakdown counts={data?.statusCounts} total={totalProjects} />
            )}
          </section>

          <section className="card role-summary">
            <div className="card__header card__header--stacked">
              <div>
                <h2>Access summary</h2>
                <p>Accounts by permission level.</p>
              </div>
            </div>
            <div className="role-summary__row">
              <span>
                <span className="role-summary__dot role-summary__dot--admin" />
                Administrators
              </span>
              <strong>{loading ? '—' : data?.roleCounts?.admin || 0}</strong>
            </div>
            <div className="role-summary__row">
              <span>
                <span className="role-summary__dot role-summary__dot--user" />
                Standard users
              </span>
              <strong>{loading ? '—' : data?.roleCounts?.user || 0}</strong>
            </div>
            <div className="role-summary__note">
              <strong>Access is role restricted.</strong>
              <span>Only administrators can open this portal.</span>
            </div>
          </section>
        </aside>
      </div>

      <section className="card">
        <div className="card__header">
          <div>
            <h2>Recent project activity</h2>
            <p>The latest updates across all user projects.</p>
          </div>
          <Link to="/admin/projects" className="text-link">
            View all projects
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader columns={4} rows={5} />
              ) : (
                (data?.recentProjects || []).map((project) => (
                  <tr key={project._id}>
                    <td>
                      <span className="table-primary__title">{project.title}</span>
                    </td>
                    <td>
                      <div className="table-owner">
                        <span className="avatar avatar--sm">
                          {getInitials(project.owner?.name)}
                        </span>
                        <span>{project.owner?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(project.updatedAt)}</span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && (data?.recentProjects || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="data-table__empty">
                    <EmptyState
                      compact
                      title="No project activity"
                      description="Projects created by users will appear here."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
