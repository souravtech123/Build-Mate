"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Sparkles,
  Users,
  User as UserIcon,
  Crown,
  Calendar,
  Layers,
  Target,
  DollarSign,
  Briefcase,
  GitBranch,
  Globe,
  Mail,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  Check,
  CheckCircle2,
  XCircle,
  Clock3,
  Award,
  Zap,
  Plus,
  Trash2,
  Play,
  CheckSquare,
  Tag,
  ChevronRight,
} from "lucide-react";
import {
  useCurrentUser,
  getStoredToken,
  ProjectIdea,
  JoinRequest,
  ProjectTask,
  RewardTicket,
  fetchProjectTasks,
  deleteProjectTask,
  updateTaskStatus,
} from "../../lib/auth";
import TeamChat from "../../Components/TeamChat";
import CreateTaskModal from "../../Components/CreateTaskModal";
import CompleteTaskModal from "../../Components/CompleteTaskModal";
import RewardTicketModal from "../../Components/RewardTicketModal";

import { API_BASE } from "@/api";

function formatDate(dateStr?: string) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? "Recently"
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function getInitials(name?: string) {
  if (!name) return "U";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

function splitTags(val?: string): string[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getDeadlineInfo(deadlineStr: string, status?: string, isCompletedOnTime?: boolean) {
  if (status === "completed") {
    if (isCompletedOnTime) {
      return {
        label: "Completed On-Time",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        isOverdue: false,
      };
    }
    return {
      label: "Completed (Late)",
      badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
      isOverdue: true,
    };
  }

  const diffMs = new Date(deadlineStr).getTime() - Date.now();
  if (diffMs <= 0) {
    return {
      label: "Deadline Overdue",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
      isOverdue: true,
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return {
      label: `${days}d ${remHours}h left`,
      badgeClass:
        days <= 1
          ? "bg-amber-50 text-amber-700 border-amber-200 font-semibold"
          : "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
      isOverdue: false,
    };
  }

  const mins = Math.floor(diffMs / (1000 * 60));
  return {
    label: `${hours}h ${mins % 60}m left`,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-bold animate-pulse",
    isOverdue: false,
  };
}

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = useCurrentUser();

  const projectId = Number(params?.id);

  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [members, setMembers] = useState<JoinRequest[]>([]);
  const [applicants, setApplicants] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: "overview", "chat", "applicants", "tasks"
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "applicants" | "tasks">("overview");

  // Project tasks and rewards state
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<ProjectTask | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<RewardTicket | null>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "my" | "completed" | "pending">("all");
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  // Join application form state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRole, setJoinRole] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Applicant review action loading
  const [reviewLoadingId, setReviewLoadingId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check user relation
  const isOwner = useMemo(() => {
    if (!user || !project) return false;
    return String(user.id) === String(project.owner_id);
  }, [user, project]);

  const isAcceptedMember = useMemo(() => {
    if (!user) return false;
    return members.some((m) => Number(m.user_id) === Number(user.id));
  }, [user, members]);

  const isTeamMate = isOwner || isAcceptedMember;

  const userMembershipRole = useMemo(() => {
    if (isOwner) return "Project Lead";
    const found = members.find((m) => Number(m.user_id) === Number(user?.id));
    return found?.role || "Team Member";
  }, [isOwner, members, user]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const onTime = tasks.filter((t) => t.is_completed_on_time).length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter((t) => {
      if (t.status === "completed") return false;
      return new Date(t.deadline).getTime() < Date.now();
    }).length;
    return { total, completed, onTime, inProgress, overdue };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "my") {
        return Number(t.assigned_to_user_id) === Number(user?.id);
      }
      if (taskFilter === "completed") {
        return t.status === "completed";
      }
      if (taskFilter === "pending") {
        return t.status !== "completed";
      }
      return true;
    });
  }, [tasks, taskFilter, user?.id]);

  // Fetch project details
  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const token = getStoredToken();
        const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load project details");
        }
        setProject(data.data);

        // Fetch team members
        const membersRes = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/members`);
        const membersData = await membersRes.json();
        if (membersRes.ok && membersData.success && Array.isArray(membersData.data)) {
          setMembers(membersData.data);
        }

        // Fetch applicants if owner
        if (token && data.data) {
          const reqRes = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const reqData = await reqRes.json();
          if (reqRes.ok && reqData.success && Array.isArray(reqData.data)) {
            setApplicants(reqData.data);
          }
        }

        // Fetch project tasks
        const tasksRes = await fetchProjectTasks(projectId);
        if (tasksRes.success && tasksRes.data) {
          setTasks(tasksRes.data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [projectId]);

  // Submit Join Request
  const handleApplyToJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !user) {
      router.push(`/login?redirect=/ideas/${projectId}`);
      return;
    }

    if (!joinRole.trim()) {
      setJoinFeedback({ type: "error", text: "Please enter your proposed role." });
      return;
    }

    setSubmittingJoin(true);
    setJoinFeedback(null);

    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/join`, {
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

      setJoinFeedback({
        type: "success",
        text: "Application sent successfully! The project lead will review your request.",
      });
      setTimeout(() => setShowJoinModal(false), 2000);
    } catch (err: unknown) {
      setJoinFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit application",
      });
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Review applicant status (Owner only)
  const handleReviewApplicant = async (requestId: number, newStatus: "accepted" | "rejected") => {
    const token = getStoredToken();
    if (!token) return;

    setReviewLoadingId(requestId);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/ideas/${projectId}/requests/${requestId}`,
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
      if (res.ok && data.success) {
        setApplicants((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
        );

        // Refresh members
        const membersRes = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/members`);
        const membersData = await membersRes.json();
        if (membersRes.ok && membersData.success && Array.isArray(membersData.data)) {
          setMembers(membersData.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setReviewLoadingId(null);
    }
  };

  // Start task handler
  const handleStartTask = async (taskId: number) => {
    const res = await updateTaskStatus(projectId, taskId, "in_progress");
    if (res.success && res.data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "in_progress" } : t))
      );
    }
  };

  // Delete task handler (Owner only)
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeletingTaskId(taskId);
    const res = await deleteProjectTask(projectId, taskId);
    setDeletingTaskId(null);
    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  // On task created callback
  const handleTaskCreated = (newTask: ProjectTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // On task completed callback
  const handleTaskCompleted = (updatedTask: ProjectTask, ticket?: RewardTicket) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask, ticket: ticket || t.ticket } : t))
    );
    if (ticket) {
      setSelectedTicket(ticket);
    }
  };

  const copyProjectLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 text-[#0E1633]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#2342F5]" />
          <p className="text-sm font-semibold text-[#5B6584]">
            Loading project information...
          </p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] p-6 text-[#0E1633]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 sm:p-12 text-center shadow-sm">
          <AlertCircle size={44} className="mx-auto text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-[#0E1633]">Project Not Found</h2>
          <p className="mt-2 text-sm text-[#5B6584]">
            {error || "The project you are looking for does not exist or may have been deleted."}
          </p>
          <div className="mt-6">
            <Link
              href="/ideas"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1b34c7]"
            >
              <ArrowLeft size={16} /> Back to Explore Projects
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const techList = splitTags(project.technologies);
  const pendingApplicantsCount = applicants.filter((a) => a.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#F4F6FB] text-[#0E1633]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#D5DBEB] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/ideas"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-1.5 text-xs font-bold text-[#0E1633] transition hover:border-[#2342F5] hover:bg-[#EEF1FF] hover:text-[#2342F5]"
            >
              <ArrowLeft size={14} /> Back to Projects
            </Link>
            <span className="hidden sm:inline text-xs text-[#8C96AD]">/</span>
            <span className="hidden sm:inline text-xs font-semibold text-[#5B6584] max-w-xs truncate">
              {project.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyProjectLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4A5473] transition hover:bg-[#F8FAFF]"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Quick Action Button */}
            {!isOwner && !isAcceptedMember && (
              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2342F5] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1b34c7]"
              >
                <Users size={14} />
                <span>Join Team</span>
              </button>
            )}

            {isTeamMate && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "chat" ? "overview" : "chat")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  activeTab === "chat"
                    ? "bg-[#0E1633] text-white"
                    : "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1b34c7]"
                }`}
              >
                <MessageSquare size={14} />
                <span>{activeTab === "chat" ? "View Details" : "Live Team Chat"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* HERO SECTION: Project Name & Developed By */}
        <section className="mb-8 rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Subtle gradient flair */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2342F5]/5 blur-3xl" />

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2342F5]">
              {project.category || "Technology Project"}
            </span>
            {project.difficulty && (
              <span className="rounded-full border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-1 text-xs font-semibold text-[#4A5473]">
                {project.difficulty} Level
              </span>
            )}
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Active Project
            </span>
            {isOwner && (
              <span className="rounded-full border border-[#2342F5]/30 bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2342F5]">
                Your Project (Owner)
              </span>
            )}
            {isAcceptedMember && !isOwner && (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                You are a Team Member
              </span>
            )}
          </div>

          {/* PROJECT NAME / TITLE */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0E1633] font-display">
            {project.title}
          </h1>

          {/* DEVELOPED BY - Dedicated Highlight Card */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2342F5] to-[#4361EE] text-white font-bold text-base shadow-md">
                {getInitials(project.owner_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7B85A0]">
                    Developed By
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                    <Crown size={11} className="text-amber-500" /> Project Lead
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0E1633]">
                  {project.owner_name || "Student Builder"}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#5B6584] mt-0.5">
                  {project.owner_college && (
                    <span className="flex items-center gap-1 font-medium">
                      <GraduationCap size={13} className="text-[#2342F5]" />
                      {project.owner_college}
                    </span>
                  )}
                  {project.owner_email && (
                    <span className="flex items-center gap-1 font-medium text-[#2342F5]">
                      <Mail size={12} />
                      {project.owner_email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#7B85A0]">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#2342F5]" />
                <span>Created {formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-[#2342F5]" />
                <span>{members.length + 1} Teammates</span>
              </div>
            </div>
          </div>
        </section>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="mb-6 flex overflow-x-auto scrollbar-none border-b border-[#D5DBEB] -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#2342F5] text-[#2342F5]"
                : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
            }`}
          >
            <Layers size={16} />
            <span className="hidden sm:inline">Project Details & Plans</span>
            <span className="sm:hidden">Details</span>
          </button>

          {isTeamMate && (
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "chat"
                  ? "border-[#2342F5] text-[#2342F5]"
                  : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
              }`}
            >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Team Mate Chat (Live)</span>
              <span className="sm:hidden">Chat</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab("applicants")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "applicants"
                  ? "border-[#2342F5] text-[#2342F5]"
                  : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
              }`}
            >
              <Users size={16} />
              <span className="hidden sm:inline">Review Join Requests</span>
              <span className="sm:hidden">Applicants</span>
              {pendingApplicantsCount > 0 && (
                <span className="rounded-full bg-[#2342F5] px-2 py-0.5 text-[10px] font-bold text-white">
                  {pendingApplicantsCount}
                </span>
              )}
            </button>
          )}

          {/* TAB 4: TASKS & REWARDS */}
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-[#2342F5] text-[#2342F5]"
                : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
            }`}
          >
            <Award size={16} />
            <span className="hidden sm:inline">Tasks & Rewards</span>
            <span className="sm:hidden">Tasks & XP</span>
            {tasks.length > 0 && (
              <span className="rounded-full bg-blue-100 text-[#2342F5] px-2 py-0.5 text-[10px] font-bold">
                {tasks.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & COMPLETE DETAILS */}
        {activeTab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Goal, Fund Plans, About, Requirements */}
            <div className="space-y-8 lg:col-span-2">
              {/* GOAL SECTION - Dedicated Complete Detail Feature */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2342F5] to-[#4361EE] text-white">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0E1633] font-display">
                      Project Goal & Vision
                    </h2>
                    <p className="text-xs text-[#5B6584]">
                      Core objectives, target outcomes, and milestones
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EEF1FF] bg-[#FAFBFD] p-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#34405F]">
                    {project.goal ||
                      `The primary goal of ${project.title} is to build an impactful, scalable solution solving real-world challenges in ${
                        project.category || "technology"
                      }. The team is focused on delivering a functional prototype, solid architecture, and collaborative deployment with teammates.`}
                  </p>
                </div>
              </section>

              {/* FUND PLANS SECTION - Dedicated Complete Detail Feature */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0E1633] font-display">
                        Fund Plans & Budget Strategy
                      </h2>
                      <p className="text-xs text-[#5B6584]">
                        Financial roadmap, grant plans, and resource allocation
                      </p>
                    </div>
                  </div>

                  {project.target_fund && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B85A0]">
                        Target Budget
                      </span>
                      <p className="text-base font-extrabold text-[#0E1633]">
                        {project.target_fund}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#204E38]">
                    {project.fund_plans ||
                      `Currently bootstrapped and campus-driven. The team plans to apply for student innovation grants, hackathon sponsorships, and incubator backing to cover cloud infrastructure, API compute, domain, and deployment fees.`}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3 pt-3 border-t border-emerald-200/50 text-xs">
                    <div className="rounded-xl bg-white p-3 border border-emerald-200/60 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Cloud & DB</span>
                      <p className="font-semibold text-[#0E1633] mt-0.5">Free / Tier Grants</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-emerald-200/60 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Funding Stage</span>
                      <p className="font-semibold text-[#0E1633] mt-0.5">Prototype & Incubator</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-emerald-200/60 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Resource Status</span>
                      <p className="font-semibold text-[#0E1633] mt-0.5">Seeking Collaborators</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ABOUT & DETAILED DESCRIPTION */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-[#0E1633] font-display mb-3">
                  About This Project
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#34405F]">
                    {project.description}
                  </p>
                </div>

                {/* External links */}
                {(project.github_url || project.live_demo_url) && (
                  <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-[#E8ECF5]">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2 text-xs font-bold text-[#0E1633] transition hover:border-[#2342F5]"
                      >
                        <GitBranch size={15} /> Source Code Repository
                      </a>
                    )}
                    {project.live_demo_url && (
                      <a
                        href={project.live_demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2 text-xs font-bold text-[#2342F5] transition hover:bg-[#EEF1FF]"
                      >
                        <Globe size={15} /> Live Project Demo
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* TEAM REQUIREMENTS & OPEN ROLES */}
              <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <Briefcase size={18} className="text-[#2342F5]" />
                  <h2 className="text-lg font-bold text-[#0E1633] font-display">
                    Team Requirements & Open Roles
                  </h2>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#34405F]">
                  {project.team_requirements ||
                    "Looking for driven students and builders with strong problem-solving skills to build and ship together."}
                </p>
              </section>
            </div>

            {/* Right Column: Tech Stack, Required Skills, Team Roster, Join Callout */}
            <div className="space-y-6">
              {/* TECHNOLOGIES PLANNED */}
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                  Technologies Planned
                </h3>
                {techList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {techList.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-1.5 text-xs font-semibold text-[#0E1633]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#929BB2]">Not specified</p>
                )}
              </div>

              {/* REQUIRED SKILLS */}
              {project.required_skills && (
                <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                    Skills Needed
                  </h3>
                  <p className="whitespace-pre-wrap text-xs leading-6 text-[#34405F]">
                    {project.required_skills}
                  </p>
                </div>
              )}

              {/* TEAM ROSTER */}
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-[#2342F5]" />
                    <h3 className="font-bold text-sm text-[#0E1633]">
                      Active Team ({members.length + 1})
                    </h3>
                  </div>
                  {isTeamMate && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("chat")}
                      className="text-xs font-bold text-[#2342F5] hover:underline"
                    >
                      Open Chat →
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Project Lead */}
                  <div className="flex items-center justify-between rounded-2xl border border-[#2342F5]/20 bg-[#EEF1FF]/40 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2342F5] text-white font-bold text-xs">
                        {getInitials(project.owner_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-[#0E1633]">
                            {project.owner_name || "Lead"}
                          </p>
                          <Crown size={12} className="text-amber-500" />
                        </div>
                        <p className="text-[10px] text-[#5B6584]">
                          {project.owner_college || "Project Creator"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded bg-[#2342F5] px-2 py-0.5 text-[10px] font-bold text-white">
                      Lead
                    </span>
                  </div>

                  {/* Accepted Members */}
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-2xl border border-[#D5DBEB] bg-white p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E1633] text-white font-bold text-xs">
                          {getInitials(m.user?.name)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#0E1633]">
                            {m.user?.name || "Teammate"}
                          </p>
                          <p className="text-[10px] text-[#5B6584]">
                            {m.user?.college || "Contributor"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-[#F4F6FB] border border-[#D5DBEB] px-2 py-0.5 text-[10px] font-semibold text-[#2342F5]">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* JOIN / COLLABORATION CALLOUT */}
              {!isOwner && !isAcceptedMember && (
                <div className="rounded-3xl border border-[#2342F5]/25 bg-gradient-to-br from-[#EEF1FF] to-[#FAFBFD] p-6 shadow-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2342F5] text-white mb-3 shadow-md shadow-[#2342F5]/20">
                    <Sparkles size={22} />
                  </div>
                  <h3 className="font-bold text-base text-[#0E1633]">
                    Want to build with this team?
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#5B6584]">
                    Submit your application to become an accepted teammate and unlock direct real-time WebSocket team chat and development workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(true)}
                    className="mt-4 w-full rounded-xl bg-[#2342F5] py-2.5 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1b34c7]"
                  >
                    Apply to Join Team
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE TEAM CHAT (WEBSOCKET API) */}
        {activeTab === "chat" && isTeamMate && user && (
          <div className="mx-auto max-w-4xl">
            <TeamChat
              projectId={project.id}
              projectTitle={project.title}
              currentUser={user}
              isOwner={isOwner}
              userRole={userMembershipRole}
            />
          </div>
        )}

        {/* TAB 3: APPLICANTS REVIEW (OWNER ONLY) */}
        {activeTab === "applicants" && isOwner && (
          <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0E1633] font-display">
                  Project Join Applications
                </h2>
                <p className="text-xs text-[#5B6584]">
                  Review student applications to join your development team
                </p>
              </div>
              <span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2342F5]">
                {applicants.length} Total Applications
              </span>
            </div>

            {applicants.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-[#0E1633]">No applications yet</p>
                <p className="text-xs text-[#7B85A0]">
                  When students apply to join your project, their requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-[#D5DBEB] bg-[#FAFBFD] p-5 transition hover:border-[#AEBBFF]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white font-bold text-xs">
                          {getInitials(req.user?.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#0E1633]">
                              {req.user?.name || "Student"}
                            </h4>
                            <span className="rounded bg-[#EEF1FF] px-2 py-0.5 text-[10px] font-bold text-[#2342F5]">
                              Role: {req.role}
                            </span>
                          </div>
                          <p className="text-xs text-[#5B6584]">
                            {req.user?.college || "College Builder"} • {req.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Status / Actions */}
                      <div className="flex items-center gap-2">
                        {req.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={reviewLoadingId === req.id}
                              onClick={() => handleReviewApplicant(req.id, "accepted")}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} /> Accept
                            </button>
                            <button
                              type="button"
                              disabled={reviewLoadingId === req.id}
                              onClick={() => handleReviewApplicant(req.id, "rejected")}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <XCircle size={13} /> Decline
                            </button>
                          </>
                        ) : (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              req.status === "accepted"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {req.status === "accepted" ? "Accepted Member" : "Declined"}
                          </span>
                        )}
                      </div>
                    </div>

                    {req.message && (
                      <div className="mt-3 rounded-xl border border-[#E8ECF5] bg-white p-3 text-xs leading-relaxed text-[#34405F]">
                        <span className="font-bold text-[#0E1633]">Pitch / Message: </span>
                        {req.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TASKS, DEADLINES & REWARD TICKETS */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Top Stat Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-4 shadow-xs">
                <div className="text-xs font-semibold text-[#7B85A0]">Total Tasks</div>
                <div className="mt-1 text-2xl font-bold text-[#0E1633]">{taskStats.total}</div>
                <div className="mt-1 text-[11px] text-[#5B6584]">Assigned to members</div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
                <div className="text-xs font-semibold text-emerald-800">Completed On-Time</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={22} />
                  <span>{taskStats.onTime}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-emerald-600">
                  {taskStats.onTime} Reward Tickets Issued
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
                <div className="text-xs font-semibold text-blue-800">In Progress</div>
                <div className="mt-1 text-2xl font-bold text-blue-700">{taskStats.inProgress}</div>
                <div className="mt-1 text-[11px] text-blue-600">Under development</div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
                <div className="text-xs font-semibold text-amber-800">Overdue Tasks</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">{taskStats.overdue}</div>
                <div className="mt-1 text-[11px] text-amber-600">Deadline elapsed</div>
              </div>
            </div>

            {/* Controls Bar: Filters & Assign Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D5DBEB] bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B85A0] mr-1">
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setTaskFilter("all")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    taskFilter === "all"
                      ? "bg-[#2342F5] text-white shadow-xs"
                      : "bg-[#F8FAFF] text-[#5B6584] hover:bg-gray-100"
                  }`}
                >
                  All ({tasks.length})
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => setTaskFilter("my")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      taskFilter === "my"
                        ? "bg-[#2342F5] text-white shadow-xs"
                        : "bg-[#F8FAFF] text-[#5B6584] hover:bg-gray-100"
                    }`}
                  >
                    My Tasks ({tasks.filter((t) => Number(t.assigned_to_user_id) === Number(user.id)).length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTaskFilter("pending")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    taskFilter === "pending"
                      ? "bg-[#2342F5] text-white shadow-xs"
                      : "bg-[#F8FAFF] text-[#5B6584] hover:bg-gray-100"
                  }`}
                >
                  Active ({tasks.filter((t) => t.status !== "completed").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter("completed")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    taskFilter === "completed"
                      ? "bg-[#2342F5] text-white shadow-xs"
                      : "bg-[#F8FAFF] text-[#5B6584] hover:bg-gray-100"
                  }`}
                >
                  Completed ({tasks.filter((t) => t.status === "completed").length})
                </button>
              </div>

              {/* Owner Action: Assign New Task */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2342F5] to-[#4361EE] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 transition"
                >
                  <Plus size={15} />
                  <span>Assign New Task</span>
                </button>
              )}
            </div>

            {/* Tasks Cards List */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#2342F5] mb-3">
                  <Award size={28} />
                </div>
                <h3 className="text-base font-bold text-[#0E1633]">
                  {taskFilter === "my"
                    ? "No tasks assigned to you yet"
                    : tasks.length === 0
                    ? "No tasks assigned in this project yet"
                    : "No tasks match the selected filter"}
                </h3>
                <p className="mt-1 text-xs text-[#5B6584] max-w-sm mx-auto">
                  {isOwner
                    ? "Assign deadlines and deliverables to your team members. Members who finish on time automatically earn official Reward Tickets!"
                    : "When the project owner assigns you tasks with deadlines, they will appear here with live countdowns."}
                </p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c35c4] transition"
                  >
                    <Plus size={14} /> Assign First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredTasks.map((t) => {
                  const deadlineInfo = getDeadlineInfo(t.deadline, t.status, t.is_completed_on_time);
                  const isAssignedToCurrentUser = Number(t.assigned_to_user_id) === Number(user?.id);
                  const canComplete = isAssignedToCurrentUser && t.status !== "completed";
                  const canStart = isAssignedToCurrentUser && t.status === "assigned";

                  return (
                    <div
                      key={t.id}
                      className={`relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                        t.status === "completed"
                          ? t.is_completed_on_time
                            ? "border-emerald-200"
                            : "border-gray-200"
                          : deadlineInfo.isOverdue
                          ? "border-rose-200"
                          : "border-[#D5DBEB]"
                      }`}
                    >
                      {/* Card Top: Priority & Status & Delete */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {/* Priority badge */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                t.priority === "urgent"
                                  ? "bg-rose-100 text-rose-700"
                                  : t.priority === "high"
                                  ? "bg-amber-100 text-amber-800"
                                  : t.priority === "low"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {t.priority}
                            </span>

                            {/* Status badge */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                t.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "in_progress"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {t.status === "in_progress" ? "In Progress" : t.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Countdown / Deadline info badge */}
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] ${deadlineInfo.badgeClass}`}
                            >
                              {deadlineInfo.label}
                            </span>

                            {/* Owner delete button */}
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                disabled={deletingTaskId === t.id}
                                className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete task"
                              >
                                {deletingTaskId === t.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base font-bold text-[#0E1633] leading-snug">{t.title}</h4>
                        {t.description && (
                          <p className="mt-1 text-xs text-[#5B6584] line-clamp-3 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        {/* Assignee Row */}
                        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2FA] pt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2342F5] to-[#4361EE] text-white text-[10px] font-bold">
                              {getInitials(t.assigned_to?.name)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0E1633]">
                                {t.assigned_to?.name || `Member #${t.assigned_to_user_id}`}
                                {isAssignedToCurrentUser && (
                                  <span className="ml-1 text-[10px] text-[#2342F5] font-semibold">
                                    (You)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#7B85A0]">
                                Due {new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>

                          {/* Reward XP preview */}
                          <div className="flex items-center gap-1 rounded-xl bg-yellow-50 border border-yellow-200/80 px-2.5 py-1 text-xs font-bold text-yellow-800">
                            <Sparkles size={12} className="text-yellow-600" />
                            <span>+{t.reward_points} XP</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom: Actions */}
                      <div className="mt-4 pt-3 border-t border-[#F0F2FA] flex flex-wrap items-center justify-between gap-2">
                        {/* If completed & has ticket */}
                        {t.ticket ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t.ticket!)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
                          >
                            <Award size={14} />
                            <span>View Reward Ticket</span>
                            <span className="text-[10px] font-mono opacity-80">#{t.ticket.ticket_number.slice(-4)}</span>
                          </button>
                        ) : t.status === "completed" ? (
                          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                            <Clock3 size={13} /> Completed (Late submission)
                          </span>
                        ) : (
                          <div className="text-[11px] text-[#7B85A0]">
                            Reward perk: <strong className="text-[#0E1633]">{t.reward_title}</strong>
                          </div>
                        )}

                        {/* Action buttons for assignee */}
                        <div className="flex items-center gap-2 ml-auto">
                          {canStart && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(t.id)}
                              className="flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                            >
                              <Play size={12} /> Start Task
                            </button>
                          )}

                          {canComplete && (
                            <button
                              type="button"
                              onClick={() => setCompletingTask(t)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                            >
                              <CheckCircle2 size={13} /> Complete & Claim
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* JOIN TEAM MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0E1633] font-display">
                  Apply to Join Team
                </h3>
                <p className="text-xs text-[#5B6584]">
                  Send an application to collaborate on {project.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="rounded-xl border border-[#D5DBEB] p-1.5 text-slate-400 hover:text-[#0E1633]"
              >
                ✕
              </button>
            </div>

            {joinFeedback && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                  joinFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {joinFeedback.type === "success" ? (
                  <CheckCircle size={15} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={15} className="text-rose-600" />
                )}
                <span>{joinFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleApplyToJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6584] mb-1.5">
                  Your Proposed Role *
                </label>
                <input
                  type="text"
                  required
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer, UI/UX Designer, ML Engineer"
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0E1633] focus:border-[#2342F5] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6584] mb-1.5">
                  Message / Why you want to join
                </label>
                <textarea
                  rows={4}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Tell the project lead about your skills, past projects, or what you'd like to build together..."
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0E1633] focus:border-[#2342F5] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="rounded-xl border border-[#D5DBEB] px-4 py-2 text-xs font-semibold text-[#5B6584] hover:bg-[#F8FAFF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2342F5] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1b34c7] disabled:opacity-50"
                >
                  {submittingJoin ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL (OWNER) */}
      {showCreateTaskModal && (
        <CreateTaskModal
          projectId={projectId}
          members={members}
          onClose={() => setShowCreateTaskModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* COMPLETE TASK MODAL (MEMBER) */}
      {completingTask && (
        <CompleteTaskModal
          projectId={projectId}
          task={completingTask}
          onClose={() => setCompletingTask(null)}
          onSuccess={handleTaskCompleted}
        />
      )}

      {/* REWARD TICKET MODAL */}
      {selectedTicket && (
        <RewardTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </main>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 text-[#0E1633]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#2342F5]" />
            <p className="text-sm font-semibold text-[#5B6584]">
              Loading project details...
            </p>
          </div>
        </main>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
