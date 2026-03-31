/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Capture token from OAuth redirect on page load
(function captureOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('access_token');
  if (token) {
    setToken(token);
    params.delete('access_token');
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();

export interface ApiError {
  status: number;
  message: string;
  data?: unknown;
}

export async function httpFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    if (token) { clearTokens(); window.location.href = '/'; }
    throw { status: 401, message: 'Unauthorized' } as ApiError;
  }
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw { status: 403, data, message: (data as { detail?: string }).detail || 'Forbidden' } as ApiError;
  }
  if (response.status === 204) return {} as T;
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { status: response.status, data, message: (data as { detail?: string }).detail || 'Request failed' } as ApiError;
  }
  return response.json() as Promise<T>;
}
