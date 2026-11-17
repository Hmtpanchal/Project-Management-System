import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBreakdown from '../components/StatusBreakdown';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import ButtonLink from '../components/ui/ButtonLink';
import { TableLoader } from '../components/ui/Loader';
import { ProjectPriorityBadge, ProjectStatusBadge } from '../components/StatusBadges';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/adminService';
import { getApiError } from '../utils/apiError';
import { formatDate, isOverdue } from '../utils/format';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardService.getUserDashboard();
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
  const total = stats.totalProjects || 0;
  const completionRate = total > 0 ? Math.round((stats.completedProjects / total) * 100) : 0;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your workspace"
        title={user?.name?.split(' ')[0] ? `${greeting()}, ${user.name.split(' ')[0]}` : greeting()}
        description="Here is what is happening across your projects today."
        actions={
          <ButtonLink to="/app/projects?create=1" icon="plus">
            New project
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

      <section className="stat-grid" aria-label="Project statistics">
        <StatCard
          label="Total projects"
          value={stats.totalProjects}
          icon="folder"
          tone="indigo"
          detail={`${completionRate}% complete`}
          loading={loading}
        />
        <StatCard
          label="In progress"
          value={stats.inProgressProjects}
          icon="activity"
          tone="blue"
          detail="Active work"
          loading={loading}
        />
        <StatCard
          label="Completed"
          value={stats.completedProjects}
          icon="check-circle"
          tone="green"
          detail={loading ? '' : `${completionRate}% of total`}
          loading={loading}
        />
        <StatCard
          label="High priority"
          value={stats.highPriorityProjects}
          icon="trending-up"
          tone="amber"
          detail="Open items"
          loading={loading}
        />
      </section>

      <div className="dashboard-grid">
        <section className="card dashboard-grid__main">
          <div className="card__header">
            <div>
              <h2>Recent projects</h2>
              <p>Your latest project updates, ordered by activity.</p>
            </div>
            <Link to="/app/projects" className="text-link">
              View all
            </Link>
          </div>

          <div className="table-wrap">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoader columns={4} rows={4} />
                ) : (
                  (data?.recentProjects || []).map((project) => (
                    <tr key={project._id}>
                      <td>
                        <span className="table-primary__title">{project.title}</span>
                      </td>
                      <td>
                        <ProjectStatusBadge status={project.status} />
                      </td>
                      <td>
                        <ProjectPriorityBadge priority={project.priority} />
                      </td>
                      <td>
                        <span
                          className={`date-cell ${
                            isOverdue(project.dueDate, project.status) ? 'date-cell--overdue' : ''
                          }`}
                        >
                          {formatDate(project.dueDate)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && (data?.recentProjects || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="data-table__empty">
                      <EmptyState
                        compact
                        title="No projects yet"
                        description="Create your first project to start tracking work."
                        action={
                          <ButtonLink to="/app/projects?create=1" size="sm" icon="plus">
                            Create project
                          </ButtonLink>
                        }
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
                <p>Distribution across every status.</p>
              </div>
              <span className="summary-total">{total}</span>
            </div>
            {loading ? (
              <div className="skeleton-stack" aria-hidden="true">
                <span className="skeleton" style={{ height: 44 }} />
                <span className="skeleton" style={{ height: 44 }} />
                <span className="skeleton" style={{ height: 44 }} />
              </div>
            ) : (
              <StatusBreakdown counts={data?.statusCounts} total={total} />
            )}
          </section>

          <section className="card focus-card">
            <div className="focus-card__icon">
              <span className="stat-card__icon stat-card__icon--green">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21.5 11.1V12a9.5 9.5 0 1 1-5.6-8.7" strokeLinecap="round" />
                  <path d="m9 11 3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <div>
              <span className="focus-card__label">Completion rate</span>
              <strong>{loading ? '—' : `${completionRate}%`}</strong>
              <p>
                {loading
                  ? 'Calculating your progress.'
                  : total === 0
                    ? 'Add a project to begin tracking completion.'
                    : `${stats.completedProjects} of ${total} projects completed.`}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
