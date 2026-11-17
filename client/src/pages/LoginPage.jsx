import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/FormControls';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/apiError';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
      showToast('Welcome back to Orbit.', 'success');
      const destination =
        location.state?.from?.pathname?.startsWith('/app') ? location.state.from.pathname : '/app';
      navigate(destination, { replace: true });
    } catch (error) {
      const apiError = getApiError(error);
      setServerError(apiError.message);
      setErrors(apiError.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-panel__header">
        <span className="auth-panel__eyebrow">Welcome back</span>
        <h2>Sign in to your workspace</h2>
        <p>Enter your account details to continue managing your projects.</p>
      </div>

      {serverError && <Alert type="error">{serverError}</Alert>}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email address"
          id="login-email"
          type="email"
          value={values.email}
          onChange={updateField('email')}
          error={errors.email}
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          required
        />

        <PasswordInput
          label="Password"
          id="login-password"
          value={values.password}
          onChange={updateField('password')}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" loading={submitting} className="button--block">
          Sign in
        </Button>
      </form>

      <p className="auth-switch">
        New to Orbit? <Link to="/register">Create an account</Link>
      </p>

      <div className="auth-divider">
        <span>Administrator</span>
      </div>

      <Link to="/admin/login" className="admin-entry-link">
        <span className="admin-entry-link__icon">
          <Icon name="shield" size={18} />
        </span>
        <span>
          <strong>Access the admin portal</strong>
          <small>For authorized administrators only</small>
        </span>
        <Icon name="arrow-right" size={17} />
      </Link>
    </AuthLayout>
  );
}
