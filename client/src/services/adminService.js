import api from './api';

export const dashboardService = {
  async getUserDashboard() {
    const { data } = await api.get('/dashboard');
    return data;
  },

  async getAdminDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },
};

export const adminUserService = {
  async list(params = {}) {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/admin/users', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },
};
