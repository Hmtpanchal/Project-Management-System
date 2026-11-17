import api from './api';

export const projectService = {
  async list(params = {}) {
    const { data } = await api.get('/projects', { params });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/projects', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/projects/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  },
};
