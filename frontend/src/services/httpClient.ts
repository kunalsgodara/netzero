


export const TOKEN_KEYS = {
  ACCESS:  'access_token',
  REFRESH: 'refresh_token',
} as const;



export const API_BASE = import.meta.env.VITE_API_URL || '';


export const ROUTES = {
  HOME:      '/',
  DASHBOARD: '/Dashboard',
} as const;


export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.REFRESH);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEYS.ACCESS, token);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(TOKEN_KEYS.REFRESH, token);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
}



(function captureOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const accessToken  = params.get(TOKEN_KEYS.ACCESS);
  const refreshToken = params.get(TOKEN_KEYS.REFRESH);
  if (accessToken) {
    setToken(accessToken);
    params.delete(TOKEN_KEYS.ACCESS);
  }
  if (refreshToken) {
    setRefreshToken(refreshToken);
    params.delete(TOKEN_KEYS.REFRESH);
  }
  if (accessToken || refreshToken) {
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();


export interface ApiError {
  status: number;
  message: string;
  data?: unknown;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  setToken(data.access_token);
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  return data.access_token;
}



export async function httpFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) };

  if (token)                               headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type']  = 'application/json';

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Handle 401 with token refresh
  if (response.status === 401 && getRefreshToken()) {
    try {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }
      
      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      
      // Retry the original request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (error) {
      // Refresh failed, clear tokens and redirect
      isRefreshing = false;
      refreshPromise = null;
      clearTokens();
      window.location.href = ROUTES.HOME;
      throw { status: 401, message: 'Session expired' } as ApiError;
    }
  }

  // If still 401 after refresh attempt, redirect
  if (response.status === 401) {
    clearTokens();
    window.location.href = ROUTES.HOME;
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
