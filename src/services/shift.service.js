import api from './api.js';

const shiftService = {
  async create(data) {
    return api.post('/shifts', data);
  },

  async createBulk(shifts) {
    return api.post('/shifts/bulk', { shifts });
  },

  async getMyShifts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/shifts/my${qs ? `?${qs}` : ''}`);
  },

  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/shifts${qs ? `?${qs}` : ''}`);
  },

  async getWeekSchedule(startDate, params = {}) {
    const qs = new URLSearchParams({ startDate, ...params }).toString();
    return api.get(`/shifts/week?${qs}`);
  },

  async getByUser(userId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/shifts/user/${userId}${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/shifts/${id}`);
  },

  async update(id, data) {
    return api.put(`/shifts/${id}`, data);
  },

  async cancel(id) {
    return api.post(`/shifts/${id}/cancel`);
  },

  async remove(id) {
    return api.delete(`/shifts/${id}`);
  },
};

export default shiftService;
