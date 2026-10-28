import { API_BASE } from "./config";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("buildmate_token");
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const headers = new Headers(options.headers || {});

  // Automatically attach auth bearer token if available and not explicitly provided
  if (!headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Set default JSON Content-Type if body is present and not FormData
  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch {
    data = {
      success: res.ok,
      message: res.statusText || "Unexpected response from server",
    };
  }

  if (!res.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};
