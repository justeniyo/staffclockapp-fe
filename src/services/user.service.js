import api from './api.js';

const userService = {
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/users${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/users/${id}`);
  },

  async create(data) {
    return api.post('/users', data);
  },

  async update(id, data) {
    return api.put(`/users/${id}`, data);
  },

  async remove(id) {
    return api.delete(`/users/${id}`);
  },

  async getByRole(role, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/users/role/${role}${qs ? `?${qs}` : ''}`);
  },

  async getDirectReports(id) {
    return api.get(`/users/${id}/direct-reports`);
  },
};

export default userService;
