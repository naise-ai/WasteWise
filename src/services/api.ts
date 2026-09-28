// ============================================================
// WasteWise — Centralized HTTP API Client
// ============================================================

// In development, Vite proxies relative /api requests to localhost:8000.
// The hosted demo uses Render by default; VITE_API_URL can override it.
const DEFAULT_PRODUCTION_API_URL = 'https://wastewise-api-vcdt.onrender.com';
const BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : '')
).replace(/\/$/, '');
const IS_PRODUCTION = import.meta.env.PROD;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // A deployed Vite site has no development proxy. Fail clearly instead of
  // sending requests to the frontend host's non-existent /api route (502).
  if (IS_PRODUCTION && !BASE_URL) {
    throw new Error('Service API is not configured. Set VITE_API_URL for this deployment.');
  }

  const token = localStorage.getItem('ww-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('ww-token');
    localStorage.removeItem('ww-user');
    // If not on login page, redirect or clear state
  }

  if (!response.ok) {
    let errorMsg = `API Error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
