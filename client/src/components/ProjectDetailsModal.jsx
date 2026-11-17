import { useEffect, useState } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Spinner } from './ui/Button';
import { ProjectPriorityBadge, ProjectStatusBadge } from './StatusBadges';
import { projectService } from '../services/projectService';
import { getApiError } from '../utils/apiError';
import { formatDate, formatDateTime } from '../utils/format';

export default function ProjectDetailsModal({ open, projectId, onClose, onEdit }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !projectId) return undefined;

    let active = true;
    setLoading(true);
    setError('');
    setProject(null);

    projectService
      .get(projectId)
      .then((response) => {
        if (active) setProject(response.data.project);
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
  }, [open, projectId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Project details"
      description={project ? `Created ${formatDate(project.createdAt)}` : 'Review this project record.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {project && onEdit && (
            <Button icon="edit" onClick={() => onEdit(project)}>
              Edit project
            </Button>
          )}
        </>
      }
    >
      {loading && (
        <div className="modal-loading">
          <Spinner size={26} />
          <span>Loading project details…</span>
        </div>
      )}

      {!loading && error && (
        <Alert type="error" title="Unable to load project">
          {error}
        </Alert>
      )}

      {!loading && project && (
        <div className="detail-view">
          <div className="detail-view__heading">
            <div>
              <h3>{project.title}</h3>
              <p>{project.description || 'No description provided for this project.'}</p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <dl className="detail-grid">
            <div>
              <dt>Priority</dt>
              <dd>
                <ProjectPriorityBadge priority={project.priority} />
              </dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(project.dueDate)}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{project.owner?.name || 'Unknown user'}</dd>
            </div>
            <div>
              <dt>Owner email</dt>
              <dd className="detail-grid__email">{project.owner?.email || '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(project.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDateTime(project.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}
