import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authEndpoints = ['/auth/login', '/auth/register', '/auth/me', '/auth/admin/login'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isExpectedAuthAttempt = authEndpoints.some((endpoint) => requestUrl.endsWith(endpoint));

    if (error.response?.status === 401 && !isExpectedAuthAttempt) {
      window.dispatchEvent(new Event('orbit:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export default api;
