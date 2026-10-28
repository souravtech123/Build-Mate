import { apiFetch } from "./client";
import { ENDPOINTS } from "./config";

export interface IdeaItem {
  id: number;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  technologies?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_college?: string;
  user_id?: number;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  college?: string;
  plain_password?: string;
  is_verified?: boolean;
  is_blocked?: boolean;
  role?: string;
  created_at: string;
}

export interface AnalyticsData {
  total_users?: number;
  total_ideas?: number;
  total_applications?: number;
  total_page_views?: number;
  pending_ideas?: number;
  approved_ideas?: number;
  rejected_ideas?: number;
  blocked_users?: number;
  daily_views?: Array<{ date: string; count: number }>;
}

export interface FeedbackItem {
  id: number;
  type: string;
  message: string;
  email: string;
  name: string;
  created_at: string;
}

export const adminApi = {
  // Ideas
  getIdeas: (status?: string, limit = 50) =>
    apiFetch<{ ideas: IdeaItem[]; total: number }>(
      ENDPOINTS.ideas.list(status, limit)
    ),

  updateIdeaStatus: (id: number, action: "approve" | "reject") =>
    apiFetch(ENDPOINTS.ideas.action(id, action), { method: "PATCH" }),

  deleteIdea: (id: number) =>
    apiFetch(ENDPOINTS.ideas.delete(id), { method: "DELETE" }),

  // Users
  getUsers: (limit = 100) =>
    apiFetch<{ users: UserItem[]; total: number }>(
      ENDPOINTS.users.list(limit)
    ),

  toggleBlockUser: (id: number, isCurrentlyBlocked: boolean) => {
    const endpoint = isCurrentlyBlocked
      ? ENDPOINTS.users.unblock(id)
      : ENDPOINTS.users.block(id);
    return apiFetch(endpoint, { method: "PATCH" });
  },

  deleteUser: (id: number) =>
    apiFetch(ENDPOINTS.users.delete(id), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }),

  // Analytics
  getAnalytics: () => apiFetch<AnalyticsData>(ENDPOINTS.analytics),

  // Feedback
  getFeedback: () => apiFetch<FeedbackItem[]>(ENDPOINTS.feedback),
};
