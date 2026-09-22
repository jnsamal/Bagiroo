// Thin fetch wrapper — every call includes credentials so the httpOnly
// session cookie is sent, and every response follows the server's
// { success, data, error } shape.

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfTokenPromise;

async function getCsrfToken(force = false) {
  if (force) csrfTokenPromise = undefined;
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE}/csrf`, { credentials: 'include' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body?.data?.csrfToken) throw new Error('Could not initialize request security.');
        return body.data.csrfToken;
      })
      .catch(error => { csrfTokenPromise = undefined; throw error; });
  }
  return csrfTokenPromise;
}

export async function csrfFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (UNSAFE_METHODS.has(method)) headers.set('X-CSRF-Token', await getCsrfToken());
  let response = await fetch(url, { credentials: 'include', ...options, headers });
  if (response.status === 403 && UNSAFE_METHODS.has(method)) {
    const errorBody = await response.clone().json().catch(() => null);
    if (errorBody?.error?.message?.includes('CSRF token')) {
      headers.set('X-CSRF-Token', await getCsrfToken(true));
      response = await fetch(url, { credentials: 'include', ...options, headers });
    }
  }
  return response;
}

async function request(path, options = {}) {
  const res = await csrfFetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const message = body?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
