import { useEffect, useState } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { PasswordInput, SelectInput, TextInput } from './ui/FormControls';
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../utils/constants';
import { getApiError } from '../utils/apiError';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values, isEditing) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (values.name.trim().length > 60) {
    errors.name = 'Name cannot exceed 60 characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!isEditing || values.password) {
    if (!values.password) {
      errors.password = 'Password is required.';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      errors.password = 'Password must include at least one letter and one number.';
    }
  }

  if (!ROLE_OPTIONS.some((option) => option.value === values.role)) {
    errors.role = 'Select a valid role.';
  }

  if (!USER_STATUS_OPTIONS.some((option) => option.value === values.status)) {
    errors.status = 'Select a valid status.';
  }

  return errors;
}

export default function UserFormModal({
  open,
  user,
  currentUserId,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(user);
  const isSelf = Boolean(user && user._id === currentUserId);

  useEffect(() => {
    if (!open) return;

    setValues(
      user
        ? {
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            status: user.status || 'active',
          }
        : emptyForm,
    );
    setErrors({});
    setServerError('');
    setSaving(false);
  }, [open, user]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const nextErrors = validate(values, isEditing);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      status: values.status,
    };

    if (values.password) payload.password = values.password;

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      const apiError = getApiError(error);
      setServerError(apiError.message);
      setErrors(apiError.errors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit user' : 'Add a new user'}
      description={
        isEditing
          ? 'Update account details, access level, and status.'
          : 'Create an account and choose the appropriate access level.'
      }
      busy={saving}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" className="form-stack" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert type="error">{serverError}</Alert>}

        <TextInput
          label="Full name"
          id="managed-user-name"
          value={values.name}
          onChange={updateField('name')}
          error={errors.name}
          placeholder="e.g. Jordan Lee"
          maxLength={60}
          required
          autoFocus
        />

        <TextInput
          label="Email address"
          id="managed-user-email"
          type="email"
          value={values.email}
          onChange={updateField('email')}
          error={errors.email}
          placeholder="jordan@company.com"
          maxLength={120}
          autoComplete="off"
          required
        />

        <PasswordInput
          label={isEditing ? 'New password' : 'Temporary password'}
          id="managed-user-password"
          value={values.password}
          onChange={updateField('password')}
          error={errors.password}
          hint={
            isEditing
              ? 'Leave blank to keep the current password. Use at least 8 characters with a letter and number.'
              : 'At least 8 characters, including a letter and a number.'
          }
          autoComplete="new-password"
          required={!isEditing}
        />

        <div className="form-grid form-grid--2">
          <SelectInput
            label="Role"
            id="managed-user-role"
            value={values.role}
            onChange={updateField('role')}
            error={errors.role}
            hint={isSelf ? 'You cannot remove your own admin role.' : 'Admins can access this portal.'}
            disabled={isSelf}
            required
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Account status"
            id="managed-user-status"
            value={values.status}
            onChange={updateField('status')}
            error={errors.status}
            hint={isSelf ? 'You cannot deactivate your own account.' : 'Inactive users cannot sign in.'}
            disabled={isSelf}
            required
          >
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </form>
    </Modal>
  );
}
