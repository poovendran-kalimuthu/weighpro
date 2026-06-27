// Vercel deployment trigger comment
const getApiBase = (path) => {
  if (path && path.startsWith('/serial')) {
    const serialSource = localStorage.getItem('serial_source') || 'cloud';
    if (serialSource === 'local') {
      return 'http://localhost:5000/api';
    }
  }
  return import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';
};

export const api = {
  get: (path, params = {}) => {
    const base = getApiBase(path);
    const url = new URL(`${base}${path}`);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    return fetch(url.toString()).then(r => r.json());
  },
  post: (path, data) => {
    const base = getApiBase(path);
    return fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  put: (path, data) => {
    const base = getApiBase(path);
    return fetch(`${base}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  delete: (path) => {
    const base = getApiBase(path);
    return fetch(`${base}${path}`, { method: 'DELETE' }).then(r => r.json());
  },
};
