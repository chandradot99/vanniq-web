/**
 * Base API client — reads token from Zustand auth store, handles 401 with
 * automatic token refresh. On refresh failure, logs out and redirects to /login.
 */

import { useAuthStore } from "@/store/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Shared promise so concurrent 401s only trigger one refresh call.
let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    window.location.href = "/login";
    throw new ApiError(401, "No refresh token");
  }

  const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    logout();
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token, data.org_id, data.role);
  return data.access_token as string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Token expired — attempt refresh then retry once.
  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    let newToken: string;
    try {
      newToken = await refreshPromise;
    } catch {
      // doRefresh already logged out and redirected.
      throw new ApiError(401, "Session expired");
    }

    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });

    if (!retryRes.ok) {
      const body = await retryRes.json().catch(() => ({}));
      throw new ApiError(retryRes.status, body?.detail ?? retryRes.statusText);
    }

    if (retryRes.status === 204) return undefined as T;
    return retryRes.json();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
