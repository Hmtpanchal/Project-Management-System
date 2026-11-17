const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (name.trim().length > 60) {
    return 'Name cannot exceed 60 characters.';
  }
  return null;
}

function validateEmail(email) {
  if (typeof email !== 'string' || !email.trim()) {
    return 'Email is required.';
  }
  if (!EMAIL_PATTERN.test(email.trim().toLowerCase())) {
    return 'Enter a valid email address.';
  }
  if (email.trim().length > 120) {
    return 'Email cannot exceed 120 characters.';
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 72) {
    return 'Password cannot exceed 72 characters.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

function validateConfirmPassword(password, confirmPassword) {
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

function isValidEnum(value, allowed) {
  return allowed.includes(value);
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePagination(query, defaultLimit = 8) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(100, Math.max(1, requestedLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}

module.exports = {
  EMAIL_PATTERN,
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  isValidEnum,
  escapeRegex,
  parsePagination,
  buildPagination,
};
