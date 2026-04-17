
import { httpFetch, getToken, getRefreshToken, setRefreshToken, clearTokens, setToken } from '@/services/httpClient';


export { httpFetch as apiFetch, getToken, getRefreshToken, setRefreshToken, clearTokens, setToken };

interface EntityClient {
  list: (orderBy?: string, limit?: number) => Promise<unknown[]>;
  get: (id: string) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
}

const ENTITY_PATHS: Record<string, string> = {
  Organization: '/api/v1/organizations',
  EmissionActivity: '/api/v1/emission-activities',
  CBAMImport: '/api/v1/cbam-imports',
  Report: '/api/v1/reports',
  EmissionFactor: '/api/v1/emission-factors',
};

function createEntityClient(entityName: string): EntityClient {
  const basePath = ENTITY_PATHS[entityName];
  if (!basePath) {
    console.warn(`Unknown entity: ${entityName}`);
    return {
      list: async () => [],
      get: async () => ({}),
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    };
  }
  return {
    list: (orderBy?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (orderBy) params.set('order_by', orderBy);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return httpFetch<unknown[]>(`${basePath}${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => httpFetch(`${basePath}/${id}`),
    create: (data: unknown) => httpFetch(basePath, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => httpFetch(`${basePath}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => httpFetch(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}

const apiClient = {
  auth: {
    me: () => httpFetch('/api/auth/me'),
    logout: (redirectUrl?: string) => { clearTokens(); window.location.href = redirectUrl || '/'; },
    isAuthenticated: async () => {
      if (!getToken()) return false;
      try { await httpFetch('/api/auth/me'); return true; } catch { return false; }
    },
  },
  entities: new Proxy({} as Record<string, EntityClient>, {
    get: (_target, entityName: string) => createEntityClient(entityName),
  }),
  integrations: {
    Core: {
      InvokeLLM: ({ prompt, response_json_schema }: { prompt: string; response_json_schema?: object }) =>
        httpFetch('/api/integrations/llm/invoke', { method: 'POST', body: JSON.stringify({ prompt, response_json_schema }) }),
      UploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return httpFetch('/api/integrations/files/upload', { method: 'POST', body: formData });
      },
    },
  },
};

globalThis.__B44_DB__ = apiClient;

export default apiClient;
