import { useId, useState } from 'react';
import Icon from './Icon';

function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <span className="form-field__error" id={id}>
        <Icon name="alert-circle" size={14} />
        {error}
      </span>
    );
  }

  if (hint) {
    return (
      <span className="form-field__hint" id={id}>
        {hint}
      </span>
    );
  }

  return null;
}

function fieldDescription(id, error, hint) {
  return error || hint ? id : undefined;
}

export function TextInput({
  label,
  id: providedId,
  error,
  hint,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const messageId = `${id}-message`;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <input
        id={id}
        className={`form-field__input ${error ? 'form-field__input--error' : ''}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(messageId, error, hint)}
        required={required}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function PasswordInput({
  label,
  id: providedId,
  error,
  hint,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const messageId = `${id}-message`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <div className="form-field__password">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`form-field__input ${error ? 'form-field__input--error' : ''}`.trim()}
          aria-invalid={Boolean(error)}
          aria-describedby={fieldDescription(messageId, error, hint)}
          required={required}
          {...props}
        />
        <button
          type="button"
          className="form-field__password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function SelectInput({
  label,
  id: providedId,
  error,
  hint,
  required = false,
  className = '',
  children,
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const messageId = `${id}-message`;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <select
        id={id}
        className={`form-field__input form-field__select ${
          error ? 'form-field__input--error' : ''
        }`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(messageId, error, hint)}
        required={required}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function TextareaInput({
  label,
  id: providedId,
  error,
  hint,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const messageId = `${id}-message`;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <textarea
        id={id}
        className={`form-field__input form-field__textarea ${
          error ? 'form-field__input--error' : ''
        }`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(messageId, error, hint)}
        required={required}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
