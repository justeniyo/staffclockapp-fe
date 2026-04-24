/**
 * Base API client for StaffClock backend.
 *
 * Every helper reads the JWT from localStorage, attaches it as a Bearer
 * token, and returns parsed JSON.  On 401 the token is cleared so the
 * AuthContext can redirect to login.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('sc_token');
}

function setToken(token) {
  if (token) localStorage.setItem('sc_token', token);
  else localStorage.removeItem('sc_token');
}

function clearAuth() {
  localStorage.removeItem('sc_token');
  localStorage.removeItem('sc_user');
}

async function request(endpoint, { method = 'GET', body, headers: extra = {}, raw = false } = {}) {
  const token = getToken();
  const headers = { ...extra };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  // Handle file downloads (CSV / Excel)
  if (raw) return res;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) clearAuth();
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Convenience wrappers
const api = {
  get:    (url, opts)       => request(url, { method: 'GET', ...opts }),
  post:   (url, body, opts) => request(url, { method: 'POST', body, ...opts }),
  put:    (url, body, opts) => request(url, { method: 'PUT', body, ...opts }),
  patch:  (url, body, opts) => request(url, { method: 'PATCH', body, ...opts }),
  delete: (url, opts)       => request(url, { method: 'DELETE', ...opts }),
  download: (url, opts)     => request(url, { method: 'GET', raw: true, ...opts }),
};

export { api as default, getToken, setToken, clearAuth, API_BASE };
