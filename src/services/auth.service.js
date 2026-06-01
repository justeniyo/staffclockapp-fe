import api, { setToken, clearAuth } from './api.js';

const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.data?.token || data.token);
    return data;
  },

  async signup(payload) {
    return api.post('/auth/signup', payload);
  },

  // OTP-based verification: { email, otp }
  async verifyEmail(email, otp) {
    return api.post('/auth/verify-email', { email, otp });
  },

  async resendVerification(email) {
    return api.post('/auth/resend-verification', { email });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  // Optional: pre-check the OTP without setting a new password yet.
  async verifyResetOtp(email, otp) {
    return api.post('/auth/verify-reset-otp', { email, otp });
  },

  async resetPassword(email, otp, password) {
    return api.post('/auth/reset-password', { email, otp, password });
  },

  async getProfile() {
    return api.get('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return api.put('/auth/password', { currentPassword, newPassword, confirmPassword: newPassword });
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
