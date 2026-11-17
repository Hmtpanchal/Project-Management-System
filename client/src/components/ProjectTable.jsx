import EmptyState from './ui/EmptyState';
import Icon from './ui/Icon';
import { TableLoader } from './ui/Loader';
import { ProjectPriorityBadge, ProjectStatusBadge } from './StatusBadges';
import { formatDate, isOverdue } from '../utils/format';

export default function ProjectTable({
  projects = [],
  loading = false,
  admin = false,
  onView,
  onEdit,
  onDelete,
  emptyAction,
}) {
  const columnCount = admin ? 7 : 6;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Project</th>
            {admin && <th>Owner</th>}
            <th>Status</th>
            <th>Priority</th>
            <th>Due date</th>
            <th>Updated</th>
            <th className="data-table__actions-heading">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableLoader columns={columnCount} rows={5} />
          ) : (
            projects.map((project) => {
              const overdue = isOverdue(project.dueDate, project.status);

              return (
                <tr key={project._id}>
                  <td>
                    <div className="table-primary">
                      <span className="table-primary__icon">
                        <Icon name="folder" size={17} />
                      </span>
                      <div>
                        <span className="table-primary__title">{project.title}</span>
                        <span className="table-primary__subtitle">
                          {project.description
                            ? project.description.length > 68
                              ? `${project.description.slice(0, 68)}…`
                              : project.description
                            : 'No description'}
                        </span>
                      </div>
                    </div>
                  </td>
                  {admin && (
                    <td>
                      <div className="table-owner">
                        <span className="avatar avatar--sm">
                          {(project.owner?.name || '?')
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join('')}
                        </span>
                        <span>{project.owner?.name || 'Unknown user'}</span>
                      </div>
                    </td>
                  )}
                  <td>
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td>
                    <ProjectPriorityBadge priority={project.priority} />
                  </td>
                  <td>
                    <span className={`date-cell ${overdue ? 'date-cell--overdue' : ''}`}>
                      {formatDate(project.dueDate)}
                    </span>
                    {overdue && <span className="table-note">Overdue</span>}
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(project.updatedAt)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onView(project)}
                        title="View project"
                        aria-label={`View ${project.title}`}
                      >
                        <Icon name="eye" size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEdit(project)}
                        title="Edit project"
                        aria-label={`Edit ${project.title}`}
                      >
                        <Icon name="edit" size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => onDelete(project)}
                        title="Delete project"
                        aria-label={`Delete ${project.title}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          {!loading && projects.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="data-table__empty">
                <EmptyState
                  compact
                  title="No projects found"
                  description="Adjust your filters, or create a project to get started."
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
