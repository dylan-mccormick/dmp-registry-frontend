const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081';

const apiClient = {
    get: (path: string) => fetch(`${BASE_URL}${path}`, { credentials: 'include' }),
    post: (path: string, body: unknown) => fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }),
    put: (path: string, body: unknown) => fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }),
    delete: (path: string) => fetch(`${BASE_URL}${path}`, { method: 'DELETE', credentials: 'include' })
};

export default apiClient;