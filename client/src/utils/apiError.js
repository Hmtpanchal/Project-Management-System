export function getApiError(error) {
  const response = error?.response?.data;

  if (response) {
    return {
      message: response.message || 'Something went wrong. Please try again.',
      errors: response.errors || {},
      status: error.response.status,
    };
  }

  if (error?.code === 'ERR_NETWORK') {
    return {
      message: 'Unable to reach the server. Check your connection and try again.',
      errors: {},
      status: 0,
    };
  }

  return {
    message: error?.message || 'Something went wrong. Please try again.',
    errors: {},
    status: 0,
  };
}

export function hasFieldErrors(errors = {}) {
  return Object.keys(errors).length > 0;
}
