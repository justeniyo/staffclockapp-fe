import api from './api.js';

const leaveService = {
  // Own leave operations
  async create(data) {
    // data: { type, startDate, endDate, reason }
    return api.post('/leaves', data);
  },

  async getMyLeaves(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/leaves/my${qs ? `?${qs}` : ''}`);
  },

  async getMyBalance(year) {
    const qs = year ? `?year=${year}` : '';
    return api.get(`/leaves/my/balance${qs}`);
  },

  async cancel(id) {
    return api.post(`/leaves/${id}/cancel`);
  },

  async update(id, data) {
    // Owner edit of a pending request
    return api.put(`/leaves/${id}`, data);
  },

  // Admin / manager operations
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/leaves${qs ? `?${qs}` : ''}`);
  },

  async getPending(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/leaves/pending${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/leaves/${id}`);
  },

  async getUserBalance(userId, year) {
    const qs = year ? `?year=${year}` : '';
    return api.get(`/leaves/user/${userId}/balance${qs}`);
  },

  async approve(id, notes) {
    return api.post(`/leaves/${id}/approve`, { notes });
  },

  async reject(id, notes) {
    return api.post(`/leaves/${id}/reject`, { notes });
  },
};

export default leaveService;
