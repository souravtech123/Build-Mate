"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ban,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Filter,
  GraduationCap,
  KeyRound,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Briefcase,
  Bug,
  Inbox,
  Mail,
  MessageSquare,
  Smartphone,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { API_BASE } from "@/api";

type MainTab = "projects" | "users" | "analytics" | "feedback";
type IdeaStatus = "all" | "pending" | "approved" | "rejected";
type IdeaAction = "approve" | "reject";

interface FeedbackItem {
  id: number;
  type: string;
  message: string;
  email: string;
  name: string;
  created_at: string;
}

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  technologies: string;
  required_skills: string;
  owner_name: string;
  owner_college: string;
  status: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  college?: string;
  skills?: string[];
  is_admin: boolean;
  is_blocked: boolean;
  plain_password?: string;
  createdAt: string;
}

interface AnalyticsData {
  users: {
    total: number;
    blocked: number;
    active: number;
  };
  projects: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  page_views: {
    total: number;
    current_visitors_5m: number;
    last_24h: number;
    popular_pages: { path: string; views: number }[];
    daily_stats: { date: string; views: number }[];
  };
}

const IDEA_STATUS_TABS: { label: string; value: IdeaStatus; icon: typeof Layers3 }[] = [
  { label: "All ideas", value: "all", icon: Layers3 },
  { label: "Pending review", value: "pending", icon: Clock3 },
  { label: "Approved", value: "approved", icon: CheckCircle2 },
  { label: "Rejected", value: "rejected", icon: XCircle },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

function formatDate(value: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState<MainTab>("projects");

  // Projects state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaTab, setIdeaTab] = useState<IdeaStatus>("pending");
  const [searchIdea, setSearchIdea] = useState("");
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modals for ideas
  const [confirmStatusAction, setConfirmStatusAction] = useState<{
    idea: Idea;
    action: IdeaAction;
  } | null>(null);
  const [confirmDeleteIdea, setConfirmDeleteIdea] = useState<Idea | null>(null);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchUser, setSearchUser] = useState("");
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [confirmToggleBlock, setConfirmToggleBlock] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedPasswordId, setCopiedPasswordId] = useState<number | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Feedback & Applications state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>("all");
  const [searchFeedback, setSearchFeedback] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch Ideas
  const fetchIdeas = useCallback(
    async (status: IdeaStatus, manual = false) => {
      setIdeasLoading(true);
      const statusParam = status === "all" ? "" : `&status=${status}`;

      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/ideas?limit=50${statusParam}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Unable to load project ideas.");
        }
        setIdeas(data.data?.ideas || []);
        setTotalIdeas(data.data?.total || 0);
        if (manual) showToast("Projects refreshed", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load ideas", "error");
      } finally {
        setIdeasLoading(false);
      }
    },
    [showToast]
  );

  // Fetch Users
  const fetchUsers = useCallback(
    async (manual = false) => {
      setUsersLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/users?limit=100`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load users");
        }
        setUsers(data.data?.users || []);
        setTotalUsers(data.data?.total || 0);
        if (manual) showToast("Users list refreshed", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to fetch users", "error");
      } finally {
        setUsersLoading(false);
      }
    },
    [showToast]
  );

  // Fetch Analytics
  const fetchAnalytics = useCallback(
    async (manual = false) => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/analytics`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load analytics");
        }
        setAnalytics(data.data);
        if (manual) showToast("Analytics data refreshed", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load analytics", "error");
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [showToast]
  );

  // Fetch Feedbacks & Applications
  const fetchFeedbacks = useCallback(
    async (manual = false) => {
      setFeedbacksLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/feedback`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load feedback");
        }
        setFeedbacks(data.data || []);
        if (manual) showToast("Feedback inbox refreshed", "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Failed to load feedback", "error");
      } finally {
        setFeedbacksLoading(false);
      }
    },
    [showToast]
  );

  // Load appropriate data when tab changes
  useEffect(() => {
    if (currentTab === "projects") {
      void fetchIdeas(ideaTab);
    } else if (currentTab === "users") {
      void fetchUsers();
    } else if (currentTab === "analytics") {
      void fetchAnalytics();
    } else if (currentTab === "feedback") {
      void fetchFeedbacks();
    }
  }, [currentTab, ideaTab, fetchIdeas, fetchUsers, fetchAnalytics, fetchFeedbacks]);

  // Project filtering
  const filteredIdeas = useMemo(() => {
    const query = searchIdea.trim().toLowerCase();
    if (!query) return ideas;
    return ideas.filter((idea) =>
      [
        idea.title,
        idea.description,
        idea.category,
        idea.technologies,
        idea.required_skills,
        idea.owner_name,
        idea.owner_college,
      ].some((field) => (field || "").toLowerCase().includes(query))
    );
  }, [ideas, searchIdea]);

  // User filtering
  const filteredUsers = useMemo(() => {
    const query = searchUser.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) =>
      [u.name, u.email, u.college, ...(u.skills || [])].some((field) =>
        (field || "").toLowerCase().includes(query)
      )
    );
  }, [users, searchUser]);

  // Feedback filtering
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchesType =
        feedbackTypeFilter === "all" ||
        item.type?.toLowerCase() === feedbackTypeFilter.toLowerCase();
      const query = searchFeedback.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [item.name, item.email, item.message, item.type].some((f) =>
          (f || "").toLowerCase().includes(query)
        );
      return matchesType && matchesSearch;
    });
  }, [feedbacks, feedbackTypeFilter, searchFeedback]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle Idea Status Action (approve / reject)
  const handleStatusAction = async (id: number, action: IdeaAction) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/ideas/${id}/${action}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Action failed. Please try again.");
      }

      showToast(
        action === "approve"
          ? "Project approved — it is now publicly visible."
          : "Project idea marked as rejected.",
        "success"
      );
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      setTotalIdeas((prev) => Math.max(0, prev - 1));
      setExpandedIds((prev) => prev.filter((item) => item !== id));
      setConfirmStatusAction(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Network error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete Idea
  const handleDeleteIdea = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/ideas/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete project.");
      }

      showToast("Project idea permanently deleted.", "success");
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      setTotalIdeas((prev) => Math.max(0, prev - 1));
      setExpandedIds((prev) => prev.filter((item) => item !== id));
      setConfirmDeleteIdea(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete project", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Block / Unblock User
  const handleToggleBlockUser = async (user: User) => {
    setUserActionLoading(user.id);
    const endpoint = user.is_blocked ? "unblock" : "block";
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${user.id}/${endpoint}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${endpoint} user.`);
      }

      showToast(
        user.is_blocked
          ? `User "${user.name}" has been unblocked.`
          : `User "${user.name}" has been blocked and cannot log in.`,
        "success"
      );

      // Update in state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !user.is_blocked } : u))
      );
      setConfirmToggleBlock(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update user status", "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: User) => {
    setUserActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user.");
      }

      showToast(`User "${user.name}" permanently deleted.`, "success");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotalUsers((prev) => Math.max(0, prev - 1));
      setConfirmDeleteUser(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete user", "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (userId: number, password?: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPasswordId(userId);
    showToast("Password copied to clipboard!", "success");
    setTimeout(() => {
      setCopiedPasswordId((prev) => (prev === userId ? null : prev));
    }, 2000);
  };

  const pendingVisible = ideas.filter((idea) => idea.status === "pending").length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F6FB] text-[#0E1633]">
      {/* Background blueprint grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(#D5DBEB 1px, transparent 1px), linear-gradient(90deg, #D5DBEB 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#2342F5]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#FFB620]/10 blur-3xl"
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-xl backdrop-blur-xl sm:right-6 ${
            toast.type === "success"
              ? "border-emerald-200 bg-white/95 text-emerald-800"
              : "border-rose-200 bg-white/95 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          ) : (
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
            className="rounded-md p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#D5DBEB]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-lg shadow-[#2342F5]/20">
              <ShieldCheck size={21} />
            </div>
            <div>
              <p className="text-[15px] font-extrabold tracking-tight">
                Build-Mate <span className="text-[#2342F5]">Admin</span>
              </p>
              <p className="hidden text-[10px] font-bold tracking-wider text-slate-500 sm:block">
                CENTRAL CONTROL PORTAL
              </p>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <nav className="flex items-center gap-1 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-1.5 shadow-inner">
            <button
              onClick={() => setCurrentTab("projects")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition duration-200 sm:text-sm ${
                currentTab === "projects"
                  ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25"
                  : "text-slate-600 hover:bg-white hover:text-[#0E1633]"
              }`}
            >
              <Layers3 size={15} />
              Projects
            </button>
            <button
              onClick={() => setCurrentTab("users")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition duration-200 sm:text-sm ${
                currentTab === "users"
                  ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25"
                  : "text-slate-600 hover:bg-white hover:text-[#0E1633]"
              }`}
            >
              <Users size={15} />
              Users
            </button>
            <button
              onClick={() => setCurrentTab("analytics")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition duration-200 sm:text-sm ${
                currentTab === "analytics"
                  ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25"
                  : "text-slate-600 hover:bg-white hover:text-[#0E1633]"
              }`}
            >
              <BarChart3 size={15} />
              Analytics
            </button>
            <button
              onClick={() => setCurrentTab("feedback")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition duration-200 sm:text-sm ${
                currentTab === "feedback"
                  ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25"
                  : "text-slate-600 hover:bg-white hover:text-[#0E1633]"
              }`}
            >
              <Inbox size={15} />
              <span>Feedback & Apps</span>
              {feedbacks.length > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    currentTab === "feedback"
                      ? "bg-white text-[#2342F5]"
                      : "bg-[#2342F5]/10 text-[#2342F5]"
                  }`}
                >
                  {feedbacks.length}
                </span>
              )}
            </button>
          </nav>

          <div className="hidden items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Admin Console
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* ========================================================= */}
        {/* TAB 1: PROJECTS MODERATION & DELETION */}
        {/* ========================================================= */}
        {currentTab === "projects" && (
          <div>
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2342F5]/15 bg-[#2342F5]/[0.06] px-3 py-1.5 text-xs font-bold text-[#2342F5]">
                  <Sparkles size={14} /> PROJECT CONTROL & MODERATION
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Manage Projects<span className="text-[#2342F5]">.</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Review student ideas, approve or reject submissions, and delete inappropriate or
                  outdated project postings.
                </p>
              </div>
              <button
                onClick={() => void fetchIdeas(ideaTab, true)}
                disabled={ideasLoading}
                className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D5DBEB] bg-white px-4 text-sm font-bold text-[#0E1633] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2342F5]/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
              >
                <RefreshCw size={16} className={ideasLoading ? "animate-spin" : ""} /> Refresh list
              </button>
            </div>

            {/* Quick Metrics */}
            <section
              aria-label="Moderation overview"
              className="mb-8 grid gap-4 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Total Ideas Found</span>
                  <span className="rounded-xl bg-[#2342F5]/[0.08] p-2.5 text-[#2342F5]">
                    <FileText size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums">
                    {ideasLoading ? "—" : totalIdeas}
                  </p>
                  <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Activity size={13} /> Active in DB
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Pending Review</span>
                  <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                    <Clock3 size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums">
                    {ideasLoading ? "—" : pendingVisible}
                  </p>
                  <span className="mb-1 text-xs font-semibold text-amber-700">Action required</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Search Results</span>
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <Search size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums">
                    {ideasLoading ? "—" : filteredIdeas.length}
                  </p>
                  <span className="mb-1 text-xs font-semibold text-slate-500">Matches visible</span>
                </div>
              </div>
            </section>

            {/* Ideas List Container */}
            <section className="overflow-hidden rounded-3xl border border-[#D5DBEB] bg-white shadow-[0_18px_60px_-36px_rgba(14,22,51,0.28)]">
              <div className="border-b border-[#D5DBEB] p-4 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Project Submissions</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Filter by status, search details, approve submissions, or permanently delete
                      projects.
                    </p>
                  </div>
                  <div className="relative w-full xl:max-w-sm">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={searchIdea}
                      onChange={(e) => setSearchIdea(e.target.value)}
                      placeholder="Search title, student, tech..."
                      aria-label="Search project ideas"
                      className="h-11 w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] pl-10 pr-10 text-sm text-[#0E1633] outline-none transition placeholder:text-slate-400 focus:border-[#2342F5]/60 focus:bg-white focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                    />
                    {searchIdea && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearchIdea("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div
                  className="mt-5 flex gap-2 overflow-x-auto pb-1"
                  role="tablist"
                  aria-label="Filter ideas by status"
                >
                  {IDEA_STATUS_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = ideaTab === tab.value;
                    return (
                      <button
                        key={tab.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setIdeaTab(tab.value)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition duration-200 ${
                          active
                            ? "border-[#2342F5] bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20"
                            : "border-transparent bg-[#F4F6FB] text-slate-600 hover:border-[#D5DBEB] hover:bg-white hover:text-[#0E1633]"
                        }`}
                      >
                        <Icon size={15} /> {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFBFF] px-4 py-3 text-xs text-slate-500 sm:px-6">
                <span className="inline-flex items-center gap-2">
                  <Filter size={14} />{" "}
                  {ideasLoading
                    ? "Loading projects…"
                    : `Showing ${filteredIdeas.length} of ${ideas.length} loaded ideas`}
                </span>
                <span>
                  {ideaTab === "all"
                    ? "All statuses"
                    : `${ideaTab.charAt(0).toUpperCase()}${ideaTab.slice(1)} projects`}
                </span>
              </div>

              {ideasLoading ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2342F5]/[0.08] text-[#2342F5]">
                    <Loader2 size={23} className="animate-spin" />
                  </div>
                  <p className="font-bold">Loading ideas</p>
                  <p className="mt-1 text-sm text-slate-500">Getting the latest submissions.</p>
                </div>
              ) : filteredIdeas.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D5DBEB] bg-[#F4F6FB] text-slate-500">
                    {searchIdea ? <Search size={24} /> : <Layers3 size={24} />}
                  </div>
                  <h3 className="text-base font-extrabold">
                    {searchIdea ? "No matching ideas" : "No projects found"}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    {searchIdea
                      ? "Try searching by another title, student name, or keyword."
                      : "There are no ideas in this status right now."}
                  </p>
                  {searchIdea && (
                    <button
                      onClick={() => setSearchIdea("")}
                      className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-[#2342F5] transition hover:bg-[#2342F5]/[0.06]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#E8ECF5]">
                  {filteredIdeas.map((idea) => {
                    const expanded = expandedIds.includes(idea.id);
                    const busy = actionLoading === idea.id;
                    return (
                      <article
                        key={idea.id}
                        className="p-4 transition-colors hover:bg-[#FAFBFF]/80 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 flex-1 gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D5DBEB] bg-[#F4F6FB] text-sm font-black text-[#2342F5]">
                              {initials(idea.owner_name || "User")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h3 className="break-words text-base font-extrabold leading-snug tracking-tight sm:text-lg">
                                  {idea.title}
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                    STATUS_STYLES[idea.status] ||
                                    "border-slate-200 bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      idea.status === "pending"
                                        ? "bg-amber-500"
                                        : idea.status === "approved"
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                    }`}
                                  />
                                  {idea.status}
                                </span>
                              </div>
                              <p
                                className={`max-w-4xl text-sm leading-6 text-slate-600 ${
                                  expanded ? "" : "line-clamp-2"
                                }`}
                              >
                                {idea.description}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {idea.category && (
                                  <span className="rounded-lg border border-[#D5DBEB] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {idea.category}
                                  </span>
                                )}
                                {idea.difficulty && (
                                  <span className="rounded-lg border border-[#D5DBEB] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {idea.difficulty}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                  <GraduationCap size={14} />
                                  {idea.owner_name || "Unknown student"}
                                  {idea.owner_college ? ` · ${idea.owner_college}` : ""}
                                </span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">
                                  {formatDate(idea.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex shrink-0 flex-wrap items-center gap-2 pl-0 lg:pl-3">
                            <button
                              onClick={() => toggleExpanded(idea.id)}
                              aria-expanded={expanded}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-[#2342F5]/30 hover:bg-[#F4F6FB]"
                            >
                              {expanded ? "Less details" : "Details"}
                              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>

                            {idea.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    setConfirmStatusAction({ idea, action: "reject" })
                                  }
                                  disabled={busy}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                                >
                                  <X size={15} /> Reject
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmStatusAction({ idea, action: "approve" })
                                  }
                                  disabled={busy}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2342F5] px-3.5 text-sm font-bold text-white shadow-md shadow-[#2342F5]/15 transition hover:-translate-y-0.5 hover:bg-[#1936DF] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {busy ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Check size={15} />
                                  )}
                                  Approve
                                </button>
                              </>
                            )}

                            {/* DELETE PROJECT BUTTON */}
                            <button
                              onClick={() => setConfirmDeleteIdea(idea)}
                              disabled={busy}
                              title="Delete project permanently"
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 text-sm font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="ml-0 mt-5 grid gap-4 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-4 sm:grid-cols-2 sm:p-5 lg:ml-[58px]">
                            <div>
                              <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                Technologies
                              </p>
                              <p className="text-sm leading-6 text-[#0E1633]">
                                {idea.technologies?.trim() || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                Skills requested
                              </p>
                              <p className="text-sm leading-6 text-[#0E1633]">
                                {idea.required_skills?.trim() || "Not specified"}
                              </p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                Project ID
                              </p>
                              <p className="text-sm leading-6 font-mono text-slate-500">
                                #{idea.id}
                              </p>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USER MANAGEMENT & BLOCK/UNBLOCK */}
        {/* ========================================================= */}
        {currentTab === "users" && (
          <div>
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2342F5]/15 bg-[#2342F5]/[0.06] px-3 py-1.5 text-xs font-bold text-[#2342F5]">
                  <Users size={14} /> USER ACCESS MANAGEMENT
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Platform Users<span className="text-[#2342F5]">.</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  View all registered accounts, inspect their profile information, and block or
                  unblock user access.
                </p>
              </div>
              <button
                onClick={() => void fetchUsers(true)}
                disabled={usersLoading}
                className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D5DBEB] bg-white px-4 text-sm font-bold text-[#0E1633] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2342F5]/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
              >
                <RefreshCw size={16} className={usersLoading ? "animate-spin" : ""} /> Refresh users
              </button>
            </div>

            {/* Quick Metrics */}
            <section className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Total Users</span>
                  <span className="rounded-xl bg-[#2342F5]/[0.08] p-2.5 text-[#2342F5]">
                    <Users size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums">
                    {usersLoading ? "—" : totalUsers}
                  </p>
                  <span className="mb-1 text-xs font-semibold text-slate-500">Registered</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Active Users</span>
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <UserCheck size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums text-emerald-600">
                    {usersLoading ? "—" : users.filter((u) => !u.is_blocked).length}
                  </p>
                  <span className="mb-1 text-xs font-semibold text-emerald-700">Permitted</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0E1633]/[0.04]">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-500">Blocked Users</span>
                  <span className="rounded-xl bg-rose-50 p-2.5 text-rose-700">
                    <Ban size={19} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tabular-nums text-rose-600">
                    {usersLoading ? "—" : users.filter((u) => u.is_blocked).length}
                  </p>
                  <span className="mb-1 text-xs font-semibold text-rose-700">Access Restricted</span>
                </div>
              </div>
            </section>

            {/* Users Table Card */}
            <section className="overflow-hidden rounded-3xl border border-[#D5DBEB] bg-white shadow-[0_18px_60px_-36px_rgba(14,22,51,0.28)]">
              <div className="border-b border-[#D5DBEB] p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Registered Members</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage student credentials, access permissions, and account moderation.
                    </p>
                  </div>
                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Search name, email, college..."
                      aria-label="Search users"
                      className="h-11 w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] pl-10 pr-10 text-sm text-[#0E1633] outline-none transition placeholder:text-slate-400 focus:border-[#2342F5]/60 focus:bg-white focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                    />
                    {searchUser && (
                      <button
                        aria-label="Clear user search"
                        onClick={() => setSearchUser("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2342F5]/[0.08] text-[#2342F5]">
                    <Loader2 size={23} className="animate-spin" />
                  </div>
                  <p className="font-bold">Loading users</p>
                  <p className="mt-1 text-sm text-slate-500">Retrieving platform directory.</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D5DBEB] bg-[#F4F6FB] text-slate-500">
                    <Users size={24} />
                  </div>
                  <h3 className="text-base font-extrabold">No users found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchUser ? "Try another name, email, or college." : "No registered users."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#D5DBEB] bg-[#FAFBFF] text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">College</th>
                        <th className="px-6 py-3.5">Password</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Joined</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8ECF5] text-sm">
                      {filteredUsers.map((user) => {
                        const isBusy = userActionLoading === user.id;
                        return (
                          <tr key={user.id} className="transition-colors hover:bg-[#FAFBFF]/80">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                                    user.is_blocked
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-[#2342F5]/[0.08] text-[#2342F5]"
                                  }`}
                                >
                                  {initials(user.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#0E1633]">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {user.college || <span className="text-slate-400 italic">Not set</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="font-mono text-xs text-[#0E1633] bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg select-all max-w-[160px] truncate">
                                  {user.plain_password ? (
                                    revealedPasswords[user.id] ? (
                                      <span>{user.plain_password}</span>
                                    ) : (
                                      <span className="tracking-widest font-black text-slate-400">••••••••</span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 italic">Not set</span>
                                  )}
                                </div>
                                {user.plain_password && (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(user.id)}
                                      title={revealedPasswords[user.id] ? "Hide password" : "Show password"}
                                      className="rounded-lg p-1 text-slate-400 hover:text-[#2342F5] hover:bg-[#EEF1FF] transition"
                                    >
                                      {revealedPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassword(user.id, user.plain_password)}
                                      title="Copy password"
                                      className="rounded-lg p-1 text-slate-400 hover:text-[#2342F5] hover:bg-[#EEF1FF] transition"
                                    >
                                      {copiedPasswordId === user.id ? (
                                        <Check size={14} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={14} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {user.is_admin ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#2342F5]/30 bg-[#2342F5]/10 px-2.5 py-0.5 text-xs font-bold text-[#2342F5]">
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                  Student
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {user.is_blocked ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* BLOCK / UNBLOCK BUTTON */}
                                {user.is_blocked ? (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmToggleBlock(user)}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {isBusy ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <ShieldCheck size={13} />
                                    )}
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmToggleBlock(user)}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    {isBusy ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <ShieldAlert size={13} />
                                    )}
                                    Block User
                                  </button>
                                )}

                                {/* DELETE USER BUTTON */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteUser(user);
                                  }}
                                  disabled={isBusy}
                                  title="Delete user permanently"
                                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ANALYTICS & CURRENT PAGE VISITS */}
        {/* ========================================================= */}
        {currentTab === "analytics" && (
          <div>
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2342F5]/15 bg-[#2342F5]/[0.06] px-3 py-1.5 text-xs font-bold text-[#2342F5]">
                  <TrendingUp size={14} /> REAL-TIME TRAFFIC & METRICS
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Platform Analytics<span className="text-[#2342F5]">.</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Track real-time active visitors, total page views across the platform, and user
                  growth analytics.
                </p>
              </div>
              <button
                onClick={() => void fetchAnalytics(true)}
                disabled={analyticsLoading}
                className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D5DBEB] bg-white px-4 text-sm font-bold text-[#0E1633] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2342F5]/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
              >
                <RefreshCw size={16} className={analyticsLoading ? "animate-spin" : ""} /> Refresh
                stats
              </button>
            </div>

            {/* Core Analytics Cards */}
            <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* CURRENTLY VISITING USERS */}
              <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Live Active Visitors
                  </span>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-emerald-700 tabular-nums">
                    {analyticsLoading
                      ? "—"
                      : analytics?.page_views.current_visitors_5m ?? 0}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Visited in the last 5 minutes
                  </p>
                </div>
              </div>

              {/* TOTAL PAGE VIEWS */}
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Page Views
                  </span>
                  <div className="rounded-xl bg-[#2342F5]/[0.08] p-2.5 text-[#2342F5]">
                    <Eye size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-[#0E1633] tabular-nums">
                    {analyticsLoading ? "—" : analytics?.page_views.total ?? 0}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    +{analytics?.page_views.last_24h ?? 0} views past 24 hours
                  </p>
                </div>
              </div>

              {/* TOTAL PLATFORM USERS */}
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registered Users
                  </span>
                  <div className="rounded-xl bg-purple-50 p-2.5 text-purple-700">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-[#0E1633] tabular-nums">
                    {analyticsLoading ? "—" : analytics?.users.total ?? 0}
                  </p>
                  <div className="mt-1 flex gap-2 text-xs font-semibold">
                    <span className="text-emerald-600">
                      {analytics?.users.active ?? 0} active
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-rose-600">
                      {analytics?.users.blocked ?? 0} blocked
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL PROJECTS */}
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Projects
                  </span>
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                    <FileText size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-[#0E1633] tabular-nums">
                    {analyticsLoading ? "—" : analytics?.projects.total ?? 0}
                  </p>
                  <div className="mt-1 flex gap-2 text-xs font-semibold">
                    <span className="text-amber-600">
                      {analytics?.projects.pending ?? 0} pending
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-600">
                      {analytics?.projects.approved ?? 0} live
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Popular Pages Table & Daily Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Popular Pages */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight">Most Visited Pages</h3>
                    <p className="text-xs text-slate-500">Top routes by visitor impressions</p>
                  </div>
                  <Eye size={17} className="text-slate-400" />
                </div>

                {analyticsLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-[#2342F5]" />
                  </div>
                ) : !analytics?.page_views.popular_pages ||
                  analytics.page_views.popular_pages.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                    <Eye size={24} className="mb-2 opacity-50" />
                    <p className="text-xs">No page visit records recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.page_views.popular_pages.map((p, index) => {
                      const maxViews = analytics.page_views.popular_pages[0]?.views || 1;
                      const percentage = Math.round((p.views / maxViews) * 100);
                      return (
                        <div key={p.path} className="group">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-[#0E1633]">
                              <span className="mr-2 text-slate-400">{index + 1}.</span>
                              {p.path}
                            </span>
                            <span className="font-bold text-slate-600 tabular-nums">
                              {p.views} {p.views === 1 ? "view" : "views"}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F4F6FB]">
                            <div
                              className="h-full rounded-full bg-[#2342F5] transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Projects Breakdown by Status */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight">Project Distribution</h3>
                    <p className="text-xs text-slate-500">Breakdown of submitted ideas</p>
                  </div>
                  <Layers3 size={17} className="text-slate-400" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                    <Clock3 size={20} className="mx-auto mb-2 text-amber-700" />
                    <p className="text-2xl font-black text-amber-800">
                      {analytics?.projects.pending ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-amber-700">Pending</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
                    <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-700" />
                    <p className="text-2xl font-black text-emerald-800">
                      {analytics?.projects.approved ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">Approved</p>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center">
                    <XCircle size={20} className="mx-auto mb-2 text-rose-700" />
                    <p className="text-2xl font-black text-rose-800">
                      {analytics?.projects.rejected ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-rose-700">Rejected</p>
                  </div>
                </div>

                {/* 7-Day Traffic Activity */}
                <div className="mt-8 border-t border-[#D5DBEB] pt-6">
                  <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Recent Daily Traffic History
                  </h4>
                  {!analytics?.page_views.daily_stats ||
                  analytics.page_views.daily_stats.length === 0 ? (
                    <p className="text-xs text-slate-400">Traffic history will appear as users navigate.</p>
                  ) : (
                    <div className="flex items-end gap-2 h-28 pt-4">
                      {analytics.page_views.daily_stats.map((day) => {
                        const maxDaily = Math.max(
                          ...analytics.page_views.daily_stats.map((d) => d.views),
                          1
                        );
                        const heightPct = Math.max(12, Math.round((day.views / maxDaily) * 100));
                        return (
                          <div
                            key={day.date}
                            className="flex flex-1 flex-col items-center gap-1 group"
                          >
                            <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                              {day.views}
                            </span>
                            <div
                              className="w-full rounded-lg bg-[#2342F5]/80 transition-all hover:bg-[#2342F5]"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[9px] font-semibold text-slate-400">
                              {day.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FEEDBACKS, SUGGESTIONS & DEV TEAM APPLICATIONS */}
        {/* ========================================================= */}
        {currentTab === "feedback" && (
          <div>
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2342F5]/15 bg-[#2342F5]/[0.06] px-3 py-1.5 text-xs font-bold text-[#2342F5]">
                  <Sparkles size={14} /> COMMUNITY INBOX & APPLICATIONS
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Feedback & Dev Team Applications<span className="text-[#2342F5]">.</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Review student feedback, bug reports, feature suggestions, mobile app waitlist bookings,
                  and applications to join the Build-Mate development team.
                </p>
              </div>
              <button
                disabled={feedbacksLoading}
                onClick={() => void fetchFeedbacks(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={15} className={feedbacksLoading ? "animate-spin text-[#2342F5]" : ""} />
                Refresh Inbox
              </button>
            </div>

            {/* Metrics Overview */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2342F5]/[0.08] text-[#2342F5]">
                    <Inbox size={18} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-[#0E1633]">{feedbacks.length}</p>
                <p className="mt-1 text-xs text-slate-500">Across all categories</p>
              </div>

              <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Join Dev Team</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <Briefcase size={18} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-purple-900">
                  {feedbacks.filter((f) => f.type === "join_dev_team").length}
                </p>
                <p className="mt-1 text-xs text-purple-700">Student developer applicants</p>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Suggestions & Ideas</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <MessageSquare size={18} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-blue-900">
                  {feedbacks.filter((f) => f.type === "suggestion" || f.type === "feedback").length}
                </p>
                <p className="mt-1 text-xs text-blue-700">Feedback & ideas submitted</p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">App Waitlist Bookings</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Smartphone size={18} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-emerald-900">
                  {feedbacks.filter((f) => f.type === "app_waitlist").length}
                </p>
                <p className="mt-1 text-xs text-emerald-700">Mobile app pre-registrations</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Type Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#D5DBEB] bg-white p-1.5 shadow-sm">
                {[
                  { label: "All", value: "all", count: feedbacks.length },
                  {
                    label: "🚀 Join Dev Team",
                    value: "join_dev_team",
                    count: feedbacks.filter((f) => f.type === "join_dev_team").length,
                  },
                  {
                    label: "💡 Suggestions",
                    value: "suggestion",
                    count: feedbacks.filter((f) => f.type === "suggestion").length,
                  },
                  {
                    label: "🐛 Bugs",
                    value: "bug",
                    count: feedbacks.filter((f) => f.type === "bug").length,
                  },
                  {
                    label: "💬 Feedback",
                    value: "feedback",
                    count: feedbacks.filter((f) => f.type === "feedback").length,
                  },
                  {
                    label: "📱 App Waitlist",
                    value: "app_waitlist",
                    count: feedbacks.filter((f) => f.type === "app_waitlist").length,
                  },
                ].map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() => setFeedbackTypeFilter(pill.value)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      feedbackTypeFilter === pill.value
                        ? "bg-[#2342F5] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        feedbackTypeFilter === pill.value
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[280px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, keyword..."
                  value={searchFeedback}
                  onChange={(e) => setSearchFeedback(e.target.value)}
                  className="w-full rounded-2xl border border-[#D5DBEB] bg-white py-2.5 pl-10 pr-4 text-xs font-semibold placeholder:text-slate-400 focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/10"
                />
                {searchFeedback && (
                  <button
                    onClick={() => setSearchFeedback("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Content List */}
            {feedbacksLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-[#D5DBEB] bg-white py-20 text-center">
                <Loader2 size={36} className="animate-spin text-[#2342F5]" />
                <p className="mt-4 text-sm font-bold text-slate-600">Loading inbox messages…</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5DBEB] bg-white py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                  <Inbox size={32} />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#0E1633]">No messages found</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  {searchFeedback || feedbackTypeFilter !== "all"
                    ? "No submissions match your active filter or search query."
                    : "No feedback or applications have been submitted yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFeedbacks.map((item) => {
                  const isDevApp = item.type === "join_dev_team";
                  const isBug = item.type === "bug";
                  const isSuggestion = item.type === "suggestion";
                  const isWaitlist = item.type === "app_waitlist";

                  let badgeColor = "border-blue-200 bg-blue-50 text-blue-800";
                  let badgeText = "Feedback";
                  let icon = <MessageSquare size={13} />;

                  if (isDevApp) {
                    badgeColor = "border-purple-200 bg-purple-50 text-purple-800";
                    badgeText = "Join Dev Team";
                    icon = <Briefcase size={13} />;
                  } else if (isBug) {
                    badgeColor = "border-rose-200 bg-rose-50 text-rose-800";
                    badgeText = "Bug Report";
                    icon = <Bug size={13} />;
                  } else if (isSuggestion) {
                    badgeColor = "border-amber-200 bg-amber-50 text-amber-800";
                    badgeText = "Suggestion";
                    icon = <Sparkles size={13} />;
                  } else if (isWaitlist) {
                    badgeColor = "border-emerald-200 bg-emerald-50 text-emerald-800";
                    badgeText = "Mobile Waitlist";
                    icon = <Smartphone size={13} />;
                  }

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                        isDevApp ? "border-purple-200/90 ring-1 ring-purple-100" : "border-[#D5DBEB]"
                      }`}
                    >
                      <div>
                        {/* Header: Badge & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeColor}`}
                          >
                            {icon}
                            {badgeText}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {formatDate(item.created_at)}
                          </span>
                        </div>

                        {/* Author info */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2342F5] to-indigo-600 text-xs font-black text-white shadow-sm">
                            {initials(item.name || "User")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-[#0E1633]">
                              {item.name || "Anonymous Student"}
                            </p>
                            {item.email ? (
                              <p className="truncate text-xs text-slate-500 font-medium">{item.email}</p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No email provided</p>
                            )}
                          </div>
                        </div>

                        {/* Message content */}
                        <div className="mt-4 rounded-2xl border border-slate-100 bg-[#F8FAFF] p-3.5">
                          <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap break-words font-medium">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                        {item.email ? (
                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent(
                              isDevApp
                                ? "Build-Mate Dev Team Application — Next Steps"
                                : isWaitlist
                                ? "Build-Mate Mobile App — Early Access Update"
                                : "Response regarding your Build-Mate feedback"
                            )}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2342F5]/10 px-3 py-1.5 text-xs font-bold text-[#2342F5] transition hover:bg-[#2342F5] hover:text-white"
                          >
                            <Mail size={13} />
                            Reply to {item.name ? item.name.split(" ")[0] : "Student"}
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No contact email</span>
                        )}

                        {item.email && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.email);
                              showToast("Email copied to clipboard!", "success");
                            }}
                            title="Copy email"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Build-Mate · Administrative Control & Community Quality Console
        </p>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: CONFIRM APPROVE / REJECT IDEA */}
      {/* ========================================================= */}
      {confirmStatusAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0E1633]/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && actionLoading === null)
              setConfirmStatusAction(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirmStatusAction.action === "approve"
                  ? "bg-[#2342F5]/[0.08] text-[#2342F5]"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {confirmStatusAction.action === "approve" ? (
                <CheckCircle2 size={23} />
              ) : (
                <AlertCircle size={23} />
              )}
            </div>
            <h2 id="confirm-title" className="text-xl font-black tracking-tight">
              {confirmStatusAction.action === "approve"
                ? "Approve this idea?"
                : "Reject this idea?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmStatusAction.action === "approve"
                ? "This project will be marked approved and made publicly visible to all students."
                : "This project will be marked as rejected."}
            </p>
            <div className="mt-4 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] p-3.5">
              <p className="line-clamp-2 text-sm font-extrabold text-[#0E1633]">
                {confirmStatusAction.idea.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Submitted by {confirmStatusAction.idea.owner_name || "Unknown student"}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                disabled={actionLoading === confirmStatusAction.idea.id}
                onClick={() => setConfirmStatusAction(null)}
                className="flex-1 rounded-xl border border-[#D5DBEB] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === confirmStatusAction.idea.id}
                onClick={() =>
                  void handleStatusAction(
                    confirmStatusAction.idea.id,
                    confirmStatusAction.action
                  )
                }
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
                  confirmStatusAction.action === "approve"
                    ? "bg-[#2342F5] hover:bg-[#1936DF]"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionLoading === confirmStatusAction.idea.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : confirmStatusAction.action === "approve" ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                {actionLoading === confirmStatusAction.idea.id
                  ? "Processing…"
                  : confirmStatusAction.action === "approve"
                  ? "Yes, approve"
                  : "Yes, reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRM DELETE IDEA */}
      {/* ========================================================= */}
      {confirmDeleteIdea && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0E1633]/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && actionLoading === null)
              setConfirmDeleteIdea(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-idea-title"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={23} />
            </div>
            <h2 id="delete-idea-title" className="text-xl font-black tracking-tight text-rose-950">
              Delete Project Permanently?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to delete this project? This will remove the idea and all
              associated student join requests. This action{" "}
              <strong className="text-rose-600">cannot be undone</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
              <p className="line-clamp-2 text-sm font-extrabold text-[#0E1633]">
                {confirmDeleteIdea.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created by {confirmDeleteIdea.owner_name || "Unknown student"}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                disabled={actionLoading === confirmDeleteIdea.id}
                onClick={() => setConfirmDeleteIdea(null)}
                className="flex-1 rounded-xl border border-[#D5DBEB] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === confirmDeleteIdea.id}
                onClick={() => void handleDeleteIdea(confirmDeleteIdea.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {actionLoading === confirmDeleteIdea.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {actionLoading === confirmDeleteIdea.id ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CONFIRM BLOCK / UNBLOCK USER */}
      {/* ========================================================= */}
      {confirmToggleBlock && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0E1633]/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && userActionLoading === null)
              setConfirmToggleBlock(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-user-title"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirmToggleBlock.is_blocked
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {confirmToggleBlock.is_blocked ? (
                <ShieldCheck size={23} />
              ) : (
                <AlertTriangle size={23} />
              )}
            </div>
            <h2 id="block-user-title" className="text-xl font-black tracking-tight">
              {confirmToggleBlock.is_blocked ? "Unblock User Access?" : "Block this User?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmToggleBlock.is_blocked
                ? `Restore access for "${confirmToggleBlock.name}". They will be able to log in and participate in projects again.`
                : `Prevent "${confirmToggleBlock.name}" from logging in. Any future login attempts will be immediately denied.`}
            </p>
            <div className="mt-4 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] p-3.5">
              <p className="text-sm font-extrabold text-[#0E1633]">{confirmToggleBlock.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{confirmToggleBlock.email}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                disabled={userActionLoading === confirmToggleBlock.id}
                onClick={() => setConfirmToggleBlock(null)}
                className="flex-1 rounded-xl border border-[#D5DBEB] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={userActionLoading === confirmToggleBlock.id}
                onClick={() => void handleToggleBlockUser(confirmToggleBlock)}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
                  confirmToggleBlock.is_blocked
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {userActionLoading === confirmToggleBlock.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : confirmToggleBlock.is_blocked ? (
                  <ShieldCheck size={16} />
                ) : (
                  <Ban size={16} />
                )}
                {userActionLoading === confirmToggleBlock.id
                  ? "Updating…"
                  : confirmToggleBlock.is_blocked
                  ? "Yes, unblock"
                  : "Yes, block user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CONFIRM DELETE USER */}
      {/* ========================================================= */}
      {confirmDeleteUser && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0E1633]/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && userActionLoading === null)
              setConfirmDeleteUser(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={23} />
            </div>
            <h2 id="delete-user-title" className="text-xl font-black tracking-tight text-rose-950">
              Delete User Permanently?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to delete <strong className="text-[#0E1633]">{confirmDeleteUser.name}</strong>? This will permanently remove their account, project postings, and all join applications. This action{" "}
              <strong className="text-rose-600">cannot be undone</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
              <p className="text-sm font-extrabold text-[#0E1633]">{confirmDeleteUser.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{confirmDeleteUser.email}</p>
              {confirmDeleteUser.college && (
                <p className="mt-0.5 text-xs text-slate-400">{confirmDeleteUser.college}</p>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={userActionLoading === confirmDeleteUser.id}
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 rounded-xl border border-[#D5DBEB] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={userActionLoading === confirmDeleteUser.id}
                onClick={() => void handleDeleteUser(confirmDeleteUser)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {userActionLoading === confirmDeleteUser.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {userActionLoading === confirmDeleteUser.id ? "Deleting…" : "Yes, delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
