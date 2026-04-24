import api from './api.js';

const locationService = {
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/locations${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/locations/${id}`);
  },

  async create(data) {
    return api.post('/locations', data);
  },

  async update(id, data) {
    return api.put(`/locations/${id}`, data);
  },

  async remove(id) {
    return api.delete(`/locations/${id}`);
  },
};

export default locationService;
