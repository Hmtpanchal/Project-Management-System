import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import UserFormModal from '../components/UserFormModal';
import UserTable from '../components/UserTable';
import UserDetailsModal from '../components/UserDetailsModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Icon from '../components/ui/Icon';
import Pagination from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminUserService } from '../services/adminService';
import { getApiError } from '../utils/apiError';
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../utils/constants';

export default function AdminUsersPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formMode, setFormMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const requestId = useRef(0);

  const loadUsers = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    setLoading(true);
    setError('');

    try {
      const response = await adminUserService.list({
        page,
        limit: 8,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
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
  }, [page, search, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;

    setSelectedUser(null);
    setFormMode('create');

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setRole('');
    setStatus('');
    setPage(1);
  };

  const openCreate = () => {
    setSelectedUser(null);
    setFormMode('create');
  };

  const openEdit = (member) => {
    setDetailsId(null);
    setSelectedUser(member);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedUser(null);
  };

  const saveUser = async (payload) => {
    const isEditing = formMode === 'edit' && selectedUser;
    const response = isEditing
      ? await adminUserService.update(selectedUser._id, payload)
      : await adminUserService.create(payload);

    if (isEditing && selectedUser._id === currentUser?._id) {
      await refreshUser();
    }

    showToast(response.message, 'success');
    closeForm();

    if (!isEditing && page !== 1) {
      setPage(1);
    } else {
      await loadUsers();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const response = await adminUserService.remove(deleteTarget._id);
      setDeleteTarget(null);
      showToast(response.message, 'success');

      if (data.users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadUsers();
      }
    } catch (requestError) {
      setDeleteError(getApiError(requestError).message);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(search || role || status);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Add users, review account details, and manage roles and access."
        actions={
          <Button icon="plus" onClick={openCreate}>
            Add user
          </Button>
        }
      />

      {error && (
        <Alert type="error" title="Unable to load users">
          {error}
          <Button variant="secondary" size="sm" onClick={loadUsers} className="alert__action">
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
              placeholder="Search by name or email…"
              aria-label="Search users"
            />
          </div>

          <div className="table-toolbar__filters">
            <label className="toolbar-select">
              <span className="sr-only">Filter by role</span>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-right" size={15} className="toolbar-select__chevron" />
            </label>

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
                {USER_STATUS_OPTIONS.map((option) => (
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

        <UserTable
          users={data.users}
          loading={loading}
          currentUserId={currentUser?._id}
          onView={(member) => setDetailsId(member._id)}
          onEdit={openEdit}
          onDelete={(member) => {
            setDeleteError('');
            setDeleteTarget(member);
          }}
          emptyAction={
            <Button size="sm" icon="plus" onClick={openCreate}>
              Add user
            </Button>
          }
        />

        <Pagination pagination={data.pagination} onPageChange={setPage} />
      </section>

      <UserFormModal
        open={Boolean(formMode)}
        user={formMode === 'edit' ? selectedUser : null}
        currentUserId={currentUser?._id}
        onClose={closeForm}
        onSubmit={saveUser}
      />

      <UserDetailsModal
        open={Boolean(detailsId)}
        userId={detailsId}
        currentUserId={currentUser?._id}
        onClose={() => setDetailsId(null)}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete user?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently deleted, along with their project records. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
