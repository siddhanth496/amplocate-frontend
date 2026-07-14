import { getToken, clearToken } from './auth';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(status, detail, payload) {
    super(detail || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.payload = payload;
  }
}

function buildUrl(path, params) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, params, headers = {}, auth = true, signal } = options;

  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'Network error — please check your connection.');
  }

  if (response.status === 401 && auth) {
    clearToken();
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    let detail =
      (payload && typeof payload === 'object' && payload.detail) ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed (${response.status})`;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
    }
    throw new ApiError(response.status, detail, payload);
  }

  return payload;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
