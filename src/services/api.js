// API client. Attaches JWT from localStorage, parses JSON, surfaces friendly errors.

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

const STATUS_FALLBACK = {
  400: 'The request was invalid. Please check the form and try again.',
  401: 'You need to sign in to continue.',
  403: "You don't have permission to perform this action.",
  404: 'The requested item was not found.',
  409: 'That action conflicts with the current state — try refreshing.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again soon.',
};

async function request(endpoint, { method = 'GET', body, headers: extra = {}, raw = false } = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method, headers,
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
  } catch (networkErr) {
    const err = new Error("Can't reach the server. Please check your internet connection and try again.");
    err.status = 0;
    err.cause = networkErr;
    throw err;
  }

  if (raw) return res;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) clearAuth();

    let msg = data?.message || data?.error;
    if (Array.isArray(data?.errors) && data.errors.length) {
      const detail = data.errors
        .map((e) => (typeof e === 'string' ? e : e.msg || e.message))
        .filter(Boolean)
        .join(' • ');
      msg = !msg || /validation error/i.test(msg) ? detail : `${msg} (${detail})`;
    }
    if (!msg) msg = STATUS_FALLBACK[res.status] || `Request failed (${res.status})`;

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  get:    (url, opts)       => request(url, { method: 'GET', ...opts }),
  post:   (url, body, opts) => request(url, { method: 'POST', body, ...opts }),
  put:    (url, body, opts) => request(url, { method: 'PUT', body, ...opts }),
  patch:  (url, body, opts) => request(url, { method: 'PATCH', body, ...opts }),
  delete: (url, opts)       => request(url, { method: 'DELETE', ...opts }),
  download: (url, opts)     => request(url, { method: 'GET', raw: true, ...opts }),
};

export { api as default, getToken, setToken, clearAuth, API_BASE };
