// If we are on Vite Dev Server (5173), point to local backend. Otherwise, use relative.
const API = window.location.port === '5173' ? 'http://127.0.0.1:5000' : '';

export const api = {
  get: (path) => fetch(`${API}${path}`).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || 'Request failed') })),
  post: (path, body) => fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || 'Request failed') })),
};
