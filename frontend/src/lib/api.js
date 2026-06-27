const API_BASE = 'http://localhost:5000/api';

export const api = {
  get: (path, params = {}) => {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    return fetch(url.toString()).then(r => r.json());
  },
  post: (path, data) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  put: (path, data) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  delete: (path) =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
};
