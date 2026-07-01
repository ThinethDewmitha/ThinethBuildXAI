/**
 * BuildX AI – Frontend API Client
 * Communicates with the Express backend for auth, users, and projects.
 */
import { firebaseSignOut } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
    return localStorage.getItem('buildx_token');
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...options.headers,
        },
        ...options,
    };

    let res;
    try {
        res = await fetch(url, config);
    } catch {
        throw new Error('Failed to connect to backend server. Make sure it is running locally or deployed.');
    }

    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch {
            data = null;
        }
    }

    if (!res.ok) {
        const fallback = res.status === 503
            ? 'Firebase Admin is not configured on the server. Add firebase-adminsdk-*.json to the project root and restart.'
            : res.status === 404
                ? 'API route not found. Restart the backend with npm run dev.'
                : `Request failed (${res.status}). Ensure the backend is running.`;
        throw new Error(data?.error || fallback);
    }

    if (data === null) {
        throw new Error(`Invalid response from server (${res.status}). Ensure the backend is running.`);
    }

    return data;
}

// ─── Auth (Firebase) ──────────────────────────────────────────────────────────
export async function syncFirebaseSession(idToken, profile = {}) {
    const data = await request('/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken, ...profile }),
    });
    localStorage.setItem('buildx_token', idToken);
    localStorage.setItem('buildx_user', JSON.stringify(data.user));
    return data;
}

export async function getMe() {
    return request('/auth/me');
}

export async function logout() {
    try {
        await firebaseSignOut();
    } catch {
        // ignore sign-out errors
    }
    localStorage.removeItem('buildx_token');
    localStorage.removeItem('buildx_user');
}

export function getStoredUser() {
    const raw = localStorage.getItem('buildx_user');
    return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
    return localStorage.getItem('buildx_token');
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function updateProfile({ name, phone, address }) {
    const data = await request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone, address }),
    });
    const current = getStoredUser();
    if (current) {
        localStorage.setItem('buildx_user', JSON.stringify({ ...current, ...data.user }));
    }
    return data;
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export async function saveProject({ projectName, specs, aiAnalysis, estimate, photosMeta }) {
    return request('/projects', {
        method: 'POST',
        body: JSON.stringify({ projectName, specs, aiAnalysis, estimate, photosMeta }),
    });
}

export async function getMyProjects() {
    return request('/projects');
}

export async function getProject(id) {
    return request(`/projects/${id}`);
}

export async function updateProject(id, updates) {
    return request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteProject(id) {
    return request(`/projects/${id}`, { method: 'DELETE' });
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
    return request('/admin/stats');
}

export async function getAdminUsers() {
    return request('/admin/users');
}

export async function getAdminUser(id) {
    return request(`/admin/users/${id}`);
}

export async function updateAdminUser(id, updates) {
    return request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteAdminUser(id) {
    return request(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function getAdminProjects() {
    return request('/admin/projects');
}

export async function updateAdminProject(id, updates) {
    return request(`/admin/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteAdminProject(id) {
    return request(`/admin/projects/${id}`, { method: 'DELETE' });
}
