"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Code2,
  ChevronLeft,
  ChevronRight,
  X,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers3,
  Trash2,
  Edit3,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  User as UserIcon,
  Crown,
  Loader2,
  Lock,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  Mail,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useCurrentUser, getStoredToken, clearAuth } from "../lib/auth";
import FeedbackModal from "../Components/FeedbackModal";
import EditProjectModal from "../Components/EditProjectModal";

import { API_BASE as API_URL } from "@/api";

type ProjectIdea = {
  id: number;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  technologies?: string;
  required_skills?: string;
  team_requirements?: string;
  owner_id?: string;
  owner_name?: string;
  owner_college?: string;
  owner_email?: string;
  created_at?: string;
};

type JoinRequest = {
  id: number;
  project_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
    college?: string;
    skills?: string[];
  };
  role: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  created_at?: string;
};

type IdeaResponse = {
  success: boolean;
  data: {
    ideas: ProjectIdea[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  message?: string;
};

const categories = [
  "All Categories",
  "Web Development",
  "AI/ML",
  "IoT",
  "Mobile Development",
  "Cybersecurity",
  "Cloud & DevOps",
  "Data Science",
];

const difficulties = [
  "All Levels",
  "Beginner",
  "Intermediate",
  "Advanced",
];

function splitTags(value?: string) {
  return value
    ? value.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function difficultyClass(value?: string) {
  switch (value?.toLowerCase()) {
    case "beginner":
      return "border-emerald-400/30 bg-emerald-50 text-emerald-700 font-semibold";
    case "intermediate":
      return "border-amber-400/30 bg-amber-50 text-amber-700 font-semibold";
    case "advanced":
      return "border-rose-400/30 bg-rose-50 text-rose-700 font-semibold";
    default:
      return "border-[#D5DBEB] bg-[#F9FAFD] text-[#4A5473]";
  }
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

function IdeasContent() {
  const router = useRouter();
  const user = useCurrentUser();

  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [difficulty, setDifficulty] = useState("All Levels");
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "applicants">("details");
  const [members, setMembers] = useState<JoinRequest[]>([]);
  const [applicants, setApplicants] = useState<JoinRequest[]>([]);

  // Join application states
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRole, setJoinRole] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Delete project confirmation modal
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ProjectIdea | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleIdeaUpdated = (updated: any) => {
    setSelectedIdea((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
    setIdeas((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setFeedback({
      type: "success",
      text: "Project details updated successfully!",
    });
  };

  const fetchIdeas = useCallback(async () => {
    if (!user) return; // Don't fetch if not logged in
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "9",
      });

      if (search.trim()) params.set("search", search.trim());
      if (category !== "All Categories") {
        params.set("category", category);
      }
      if (difficulty !== "All Levels") {
        params.set("difficulty", difficulty);
      }
      if (onlyMyProjects && user) {
        params.set("owner_id", String(user.id));
      }

      const response = await fetch(
        `${API_URL}/api/v1/ideas?${params.toString()}`
      );

      const result = (await response.json()) as IdeaResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load ideas.");
      }

      setIdeas(result.data.ideas ?? []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.total_pages ?? 0);
    } catch (err) {
      setIdeas([]);
      setTotal(0);
      setTotalPages(0);
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [search, category, difficulty, page, onlyMyProjects, user?.id]);

  useEffect(() => {
    if (user?.id) {
      const timeout = setTimeout(() => void fetchIdeas(), 300);
      return () => clearTimeout(timeout);
    }
  }, [fetchIdeas, user?.id]);

  const fetchMembers = async (ideaId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/ideas/${ideaId}/members`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMembers(data.data);
      } else {
        setMembers([]);
      }
    } catch {
      setMembers([]);
    }
  };

  const fetchApplicants = async (ideaId: number) => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/ideas/${ideaId}/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplicants(data.data);
      } else {
        setApplicants([]);
      }
    } catch {
      setApplicants([]);
    }
  };

  async function openIdea(idea: ProjectIdea) {
    setSelectedIdea(idea);
    setActiveTab("details");
    setShowJoinForm(false);
    setJoinRole("");
    setJoinMessage("");
    setFeedback(null);
    setConfirmDelete(false);
    setDetailLoading(true);

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_URL}/api/v1/ideas/${idea.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedIdea(result.data);
      }
    } catch {
      // Keep initial data
    } finally {
      setDetailLoading(false);
    }

    void fetchMembers(idea.id);

    if (user && String(user.id) === String(idea.owner_id)) {
      void fetchApplicants(idea.id);
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    if (!selectedIdea || !user) return;

    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/ideas/${selectedIdea.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete project");
      }

      setIdeas((prev) => prev.filter((item) => item.id !== selectedIdea.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelectedIdea(null);
      setConfirmDelete(false);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete project.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit join application
  const handleApplyToJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea) return;

    const token = getStoredToken();
    if (!token || !user) {
      router.push("/login?redirect=/ideas");
      return;
    }

    if (!joinRole.trim()) {
      setFeedback({ type: "error", text: "Please enter your proposed role." });
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/ideas/${selectedIdea.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: joinRole.trim(),
          message: joinMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit application");
      }

      setFeedback({
        type: "success",
        text: "Application sent successfully! The project lead will review your request.",
      });
      setShowJoinForm(false);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit application.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Accept or Reject an applicant
  const handleUpdateApplicantStatus = async (requestId: number, newStatus: "accepted" | "rejected") => {
    if (!selectedIdea) return;
    const token = getStoredToken();
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/ideas/${selectedIdea.id}/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update applicant");
      }

      setApplicants((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );

      if (newStatus === "accepted") {
        void fetchMembers(selectedIdea.id);
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update applicant status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const activeFilters =
    Number(category !== "All Categories") +
    Number(difficulty !== "All Levels") +
    Number(onlyMyProjects);

  function resetFilters() {
    setSearch("");
    setCategory("All Categories");
    setDifficulty("All Levels");
    setOnlyMyProjects(false);
    setPage(1);
  }

  // -------------------------------------------------------------
  // AUTHENTICATION GUARD: Gated if user is not logged in
  // -------------------------------------------------------------
  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F4F6FB] font-body text-[#0E1633]">
        <header className="relative z-10 border-b border-[#D5DBEB] bg-[#F4F6FB]/90 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20">
                <Code2 size={22} />
              </div>
              <div>
                <span className="block font-display text-lg font-bold leading-tight">
                  Build-Mate
                </span>
                <span className="block text-xs text-[#5B6584]">
                  Team Build-Mate
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login?redirect=/ideas"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4A5473] hover:text-[#2342F5] transition"
              >
                Log In
              </Link>
              <Link
                href="/register?redirect=/ideas"
                className="rounded-xl bg-[#2342F5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] transition"
              >
                Create Account
              </Link>
            </div>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#2342F5]/20 bg-[#2342F5]/[0.08] text-[#2342F5] shadow-lg shadow-[#2342F5]/10">
            <Lock size={36} />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-4 py-1.5 text-xs font-bold text-[#2342F5]">
            <Sparkles size={14} /> EXCLUSIVE STUDENT BUILDER HUB
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-[#0E1633]">
            Account Required to Explore Projects
          </h1>

          <p className="mt-4 max-w-lg text-base leading-7 text-[#5B6584] sm:text-lg">
            Build-Mate connects student builders and enables real collaboration. Please create an account or sign in to browse active projects, discover teammates, and apply to join teams.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
            <Link
              href="/register?redirect=/ideas"
              className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2342F5]/20 transition hover:bg-[#1A33C9]"
            >
              Create an Account
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/login?redirect=/ideas"
              className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-6 py-3.5 text-sm font-semibold text-[#0E1633] transition hover:border-[#2342F5]/40 hover:bg-[#EEF1FF]"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
            <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
              <Sparkles size={20} className="text-[#2342F5] mb-2" />
              <h4 className="font-bold text-sm text-[#0E1633]">Browse Projects</h4>
              <p className="mt-1 text-xs text-[#5B6584]">Explore student ideas and hackathon projects looking for builders.</p>
            </div>
            <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
              <Users size={20} className="text-[#2342F5] mb-2" />
              <h4 className="font-bold text-sm text-[#0E1633]">Match by Skill</h4>
              <p className="mt-1 text-xs text-[#5B6584]">Connect with developers, designers, and AI specialists.</p>
            </div>
            <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
              <CheckCircle size={20} className="text-[#2342F5] mb-2" />
              <h4 className="font-bold text-sm text-[#0E1633]">Apply to Teams</h4>
              <p className="mt-1 text-xs text-[#5B6584]">Submit your proposed role and build portfolio-ready products.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isOwner =
    user && selectedIdea && String(user.id) === String(selectedIdea.owner_id);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F6FB] font-body text-[#0E1633]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600;700&display=swap'); .font-display{font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif}.font-body{font-family:'DM Sans',ui-sans-serif,system-ui,sans-serif}`}</style>

      {/* Main Container */}
      <div
        className="relative mx-auto max-w-7xl px-5 pb-20 pt-6 sm:px-8 lg:px-10"
        style={{
          backgroundImage:
            "linear-gradient(#E3E8F4 1px, transparent 1px), linear-gradient(90deg, #E3E8F4 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Navbar */}
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-[#D5DBEB] pb-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20">
              <Code2 size={22} />
            </div>
            <div>
              <p className="text-lg font-bold font-display">
                Build-Mate<span className="text-[#2342F5]">.</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#7B85A0]">
                Team Build-Mate
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#0E1633] transition hover:border-[#2342F5]/40 hover:bg-[#EEF1FF]"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>

            <button
              onClick={() => setShowFeedback(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs font-semibold text-[#5B6584] hover:text-[#2342F5] hover:border-[#2342F5]/40 hover:bg-[#EEF1FF] transition"
            >
              <MessageSquarePlus size={14} className="text-[#2342F5]" />
              <span className="hidden md:inline">Feedback</span>
            </button>

            <Link
              href="/ideas/create"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#2342F5] px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/15 transition hover:bg-[#1A33C9]"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Post a Project</span>
              <span className="sm:hidden">Post</span>
            </Link>

            <button
              onClick={() => {
                clearAuth();
                router.push("/");
              }}
              title="Log out"
              className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-[#EEF1FF] px-3.5 py-1.5 text-xs font-bold text-[#2342F5]">
            <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
            STUDENT COLLABORATION HUB
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl text-[#0E1633]">
            Explore projects.
            <br />
            <span className="text-[#2342F5]">
              Join teams. Build together.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-[#5B6584]">
            Browse project concepts submitted by fellow students, apply to join open roles, or assemble a team for your own ideas.
          </p>
        </section>

        {/* Search & Filters */}
        <section className="mb-8 rounded-2xl border border-[#D5DBEB] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B85A0]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search projects, technologies, skills, creators..."
                aria-label="Search project ideas"
                className="h-12 w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] pl-12 pr-4 text-sm text-[#0E1633] outline-none placeholder:text-[#8995AE] focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyMyProjects((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                onlyMyProjects
                  ? "border-[#2342F5] bg-[#EEF1FF] text-[#2342F5]"
                  : "border-[#D5DBEB] text-[#4A5473] hover:bg-[#EEF1FF]"
              }`}
            >
              <Crown className="h-4 w-4 text-[#2342F5]" />
              My Projects
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D5DBEB] px-5 text-sm font-semibold text-[#4A5473] hover:bg-[#EEF1FF]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="rounded-full bg-[#2342F5] px-2 py-0.5 text-xs text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-[#D5DBEB] pt-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#7B85A0]">
                CATEGORY
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-3 text-sm text-[#0E1633] outline-none"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-[#7B85A0]">
                DIFFICULTY
                <select
                  value={difficulty}
                  onChange={(event) => {
                    setDifficulty(event.target.value);
                    setPage(1);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-3 text-sm text-[#0E1633] outline-none"
                >
                  {difficulties.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={resetFilters}
                className="text-left text-xs font-bold text-[#2342F5] hover:underline sm:col-span-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Results heading */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0E1633]">
              {onlyMyProjects ? "My Projects" : "Active Student Projects"}
            </h2>
            <p className="mt-1 text-xs text-[#7B85A0]">
              {loading
                ? "Searching projects..."
                : `${total} ${total === 1 ? "project" : "projects"} available`}
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-[#7B85A0] sm:flex">
            <Layers3 className="h-4 w-4" />
            Showing latest submissions
          </div>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-rose-800">
                  Unable to load projects
                </h3>
                <p className="mt-1 text-sm text-[#5B6584]">
                  {error}
                </p>
                <button
                  onClick={() => void fetchIdeas()}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2 text-xs font-bold text-[#0E1633] hover:bg-[#F9FAFD]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-[#D5DBEB] bg-white p-6"
              >
                <div className="mb-4 h-10 w-10 rounded-xl bg-slate-100" />
                <div className="mb-3 h-5 w-3/4 rounded bg-slate-100" />
                <div className="mb-2 h-3 rounded bg-slate-100" />
                <div className="mb-6 h-3 w-2/3 rounded bg-slate-100" />
                <div className="h-9 rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Project cards */}
        {!loading && !error && ideas.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => {
              const tags = splitTags(idea.technologies);
              const userIsOwner = String(user.id) === String(idea.owner_id);

              return (
                <article
                  key={idea.id}
                  className="group flex flex-col rounded-2xl border border-[#D5DBEB] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#AEBBFF] hover:shadow-xl hover:shadow-[#2342F5]/[0.06]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5]">
                      <Code2 className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      {userIsOwner && (
                        <span className="rounded-full border border-[#2342F5]/30 bg-[#EEF1FF] px-2.5 py-0.5 text-[10px] font-bold text-[#2342F5]">
                          Your Project
                        </span>
                      )}
                      {idea.difficulty && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] ${difficultyClass(idea.difficulty)}`}
                        >
                          {idea.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator and Category */}
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#5B6584]">
                    <span className="flex items-center gap-1 font-medium">
                      <UserIcon size={12} className="text-[#2342F5]" />
                      {idea.owner_name || "Student Builder"}
                      {idea.owner_college && ` · ${idea.owner_college}`}
                    </span>
                    {idea.category && (
                      <span className="rounded-md bg-[#F4F6FB] px-2 py-0.5 font-semibold text-[#2342F5]">
                        {idea.category}
                      </span>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-[#0E1633] transition group-hover:text-[#2342F5]">
                    {idea.title}
                  </h3>

                  <p className="mt-2.5 line-clamp-3 min-h-[4.2rem] text-sm leading-6 text-[#5B6584]">
                    {idea.description}
                  </p>

                  <div className="mt-4">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7B85A0]">
                      Technologies
                    </p>
                    <div className="flex min-h-6 flex-wrap gap-1.5">
                      {tags.length ? (
                        tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-[#D5DBEB] bg-[#F8FAFF] px-2.5 py-1 text-xs font-medium text-[#4A5473]"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#929BB2]">Not specified</span>
                      )}
                      {tags.length > 4 && (
                        <span className="px-1 py-1 text-xs text-[#7B85A0]">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="flex flex-1 items-center justify-between rounded-xl bg-[#2342F5] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1b34c7]"
                    >
                      <span>Open Complete Details</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => void openIdea(idea)}
                      title="Quick Preview Modal"
                      className="rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] p-2.5 text-xs font-bold text-[#0E1633] transition hover:border-[#2342F5]/50 hover:bg-[#EEF1FF]"
                    >
                      <Eye className="h-4 w-4 text-[#5B6584]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && ideas.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#D5DBEB] bg-white p-12 text-center">
            <Lightbulb className="mx-auto mb-4 h-10 w-10 text-[#2342F5]" />
            <h3 className="text-lg font-bold text-[#0E1633]">
              {onlyMyProjects ? "You haven't posted any projects yet" : "No matching projects found"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5B6584]">
              {onlyMyProjects
                ? "Post your idea to find teammates and start building together."
                : "Try searching with different keywords or clear your filters."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {onlyMyProjects ? (
                <Link
                  href="/ideas/create"
                  className="rounded-xl bg-[#2342F5] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9]"
                >
                  Post your first project
                </Link>
              ) : (
                <button
                  onClick={resetFilters}
                  className="rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-5 py-2.5 text-sm font-bold text-[#0E1633] hover:bg-[#EEF1FF]"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-3"
          >
            <button
              disabled={page <= 1}
              onClick={() => {
                setPage((c) => Math.max(1, c - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0E1633] hover:bg-[#F9FAFD] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-sm font-bold text-[#2342F5]">
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => {
                setPage((c) => Math.min(totalPages, c + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0E1633] hover:bg-[#F9FAFD] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>

      {/* ========================================================= */}
      {/* PROJECT WORKSPACE & COLLABORATION MODAL (FULLY DEBUGGED) */}
      {/* ========================================================= */}
      {selectedIdea && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0E1633]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setSelectedIdea(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="idea-dialog-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#D5DBEB] bg-white text-[#0E1633] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#D5DBEB] bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#2342F5]">
                  Project Workspace
                </span>
                {isOwner && (
                  <span className="rounded-full bg-[#EEF1FF] px-2.5 py-0.5 text-xs font-bold text-[#2342F5]">
                    Lead / Owner
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/ideas/${selectedIdea.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#2342F5] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1b34c7]"
                >
                  <ExternalLink size={13} />
                  <span>Full Page</span>
                </Link>

                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingIdea(selectedIdea)}
                      disabled={actionLoading}
                      title="Edit project"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2342F5]/30 bg-[#EEF1FF] px-3 py-1.5 text-xs font-bold text-[#2342F5] transition hover:bg-[#2342F5] hover:text-white"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={actionLoading}
                      title="Delete project"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedIdea(null)}
                  aria-label="Close dialog"
                  className="rounded-xl border border-[#D5DBEB] p-2 text-slate-500 hover:bg-[#F9FAFD] hover:text-[#0E1633] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Owner Navigation Tabs */}
            {isOwner && (
              <div className="flex border-b border-[#D5DBEB] bg-[#F8FAFF] px-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`border-b-2 py-3 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === "details"
                      ? "border-[#2342F5] text-[#2342F5]"
                      : "border-transparent text-slate-500 hover:text-[#0E1633]"
                  }`}
                >
                  Project Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("applicants")}
                  className={`ml-6 flex items-center gap-2 border-b-2 py-3 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === "applicants"
                      ? "border-[#2342F5] text-[#2342F5]"
                      : "border-transparent text-slate-500 hover:text-[#0E1633]"
                  }`}
                >
                  Join Requests
                  {applicants.filter((a) => a.status === "pending").length > 0 && (
                    <span className="rounded-full bg-[#2342F5] px-2 py-0.5 text-[10px] font-bold text-white">
                      {applicants.filter((a) => a.status === "pending").length}
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {/* DELETE CONFIRMATION PROMPT IN MODAL */}
              {confirmDelete && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <div className="flex items-start gap-3">
                    <Trash2 size={20} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-rose-950">
                        Delete this project permanently?
                      </h4>
                      <p className="mt-1 text-xs text-rose-700">
                        This will remove the project posting and all applicant join requests. This cannot be undone.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-lg border border-[#D5DBEB] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleDeleteProject}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {actionLoading ? "Deleting..." : "Yes, delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailLoading ? (
                <div className="space-y-4 py-8">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                </div>
              ) : activeTab === "applicants" && isOwner ? (
                /* APPLICANTS TAB (DEBUGGED CONTRAST) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#0E1633]">
                        Applicant Join Requests ({applicants.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Review student applications to join your project.
                      </p>
                    </div>
                  </div>

                  {applicants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#D5DBEB] p-8 text-center bg-[#F8FAFF]">
                      <Users className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm font-semibold text-[#0E1633]">
                        No one has applied to join this project yet.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Share your project with students and friends!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applicants.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-2xl border border-[#D5DBEB] bg-white p-4 sm:p-5 shadow-sm"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#0E1633]">
                                  {req.user?.name || "Student"}
                                </span>
                                {req.user?.college && (
                                  <span className="rounded-md bg-[#EEF1FF] px-2 py-0.5 text-[11px] font-medium text-[#2342F5]">
                                    {req.user.college}
                                  </span>
                                )}
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                    req.status === "accepted"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : req.status === "rejected"
                                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-600">
                                Applied for role:{" "}
                                <strong className="font-semibold text-[#0E1633]">
                                  {req.role}
                                </strong>
                              </p>

                              {req.message && (
                                <p className="mt-2 text-xs leading-5 text-slate-600 italic">
                                  &ldquo;{req.message}&rdquo;
                                </p>
                              )}

                              {req.user?.skills && req.user.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {req.user.skills.map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-lg bg-[#F8FAFF] border border-[#D5DBEB] px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {req.status === "pending" && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateApplicantStatus(req.id, "accepted")
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  <CheckCircle size={14} />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateApplicantStatus(req.id, "rejected")
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* PROJECT DETAILS & JOIN TAB (DEBUGGED CONTRAST) */
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {selectedIdea.category && (
                      <span className="rounded-full border border-[#D5DBEB] bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2342F5]">
                        {selectedIdea.category}
                      </span>
                    )}
                    {selectedIdea.difficulty && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${difficultyClass(selectedIdea.difficulty)}`}
                      >
                        {selectedIdea.difficulty}
                      </span>
                    )}
                  </div>

                  <h2
                    id="idea-dialog-title"
                    className="text-2xl font-bold leading-tight sm:text-3xl text-[#0E1633]"
                  >
                    {selectedIdea.title}
                  </h2>

                  {/* Owner Banner */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5B6584]">
                    <span className="flex items-center gap-1">
                      <UserIcon size={14} className="text-[#2342F5]" />
                      Project Lead:{" "}
                      <strong className="font-bold text-[#0E1633]">
                        {selectedIdea.owner_name || "Student Builder"}
                      </strong>
                      {selectedIdea.owner_college &&
                        ` (${selectedIdea.owner_college})`}
                    </span>
                    {selectedIdea.owner_email && (
                      <span className="flex items-center gap-1 rounded-md bg-[#EEF1FF] px-2 py-0.5 text-[#2342F5] font-medium">
                        <Mail size={12} />
                        {selectedIdea.owner_email}
                      </span>
                    )}
                    <span>· {formatDate(selectedIdea.created_at)}</span>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                      About this project
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#34405F]">
                      {selectedIdea.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                      Technologies Planned
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {splitTags(selectedIdea.technologies).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-1.5 text-xs font-medium text-[#0E1633]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedIdea.required_skills && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                        Skills Required
                      </h3>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[#34405F]">
                        {selectedIdea.required_skills}
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                      Team requirements & open roles
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#34405F]">
                      {selectedIdea.team_requirements || "Open to student contributors who want to build."}
                    </p>
                  </div>

                  {/* CURRENT TEAM SECTION (DEBUGGED CONTRAST) */}
                  <div className="mt-7 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#2342F5]" />
                        <h3 className="text-sm font-bold text-[#0E1633]">
                          Current Team ({members.length + 1})
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Project Lead */}
                      <div className="flex items-center gap-2 rounded-xl border border-[#2342F5]/25 bg-white px-3 py-2 text-xs shadow-sm">
                        <Crown size={13} className="text-amber-500" />
                        <span className="font-bold text-[#0E1633]">
                          {selectedIdea.owner_name || "Project Lead"}
                        </span>
                        <span className="text-[10px] font-semibold text-[#2342F5]">(Owner)</span>
                      </div>

                      {/* Accepted Team Members */}
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs shadow-sm"
                        >
                          <UserIcon size={13} className="text-slate-500" />
                          <span className="font-bold text-[#0E1633]">
                            {m.user?.name || "Member"}
                          </span>
                          <span className="rounded bg-[#EEF1FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#2342F5]">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FEEDBACK BANNER */}
                  {feedback && (
                    <div
                      className={`mt-6 flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${
                        feedback.type === "success"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle size={18} className="shrink-0 text-rose-600" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  {/* JOIN APPLICATION / COLLABORATION */}
                  {!isOwner && (
                    <div className="mt-8 border-t border-[#D5DBEB] pt-6">
                      {!showJoinForm ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-sm text-[#0E1633]">
                              Want to build this project?
                            </h4>
                            <p className="text-xs text-slate-500">
                              Send a join request with your role or chat directly with the project owner.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`mailto:${selectedIdea.owner_email || ""}?subject=${encodeURIComponent(
                                `Collaboration on ${selectedIdea.title} (BuildMate)`
                              )}&body=${encodeURIComponent(
                                `Hi ${selectedIdea.owner_name || "Project Lead"},\n\nI found your project "${selectedIdea.title}" on BuildMate and would love to chat and collaborate!\n\nBest,\n${user?.name || ""}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0E1633] shadow-sm hover:border-[#2342F5]/40 hover:bg-[#EEF1FF] transition"
                            >
                              <MessageCircle size={15} className="text-[#2342F5]" />
                              Chat with Owner
                            </a>
                            <button
                              type="button"
                              onClick={() => setShowJoinForm(true)}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9]"
                            >
                              <UserPlus size={15} />
                              Apply to Join
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleApplyToJoin}
                          className="rounded-2xl border border-[#2342F5]/30 bg-[#2342F5]/[0.03] p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-[#0E1633]">
                              Apply to Join this Project
                            </h4>
                            <button
                              type="button"
                              onClick={() => setShowJoinForm(false)}
                              className="text-xs text-slate-500 hover:text-[#0E1633]"
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-[#0E1633]">
                              Role you want to take <span className="text-[#2342F5]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Frontend Developer, UI Designer, Backend Dev"
                              value={joinRole}
                              onChange={(e) => setJoinRole(e.target.value)}
                              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-[#0E1633]">
                              Short pitch / Note to project lead
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Briefly introduce your skills and what you can contribute..."
                              value={joinMessage}
                              onChange={(e) => setJoinMessage(e.target.value)}
                              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowJoinForm(false)}
                              className="rounded-xl border border-[#D5DBEB] bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2342F5] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2342F5]/15 transition hover:bg-[#1A33C9] disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Send Join Request"
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Feedback & Suggestions Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* EDIT PROJECT MODAL (OWNER) */}
      {editingIdea && (
        <EditProjectModal
          isOpen={Boolean(editingIdea)}
          project={editingIdea}
          onClose={() => setEditingIdea(null)}
          onProjectUpdated={handleIdeaUpdated}
        />
      )}
    </main>
  );
}

export default function IdeasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <Loader2 size={24} className="animate-spin text-[#2342F5]" />
      </div>
    }>
      <IdeasContent />
    </Suspense>
  );
}
