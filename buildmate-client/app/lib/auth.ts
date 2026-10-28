import { useSyncExternalStore } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  college?: string;
  skills?: string[];
  is_verified?: boolean;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  requires_verification?: boolean;
  email?: string;
}

export interface ProjectIdea {
  id: number;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  technologies?: string;
  required_skills?: string;
  team_requirements?: string;
  goal?: string;
  fund_plans?: string;
  target_fund?: string;
  github_url?: string;
  live_demo_url?: string;
  owner_id?: string;
  owner_name?: string;
  owner_college?: string;
  owner_email?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JoinRequest {
  id: number;
  project_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    college?: string;
    skills?: string[];
    bio?: string;
  };
  role: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  sender_id: number;
  sender_name: string;
  sender_role?: string;
  message: string;
  message_type: "text" | "system";
  created_at: string;
  updated_at?: string;
}

export interface RewardTicket {
  id: number;
  ticket_number: string;
  project_id: number;
  project?: ProjectIdea;
  task_id: number;
  user_id: number;
  user?: User;
  task_title: string;
  reward_title: string;
  reward_points: number;
  deadline: string;
  completed_at: string;
  status: "valid" | "claimed" | "redeemed";
  badge_color: string;
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  project?: ProjectIdea;
  title: string;
  description: string;
  assigned_to_user_id: number;
  assigned_to?: User;
  created_by_user_id: number;
  deadline: string;
  priority: "low" | "medium" | "high" | "urgent";
  reward_points: number;
  reward_title: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  completed_at?: string;
  is_completed_on_time: boolean;
  completion_note?: string;
  ticket?: RewardTicket;
  created_at: string;
  updated_at?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigned_to_user_id: number;
  deadline: string;
  priority: string;
  reward_points: number;
  reward_title: string;
}

export interface DashboardSummary {
  projects: any[];
  applications: any[];
  incoming_requests: any[];
  stats: {
    total_projects: number;
    total_applications: number;
    total_incoming: number;
  };
}

import { API_BASE } from "@/api";
export { API_BASE };

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("buildmate_token");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("buildmate_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem("buildmate_token", token);
  localStorage.setItem("buildmate_user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("buildmate_token");
  localStorage.removeItem("buildmate_user");
  window.dispatchEvent(new Event("auth-change"));
}

function subscribeAuth(callback: () => void) {
  window.addEventListener("auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getAuthSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("buildmate_user");
}

function getServerAuthSnapshot(): string | null {
  return null;
}

let cachedUserJson: string | null = null;
let cachedUser: User | null = null;

export function useCurrentUser(): User | null {
  const userJson = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  if (!userJson) {
    cachedUserJson = null;
    cachedUser = null;
    return null;
  }
  if (userJson !== cachedUserJson) {
    cachedUserJson = userJson;
    try {
      cachedUser = JSON.parse(userJson);
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  college?: string;
  skills?: string[];
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body: AuthResponse = await res.json();
    if (!res.ok && !body.requires_verification) {
      return {
        success: false,
        message: body.message || "Registration failed",
      };
    }

    if (body.token && body.user) {
      setAuth(body.token, body.user);
    }

    return body;
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please ensure backend is running",
    };
  }
}

export async function verifyOTP(data: {
  email: string;
  otp: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body: AuthResponse = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        message: body.message || "Verification failed",
      };
    }

    if (body.token && body.user) {
      setAuth(body.token, body.user);
    }

    return body;
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please try again",
    };
  }
}

export async function resendOTP(data: {
  email: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    return {
      success: res.ok && body.success,
      message: body.message || (res.ok ? "Verification code sent" : "Failed to resend code"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please try again",
    };
  }
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body: AuthResponse = await res.json();
    if (!res.ok) {
      return {
        success: false,
        requires_verification: body.requires_verification,
        email: body.email || data.email,
        message: body.message || "Login failed",
      };
    }

    if (body.token && body.user) {
      setAuth(body.token, body.user);
    }

    return body;
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please ensure backend is running",
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem("buildmate_user", JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch {
    return getStoredUser();
  }
}

export async function updateUserProfile(data: {
  name: string;
  college?: string;
  skills?: string[];
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
}): Promise<{ success: boolean; message?: string; user?: User }> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        message: body.message || "Failed to update profile",
      };
    }

    if (body.user) {
      localStorage.setItem("buildmate_user", JSON.stringify(body.user));
      window.dispatchEvent(new Event("auth-change"));
    }

    return {
      success: true,
      message: body.message || "Profile updated successfully",
      user: body.user,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please try again",
    };
  }
}

export async function changeUserPassword(data: {
  current_password: string;
  new_password: string;
}): Promise<{ success: boolean; message?: string }> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    return {
      success: res.ok && body.success,
      message: body.message || (res.ok ? "Password updated successfully" : "Failed to change password"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please try again",
    };
  }
}

export async function fetchUserDashboardSummary(): Promise<{
  success: boolean;
  data?: DashboardSummary;
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/dashboard-summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        message: body.message || "Failed to fetch dashboard summary",
      };
    }

    return {
      success: true,
      data: body.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error, please try again",
    };
  }
}

export async function fetchProjectTasks(projectId: number): Promise<{
  success: boolean;
  data?: ProjectTask[];
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/tasks`);
    const body = await res.json();
    return {
      success: res.ok && body.success,
      data: body.data || [],
      message: body.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error fetching tasks",
    };
  }
}

export async function createProjectTask(
  projectId: number,
  data: CreateTaskInput
): Promise<{
  success: boolean;
  data?: ProjectTask;
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return {
      success: res.ok && body.success,
      data: body.data,
      message: body.message || (res.ok ? "Task created" : "Failed to create task"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error creating task",
    };
  }
}

export async function updateTaskStatus(
  projectId: number,
  taskId: number,
  status: "in_progress" | "completed",
  note?: string
): Promise<{
  success: boolean;
  data?: { task: ProjectTask; ticket?: RewardTicket };
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note }),
    });
    const body = await res.json();
    return {
      success: res.ok && body.success,
      data: body.data,
      message: body.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error updating task status",
    };
  }
}

export async function deleteProjectTask(
  projectId: number,
  taskId: number
): Promise<{
  success: boolean;
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await res.json();
    return {
      success: res.ok && body.success,
      message: body.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error deleting task",
    };
  }
}

export async function fetchUserTasks(): Promise<{
  success: boolean;
  data?: ProjectTask[];
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/user/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await res.json();
    return {
      success: res.ok && body.success,
      data: body.data || [],
      message: body.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error fetching user tasks",
    };
  }
}

export async function fetchUserTickets(): Promise<{
  success: boolean;
  data?: RewardTicket[];
  message?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/user/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await res.json();
    return {
      success: res.ok && body.success,
      data: body.data || [],
      message: body.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error fetching reward tickets",
    };
  }
}

