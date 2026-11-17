export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', tone: 'neutral' },
  { value: 'in-progress', label: 'In progress', tone: 'info' },
  { value: 'completed', label: 'Completed', tone: 'success' },
];

export const PROJECT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', tone: 'neutral' },
  { value: 'medium', label: 'Medium', tone: 'warning' },
  { value: 'high', label: 'High', tone: 'danger' },
];

export const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Administrator' },
];

export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'inactive', label: 'Inactive', tone: 'danger' },
];

export function getOption(options, value) {
  return options.find((option) => option.value === value) || options[0];
}

export const NAV_ITEMS = {
  user: [
    { to: '/app', label: 'Overview', icon: 'dashboard', end: true },
    { to: '/app/projects', label: 'Projects', icon: 'folder' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/projects', label: 'Projects', icon: 'folder' },
  ],
};
