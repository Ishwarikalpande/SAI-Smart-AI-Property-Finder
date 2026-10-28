// Central API Client for SAI Frontend
import { handleMockRequest } from "./mockData";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

// Track whether backend is available (optimistic at start, then cached)
let _backendAvailable: boolean | null = null;
let _lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 30000; // Re-check every 30 seconds

async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_backendAvailable !== null && (now - _lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    return _backendAvailable;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/properties?limit=1`, { signal: controller.signal, method: "GET" });
    clearTimeout(timeoutId);
    _backendAvailable = res.ok || res.status === 401 || res.status === 422;
  } catch {
    _backendAvailable = false;
  }
  _lastBackendCheck = now;
  return _backendAvailable;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem("sai_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("sai_token", token);
    } else {
      localStorage.removeItem("sai_token");
    }
  } catch {}
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem("sai_refresh_token");
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("sai_refresh_token", token);
    } else {
      localStorage.removeItem("sai_refresh_token");
    }
  } catch {}
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { _isRetry?: boolean } = {}
): Promise<T> {
  // Check backend availability first
  const backendUp = await isBackendAvailable();

  if (!backendUp) {
    // Use offline mock handler
    try {
      const mockResult = handleMockRequest(endpoint, options);
      // Simulate realistic network delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
      return mockResult as T;
    } catch (err: any) {
      throw err;
    }
  }

  // Backend is available — proceed with real API call
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchErr) {
    // Network error — fallback to mock
    _backendAvailable = false;
    _lastBackendCheck = Date.now();
    try {
      const mockResult = handleMockRequest(endpoint, options);
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockResult as T;
    } catch (err: any) {
      throw err;
    }
  }

  // Automatic token refresh on 401
  if (response.status === 401 && !options._isRetry && !endpoint.includes("/auth/")) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          if (tokenData.access_token) {
            setStoredToken(tokenData.access_token);
            if (tokenData.refresh_token) {
              setStoredRefreshToken(tokenData.refresh_token);
            }
            return apiRequest<T>(endpoint, { ...options, _isRetry: true });
          }
        } else {
          setStoredToken(null);
          setStoredRefreshToken(null);
        }
      } catch {
        setStoredToken(null);
        setStoredRefreshToken(null);
      }
    }
  }

  if (!response.ok) {
    let errorMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData && errData.message) {
        errorMsg = errData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

export async function uploadFiles(files: File[] | FileList): Promise<string[]> {
  // Check backend availability
  const backendUp = await isBackendAvailable();

  if (!backendUp) {
    // Create local preview URLs for uploaded files
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        // Create a blob URL for local preview
        urls.push(URL.createObjectURL(file));
      } else {
        urls.push(`local://upload/${file.name}`);
      }
    }
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    return urls;
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  try {
    const res = await apiRequest<{ success: boolean; urls: string[] }>("/upload", {
      method: "POST",
      body: formData,
    });
    return res.urls || [];
  } catch {
    // Fallback to local preview on error
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        urls.push(URL.createObjectURL(file));
      } else {
        urls.push(`local://upload/${file.name}`);
      }
    }
    return urls;
  }
}
