import Badge from './ui/Badge';
import { getOption, PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS, USER_STATUS_OPTIONS } from '../utils/constants';

export function ProjectStatusBadge({ status }) {
  const option = getOption(PROJECT_STATUS_OPTIONS, status);
  return (
    <Badge tone={option.tone} dot>
      {option.label}
    </Badge>
  );
}

export function ProjectPriorityBadge({ priority }) {
  const option = getOption(PROJECT_PRIORITY_OPTIONS, priority);
  return <Badge tone={option.tone}>{option.label}</Badge>;
}

export function UserStatusBadge({ status }) {
  const option = getOption(USER_STATUS_OPTIONS, status);
  return (
    <Badge tone={option.tone} dot>
      {option.label}
    </Badge>
  );
}

export function RoleBadge({ role }) {
  return <Badge tone={role === 'admin' ? 'violet' : 'neutral'}>{role === 'admin' ? 'Admin' : 'User'}</Badge>;
}
