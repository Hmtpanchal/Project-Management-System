import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ProjectFormModal from '../components/ProjectFormModal';
import ProjectTable from '../components/ProjectTable';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Icon from '../components/ui/Icon';
import Pagination from '../components/ui/Pagination';
import { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from '../utils/constants';
import { projectService } from '../services/projectService';
import { getApiError } from '../utils/apiError';
import { useToast } from '../context/ToastContext';

export default function ProjectsPage({ admin = false }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ projects: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formMode, setFormMode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const requestId = useRef(0);

  const loadProjects = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    setLoading(true);
    setError('');

    try {
      const response = await projectService.list({
        page,
        limit: 8,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });

      if (requestId.current === currentRequest) {
        setData(response.data);
      }
    } catch (requestError) {
      if (requestId.current === currentRequest) {
        setError(getApiError(requestError).message);
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoading(false);
      }
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;

    setSelectedProject(null);
    setFormMode('create');

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  const openCreate = () => {
    setSelectedProject(null);
    setFormMode('create');
  };

  const openEdit = (project) => {
    setDetailsId(null);
    setSelectedProject(project);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedProject(null);
  };

  const saveProject = async (payload) => {
    const isEditing = formMode === 'edit' && selectedProject;
    const response = isEditing
      ? await projectService.update(selectedProject._id, payload)
      : await projectService.create(payload);

    showToast(response.message, 'success');
    closeForm();

    if (!isEditing && page !== 1) {
      setPage(1);
    } else {
      await loadProjects();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const response = await projectService.remove(deleteTarget._id);
      setDeleteTarget(null);
      showToast(response.message, 'success');

      if (data.projects.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadProjects();
      }
    } catch (requestError) {
      setDeleteError(getApiError(requestError).message);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(search || status || priority);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={admin ? 'Administration' : 'Workspace'}
        title={admin ? 'All projects' : 'Projects'}
        description={
          admin
            ? 'Review, update, and manage project records across every user.'
            : 'Create, track, and manage all of your project work in one place.'
        }
        actions={
          <Button icon="plus" onClick={openCreate}>
            New project
          </Button>
        }
      />

      {error && (
        <Alert type="error" title="Unable to load projects">
          {error}
          <Button variant="secondary" size="sm" onClick={loadProjects} className="alert__action">
            Try again
          </Button>
        </Alert>
      )}

      <section className="card table-card">
        <div className="table-toolbar">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
          </div>

          <div className="table-toolbar__filters">
            <label className="toolbar-select">
              <span className="sr-only">Filter by status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-right" size={15} className="toolbar-select__chevron" />
            </label>

            <label className="toolbar-select">
              <span className="sr-only">Filter by priority</span>
              <select
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All priorities</option>
                {PROJECT_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-right" size={15} className="toolbar-select__chevron" />
            </label>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} icon="refresh">
                Clear
              </Button>
            )}
          </div>
        </div>

        <ProjectTable
          projects={data.projects}
          loading={loading}
          admin={admin}
          onView={(project) => setDetailsId(project._id)}
          onEdit={openEdit}
          onDelete={(project) => {
            setDeleteError('');
            setDeleteTarget(project);
          }}
          emptyAction={
            <Button size="sm" icon="plus" onClick={openCreate}>
              Create project
            </Button>
          }
        />

        <Pagination pagination={data.pagination} onPageChange={setPage} />
      </section>

      <ProjectFormModal
        open={Boolean(formMode)}
        project={formMode === 'edit' ? selectedProject : null}
        onClose={closeForm}
        onSubmit={saveProject}
      />

      <ProjectDetailsModal
        open={Boolean(detailsId)}
        projectId={detailsId}
        onClose={() => setDetailsId(null)}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete project?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” will be permanently deleted. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete project"
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
