import api, { setToken, clearAuth } from './api.js';

const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.data?.token || data.token);
    return data;
  },

  async signup(payload) {
    // payload: { email, password, firstName, lastName }
    const data = await api.post('/auth/signup', payload);
    return data;
  },

  async verifyEmail(token) {
    return api.get(`/auth/verify-email?token=${token}`);
  },

  async resendVerification(email) {
    return api.post('/auth/resend-verification', { email });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, password) {
    return api.post('/auth/reset-password', { token, password });
  },

  async getProfile() {
    return api.get('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return api.put('/auth/password', { currentPassword, newPassword });
  },

  async verifyToken() {
    return api.get('/auth/verify');
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
    }
  },
};

export default authService;
