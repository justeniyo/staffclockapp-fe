import api from './api.js'

const notificationService = {
  list(params = {}) {
    const q = new URLSearchParams(params).toString()
    return api.get(`/notifications${q ? '?' + q : ''}`)
  },
}

export default notificationService
