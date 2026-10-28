export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export function getWebSocketUrl(path: string, token?: string | null): string {
  const base = API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${cleanedPath}`;
  if (!token) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

export const ENDPOINTS = {
  auth: {
    register: "/api/auth/register",
    verifyOtp: "/api/auth/verify-otp",
    resendOtp: "/api/auth/resend-otp",
    login: "/api/auth/login",
    me: "/api/auth/me",
    profile: "/api/auth/profile",
    password: "/api/auth/password",
    dashboardSummary: "/api/auth/dashboard-summary",
  },
  ideas: {
    list: "/api/v1/ideas",
    detail: (id: number | string) => `/api/v1/ideas/${id}`,
    members: (id: number | string) => `/api/v1/ideas/${id}/members`,
    requests: (id: number | string) => `/api/v1/ideas/${id}/requests`,
    join: (id: number | string) => `/api/v1/ideas/${id}/join`,
    updateRequest: (id: number | string, requestId: number | string) =>
      `/api/v1/ideas/${id}/requests/${requestId}`,
  },
  tasks: {
    projectTasks: (projectId: number | string) =>
      `/api/v1/ideas/${projectId}/tasks`,
    updateTaskStatus: (projectId: number | string, taskId: number | string) =>
      `/api/v1/ideas/${projectId}/tasks/${taskId}/status`,
    deleteTask: (projectId: number | string, taskId: number | string) =>
      `/api/v1/ideas/${projectId}/tasks/${taskId}`,
    userTasks: "/api/v1/user/tasks",
    userTickets: "/api/v1/user/tickets",
  },
  chat: {
    messages: (projectId: number | string) =>
      `/api/v1/ideas/${projectId}/chat/messages`,
    ws: (projectId: number | string) =>
      `/api/v1/ideas/${projectId}/chat/ws`,
  },
  feedback: "/api/v1/feedback",
  pageview: "/api/v1/pageview",
} as const;
