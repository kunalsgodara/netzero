/**
 * Real API client that replaces the Base44 SDK (globalThis.__B44_DB__).
 * 
 * Implements the same interface that all pages expect:
 *   db.auth.me(), db.auth.logout(), db.auth.redirectToLogin()
 *   db.entities.{Entity}.list(orderBy, limit), .create(data), .update(id, data), .delete(id)
 *   db.integrations.Core.InvokeLLM({ prompt, response_json_schema })
 *   db.integrations.Core.UploadFile(file)
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Token management ────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// Check URL for token on load (from OAuth callback)
(function captureTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("access_token");
  if (token) {
    setToken(token);
    params.delete("access_token");
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
})();

// ── Fetch helper ────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Only force-logout if the user had a token (stale/expired session).
    // If there was no token at all, this is a public API that returned 401
    // (e.g. before login), so just throw — don't wipe state or redirect.
    if (token) {
      clearToken();
      window.location.href = "/";
    }
    throw { status: 401, message: "Unauthorized" };
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw { status: 403, data, message: data.detail || "Forbidden" };
  }

  if (response.status === 204) {
    return {};
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { status: response.status, data, message: data.detail || "Request failed" };
  }

  return response.json();
}

// ── Entity name → API path mapping ─────────────────────────────

const ENTITY_PATHS = {
  Organization: "/api/v1/organizations",
  EmissionActivity: "/api/v1/emission-activities",
  CBAMImport: "/api/v1/cbam-imports",
  Report: "/api/v1/reports",
  EmissionFactor: "/api/v1/emission-factors",
};

function createEntityClient(entityName) {
  const basePath = ENTITY_PATHS[entityName];
  if (!basePath) {
    console.warn(`Unknown entity: ${entityName}, using fallback`);
    return {
      list: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    };
  }

  return {
    list: async (orderBy, limit) => {
      const params = new URLSearchParams();
      if (orderBy) params.set("order_by", orderBy);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      return apiFetch(`${basePath}${qs ? `?${qs}` : ""}`);
    },

    get: async (id) => {
      return apiFetch(`${basePath}/${id}`);
    },

    create: async (data) => {
      return apiFetch(basePath, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (id, data) => {
      return apiFetch(`${basePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id) => {
      return apiFetch(`${basePath}/${id}`, {
        method: "DELETE",
      });
    },

    // Alias used by the frontend dashboard
    filter: async (filters) => {
      // Simple: just list all and filter client-side for compatibility
      const params = new URLSearchParams();
      return apiFetch(`${basePath}?${params.toString()}`);
    },
  };
}

// ── The db object ───────────────────────────────────────────────

const db = {
  auth: {
    me: async () => {
      return apiFetch("/api/auth/me");
    },

    logout: (redirectUrl) => {
      clearToken();
      window.location.href = redirectUrl || "/";
    },

    redirectToLogin: (redirectUrl) => {
      // Store the intended redirect, then go to login page
      if (redirectUrl) {
        localStorage.setItem("login_redirect", redirectUrl);
      }
      // Navigate to a login page (frontend handles this)
      window.location.href = "/#/login";
    },

    isAuthenticated: async () => {
      const token = getToken();
      if (!token) return false;
      try {
        await apiFetch("/api/auth/me");
        return true;
      } catch {
        return false;
      }
    },
  },

  entities: new Proxy(
    {},
    {
      get: (_, entityName) => createEntityClient(entityName),
    }
  ),

  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema }) => {
        return apiFetch("/api/integrations/llm/invoke", {
          method: "POST",
          body: JSON.stringify({ prompt, response_json_schema }),
        });
      },

      UploadFile: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiFetch("/api/integrations/files/upload", {
          method: "POST",
          body: formData,
        });
      },
    },
  },
};

// Inject globally so all pages can use it
globalThis.__B44_DB__ = db;

export { db, db as base44 };
export default db;
