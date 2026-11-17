import Icon from './Icon';

export function Spinner({ size = 18, label = 'Loading' }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon = null,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    !children ? 'button--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={16} /> : icon ? <Icon name={icon} size={17} /> : null}
      {children && <span>{children}</span>}
    </button>
  );
}
