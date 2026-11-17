import { useEffect, useState } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { SelectInput, TextInput, TextareaInput } from './ui/FormControls';
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from '../utils/constants';
import { getApiError } from '../utils/apiError';
import { toDateInputValue } from '../utils/format';

const emptyForm = {
  title: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  dueDate: '',
};

function validate(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = 'Project title is required.';
  } else if (values.title.trim().length < 2) {
    errors.title = 'Project title must be at least 2 characters.';
  } else if (values.title.trim().length > 120) {
    errors.title = 'Project title cannot exceed 120 characters.';
  }

  if (values.description.length > 1000) {
    errors.description = 'Description cannot exceed 1,000 characters.';
  }

  if (!PROJECT_STATUS_OPTIONS.some((option) => option.value === values.status)) {
    errors.status = 'Select a valid status.';
  }

  if (!PROJECT_PRIORITY_OPTIONS.some((option) => option.value === values.priority)) {
    errors.priority = 'Select a valid priority.';
  }

  if (values.dueDate && Number.isNaN(new Date(values.dueDate).getTime())) {
    errors.dueDate = 'Enter a valid due date.';
  }

  return errors;
}

export default function ProjectFormModal({ open, project, onClose, onSubmit }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(project);

  useEffect(() => {
    if (!open) return;

    setValues(
      project
        ? {
            title: project.title || '',
            description: project.description || '',
            status: project.status || 'planning',
            priority: project.priority || 'medium',
            dueDate: toDateInputValue(project.dueDate),
          }
        : emptyForm,
    );
    setErrors({});
    setServerError('');
    setSaving(false);
  }, [open, project]);

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

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
      });
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
      title={isEditing ? 'Edit project' : 'Create a project'}
      description={
        isEditing
          ? 'Update the details below and save your changes.'
          : 'Add a project to keep work organized and visible.'
      }
      busy={saving}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" className="form-stack" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert type="error">{serverError}</Alert>}

        <TextInput
          label="Project title"
          id="project-title"
          value={values.title}
          onChange={updateField('title')}
          error={errors.title}
          placeholder="e.g. Customer portal redesign"
          maxLength={120}
          required
          autoFocus
        />

        <TextareaInput
          label="Description"
          id="project-description"
          value={values.description}
          onChange={updateField('description')}
          error={errors.description}
          hint={`${values.description.length}/1000 characters`}
          placeholder="What is this project about?"
          rows={4}
          maxLength={1000}
        />

        <div className="form-grid form-grid--2">
          <SelectInput
            label="Status"
            id="project-status"
            value={values.status}
            onChange={updateField('status')}
            error={errors.status}
            required
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Priority"
            id="project-priority"
            value={values.priority}
            onChange={updateField('priority')}
            error={errors.priority}
            required
          >
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <TextInput
          label="Due date"
          id="project-due-date"
          type="date"
          value={values.dueDate}
          onChange={updateField('dueDate')}
          error={errors.dueDate}
          hint="Optional. You can leave this blank."
        />
      </form>
    </Modal>
  );
}
