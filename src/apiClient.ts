const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://192.168.1.198:8081';

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
    putMultipart: (path: string, formData: FormData) => fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
    }),
    patch: (path: string, body: unknown) => fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }),
    delete: (path: string, body?: unknown) => fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    })
};

export default apiClient;