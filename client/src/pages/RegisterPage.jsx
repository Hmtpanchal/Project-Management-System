import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/FormControls';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/apiError';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RegisterPage() {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
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
    if (!values.name.trim()) nextErrors.name = 'Full name is required.';
    else if (values.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters.';

    if (!values.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.';

    if (!values.password) nextErrors.password = 'Password is required.';
    else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      nextErrors.password = 'Password must include at least one letter and one number.';
    }

    if (!values.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      showToast('Your account is ready. Welcome to Orbit!', 'success');
      navigate('/app', { replace: true });
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
        <span className="auth-panel__eyebrow">Get started</span>
        <h2>Create your account</h2>
        <p>Join your workspace and start organizing projects in minutes.</p>
      </div>

      {serverError && <Alert type="error">{serverError}</Alert>}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Full name"
          id="register-name"
          value={values.name}
          onChange={updateField('name')}
          error={errors.name}
          placeholder="e.g. Jordan Lee"
          autoComplete="name"
          maxLength={60}
          autoFocus
          required
        />

        <TextInput
          label="Email address"
          id="register-email"
          type="email"
          value={values.email}
          onChange={updateField('email')}
          error={errors.email}
          placeholder="you@company.com"
          autoComplete="email"
          maxLength={120}
          required
        />

        <div className="form-grid form-grid--2">
          <PasswordInput
            label="Password"
            id="register-password"
            value={values.password}
            onChange={updateField('password')}
            error={errors.password}
            hint="8+ characters with a letter and number."
            autoComplete="new-password"
            required
          />

          <PasswordInput
            label="Confirm password"
            id="register-confirm-password"
            value={values.confirmPassword}
            onChange={updateField('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button type="submit" loading={submitting} className="button--block">
          Create account
        </Button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
