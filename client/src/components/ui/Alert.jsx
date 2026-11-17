export default function Alert({ type = 'error', title, children, onDismiss, className = '' }) {
  if (!children && !title) return null;

  return (
    <div className={`alert alert--${type} ${className}`.trim()} role="alert">
      <div className="alert__content">
        {title && <strong>{title}</strong>}
        {children && <div className="alert__message">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert__close"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
}
