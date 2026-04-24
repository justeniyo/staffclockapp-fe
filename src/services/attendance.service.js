import api from './api.js';

const attendanceService = {
  // Clock operations
  async clockIn(locationId, notes) {
    return api.post('/attendance/clock-in', { locationId, notes });
  },

  async clockOut() {
    return api.post('/attendance/clock-out');
  },

  async startBreak() {
    return api.post('/attendance/break/start');
  },

  async endBreak() {
    return api.post('/attendance/break/end');
  },

  async getStatus() {
    return api.get('/attendance/status');
  },

  // Own records
  async getMyRecords(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance/my${qs ? `?${qs}` : ''}`);
  },

  async getMySummary(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance/my/summary${qs ? `?${qs}` : ''}`);
  },

  // Admin operations
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance${qs ? `?${qs}` : ''}`);
  },

  async getByUser(userId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance/user/${userId}${qs ? `?${qs}` : ''}`);
  },

  async getUserSummary(userId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/attendance/user/${userId}/summary${qs ? `?${qs}` : ''}`);
  },

  async getById(id) {
    return api.get(`/attendance/${id}`);
  },

  async update(id, data) {
    return api.put(`/attendance/${id}`, data);
  },

  async remove(id) {
    return api.delete(`/attendance/${id}`);
  },
};

export default attendanceService;
