import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function ButtonLink({
  to,
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  className = '',
  ...props
}) {
  return (
    <Link
      to={to}
      className={`button button--${variant} button--${size} ${className}`.trim()}
      {...props}
    >
      {icon && <Icon name={icon} size={17} />}
      <span>{children}</span>
    </Link>
  );
}
