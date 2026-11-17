import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/FormControls';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/apiError';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AdminLoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (serverError) setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!values.password) nextErrors.password = 'Password is required.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(
        { email: values.email.trim().toLowerCase(), password: values.password },
        true,
      );
      showToast('Administrator session started.', 'success');
      navigate('/admin', { replace: true });
    } catch (error) {
      const apiError = getApiError(error);
      setServerError(apiError.message);
      setErrors(apiError.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout admin>
      <div className="admin-panel-badge">
        <Icon name="shield" size={16} />
        Restricted access
      </div>

      <div className="auth-panel__header">
        <span className="auth-panel__eyebrow">Administrator portal</span>
        <h2>Sign in to the console</h2>
        <p>Use an administrator account to manage users, access, and workspace activity.</p>
      </div>

      {serverError && <Alert type="error">{serverError}</Alert>}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Administrator email"
          id="admin-email"
          type="email"
          value={values.email}
          onChange={updateField('email')}
          error={errors.email}
          placeholder="admin@company.com"
          autoComplete="email"
          autoFocus
          required
        />

        <PasswordInput
          label="Password"
          id="admin-password"
          value={values.password}
          onChange={updateField('password')}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" loading={submitting} className="button--block">
          Sign in as administrator
        </Button>
      </form>

      <div className="admin-security-note">
        <Icon name="lock" size={16} />
        <span>All administrator sessions are protected and role restricted.</span>
      </div>

      <p className="auth-switch">
        Not an administrator? <Link to="/login">Return to user sign in</Link>
      </p>
    </AuthLayout>
  );
}
