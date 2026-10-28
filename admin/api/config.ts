export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export const ENDPOINTS = {
  ideas: {
    list: (status?: string, limit = 50) =>
      `/api/v1/admin/ideas?limit=${limit}${status && status !== "all" ? `&status=${status}` : ""}`,
    action: (id: number, action: "approve" | "reject") =>
      `/api/v1/admin/ideas/${id}/${action}`,
    delete: (id: number) => `/api/v1/admin/ideas/${id}`,
  },
  users: {
    list: (limit = 100) => `/api/v1/admin/users?limit=${limit}`,
    block: (id: number) => `/api/v1/admin/users/${id}/block`,
    unblock: (id: number) => `/api/v1/admin/users/${id}/unblock`,
    delete: (id: number) => `/api/v1/admin/users/${id}`,
  },
  analytics: "/api/v1/admin/analytics",
  feedback: "/api/v1/admin/feedback",
} as const;
