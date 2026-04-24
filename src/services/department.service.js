import api from './api.js';

const departmentService = {
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/departments${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/departments/${id}`);
  },

  async create(data) {
    return api.post('/departments', data);
  },

  async update(id, data) {
    return api.put(`/departments/${id}`, data);
  },

  async remove(id) {
    return api.delete(`/departments/${id}`);
  },
};

export default departmentService;
