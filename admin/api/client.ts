import { API_BASE } from "./config";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
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
