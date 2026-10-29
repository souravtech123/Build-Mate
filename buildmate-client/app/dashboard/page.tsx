"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Sparkles,
  Layers3,
  User as UserIcon,
  Crown,
  CheckCircle,
  XCircle,
  Clock3,
  Users,
  Settings,
  ShieldCheck,
  Globe,
  Link2,
  KeyRound,
  Check,
  Plus,
  X,
  AlertCircle,
  Loader2,
  LogOut,
  FolderPlus,
  Send,
  Inbox,
  ArrowUpRight,
  MessageSquarePlus,
  Compass,
  Award,
  Zap,
  Ticket,
} from "lucide-react";
import {
  useCurrentUser,
  clearAuth,
  updateUserProfile,
  changeUserPassword,
  fetchUserDashboardSummary,
  DashboardSummary,
  getStoredToken,
  getCurrentUser,
  ProjectTask,
  RewardTicket,
  fetchUserTasks,
  fetchUserTickets,
} from "../lib/auth";
import { API_BASE } from "@/api";
import FeedbackModal from "../Components/FeedbackModal";
import RewardTicketModal from "../Components/RewardTicketModal";

const AVAILABLE_SKILLS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "UI/UX Design",
  "AI / ML",
  "Mobile Development",
  "Cloud & DevOps",
  "Data Science",
  "Cybersecurity",
  "Product Management",
];

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

function formatDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "profile" ? "profile" : "overview";

  const user = useCurrentUser();
  const [mounted, setMounted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "tasks">(
    searchParams.get("tab") === "tasks" ? "tasks" : initialTab
  );

  // Summary data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // User tasks and rewards state
  const [userTasks, setUserTasks] = useState<ProjectTask[]>([]);
  const [userTickets, setUserTickets] = useState<RewardTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<RewardTicket | null>(null);
  const [loadingTasksAndTickets, setLoadingTasksAndTickets] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mount effect and session restore
  useEffect(() => {
    setMounted(true);
    const token = getStoredToken();
    if (token && !user) {
      void getCurrentUser();
    }
  }, []);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    college: "",
    bio: "",
    github_url: "",
    linkedin_url: "",
  });
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        college: user.college || "",
        bio: user.bio || "",
        github_url: user.github_url || "",
        linkedin_url: user.linkedin_url || "",
      });
      setProfileSkills(user.skills || []);
    }
  }, [user?.id, user?.name, user?.college, user?.bio, user?.github_url, user?.linkedin_url]);

  // Load dashboard summary
  const loadSummary = async () => {
    setLoadingSummary(true);
    const result = await fetchUserDashboardSummary();
    if (result.success && result.data) {
      setSummary(result.data);
    }
    setLoadingSummary(false);
  };

  const loadTasksAndTickets = async () => {
    setLoadingTasksAndTickets(true);
    const [tasksRes, ticketsRes] = await Promise.all([
      fetchUserTasks(),
      fetchUserTickets(),
    ]);
    if (tasksRes.success && tasksRes.data) {
      setUserTasks(tasksRes.data);
    }
    if (ticketsRes.success && ticketsRes.data) {
      setUserTickets(ticketsRes.data);
    }
    setLoadingTasksAndTickets(false);
  };

  useEffect(() => {
    if (user?.id) {
      void loadSummary();
      void loadTasksAndTickets();
    }
  }, [user?.id]);

  // Handle applicant status update (accept / reject)
  const handleUpdateApplicantStatus = async (projectId: number, requestId: number, status: "accepted" | "rejected") => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update applicant");
      }

      showToast(`Applicant ${status === "accepted" ? "accepted to team!" : "rejected."}`);
      void loadSummary();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error updating applicant", "error");
    }
  };

  // Toggle skills in profile
  const toggleSkill = (skill: string) => {
    setProfileSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !profileSkills.includes(trimmed)) {
      setProfileSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setSavingProfile(true);
    const res = await updateUserProfile({
      name: profileForm.name.trim(),
      college: profileForm.college.trim(),
      skills: profileSkills,
      bio: profileForm.bio.trim(),
      github_url: profileForm.github_url.trim(),
      linkedin_url: profileForm.linkedin_url.trim(),
    });

    setSavingProfile(false);
    if (res.success) {
      showToast("Profile updated successfully!");
    } else {
      showToast(res.message || "Failed to update profile", "error");
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      showToast("Please enter your current password", "error");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    const res = await changeUserPassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
    setSavingPassword(false);

    if (res.success) {
      showToast("Password updated successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } else {
      showToast(res.message || "Failed to change password", "error");
    }
  };

  // Hydration guard: wait for client mount before checking auth
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 text-[#0E1633]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2342F5]" />
          <p className="text-xs font-semibold text-[#5B6584]">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // Unauthenticated guard
  if (!user) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6 text-[#0E1633]">
        <div className="max-w-md w-full rounded-3xl border border-[#D5DBEB] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#2342F5]">
            <Code2 size={28} />
          </div>
          <h2 className="text-2xl font-bold font-display">Authentication Required</h2>
          <p className="mt-2 text-sm text-[#5B6584]">
            Please sign in to access your personal Build-Mate dashboard and profile settings.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login?redirect=/dashboard"
              className="w-full rounded-xl bg-[#2342F5] py-3 text-sm font-semibold text-white hover:bg-[#1A33C9] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register?redirect=/dashboard"
              className="w-full rounded-xl border border-[#D5DBEB] py-3 text-sm font-semibold text-[#0E1633] hover:bg-[#EEF1FF] transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6FB] font-body text-[#0E1633]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600;700&display=swap'); .font-display{font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif}.font-body{font-family:'DM Sans',ui-sans-serif,system-ui,sans-serif}`}</style>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md ${
            toast.type === "success"
              ? "border-emerald-200 bg-white/95 text-emerald-800"
              : "border-rose-200 bg-white/95 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} className="text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="text-rose-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#D5DBEB] bg-[#F4F6FB]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20">
              <Code2 size={22} />
            </div>
            <div>
              <span className="block font-display text-lg font-bold leading-tight">
                Build-Mate
              </span>
              <span className="block text-xs text-[#5B6584]">
                Student Dashboard
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/ideas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#0E1633] hover:border-[#2342F5]/40 hover:bg-[#EEF1FF] transition"
            >
              <Compass size={14} className="text-[#2342F5]" />
              <span className="hidden sm:inline">Explore Projects</span>
              <span className="sm:hidden">Explore</span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/15 hover:bg-[#1A33C9] transition"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Post Project</span>
              <span className="sm:hidden">Post</span>
            </Link>

            <button
              onClick={() => {
                clearAuth();
                router.push("/");
              }}
              title="Log out"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        {/* User Profile Header Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D5DBEB] bg-white p-4 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#2342F5] text-xl font-bold font-display text-white shadow-lg shadow-[#2342F5]/25">
                {initials(user.name)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold font-display text-[#0E1633]">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={13} />
                    Verified Student
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5B6584]">
                  {user.email} {user.college ? `· ${user.college}` : ""}
                </p>
                {user.bio && (
                  <p className="mt-2 text-xs leading-5 text-[#4A5473] max-w-xl">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex w-full sm:w-auto items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-1.5 scrollbar-none">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "overview"
                    ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20"
                    : "text-slate-600 hover:text-[#0E1633]"
                }`}
              >
                <Layers3 size={15} />
                Projects & Applications
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20"
                    : "text-slate-600 hover:text-[#0E1633]"
                }`}
              >
                <Settings size={15} />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  activeTab === "tasks"
                    ? "bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20"
                    : "text-slate-600 hover:text-[#0E1633]"
                }`}
              >
                <Award size={15} />
                <span>Tasks & Rewards</span>
                {userTickets.length > 0 && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                    {userTickets.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & PROJECTS & APPLICATIONS */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                    My Posted Projects
                  </span>
                  <div className="rounded-xl bg-[#EEF1FF] p-2 text-[#2342F5]">
                    <Crown size={17} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold font-display text-[#0E1633]">
                  {loadingSummary ? "—" : summary?.stats.total_projects ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#5B6584]">Ideas you have shared</p>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                    Applications Sent
                  </span>
                  <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                    <Send size={17} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold font-display text-[#0E1633]">
                  {loadingSummary ? "—" : summary?.stats.total_applications ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#5B6584]">Requests sent to join other projects</p>
              </div>

              <div className="rounded-2xl border border-[#D5DBEB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                    Incoming Requests
                  </span>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                    <Inbox size={17} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold font-display text-[#0E1633]">
                  {loadingSummary ? "—" : summary?.stats.total_incoming ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#5B6584]">Students who applied to your projects</p>
              </div>
            </div>

            {/* Quick Explore Projects CTA Banner */}
            <div className="rounded-2xl border border-[#2342F5]/25 bg-gradient-to-r from-[#EEF1FF] via-[#F4F6FB] to-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25">
                  <Compass size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0E1633]">
                    Explore Student Projects & Ideas
                  </h3>
                  <p className="mt-0.5 text-xs text-[#5B6584]">
                    Browse live student projects, match with teams by skill, and apply to build together.
                  </p>
                </div>
              </div>
              <Link
                href="/ideas"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] transition shrink-0"
              >
                <span>Browse All Projects</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* MY POSTED PROJECTS */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-display text-[#0E1633]">
                    My Projects
                  </h2>
                  <p className="text-xs text-[#5B6584]">
                    Projects you created and are leading.
                  </p>
                </div>
                <Link
                  href="/ideas/create"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DBEB] px-3.5 py-2 text-xs font-bold text-[#2342F5] hover:bg-[#EEF1FF] transition"
                >
                  <FolderPlus size={14} />
                  Post New Idea
                </Link>
              </div>

              {loadingSummary ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#2342F5]" />
                </div>
              ) : !summary?.projects || summary.projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D5DBEB] bg-[#F8FAFF] p-8 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-[#2342F5] mb-2" />
                  <p className="text-sm font-bold text-[#0E1633]">No projects posted yet</p>
                  <p className="text-xs text-[#5B6584] mt-1 max-w-sm mx-auto">
                    Have an idea for a hackathon, startup, or side project? Share it to assemble your dream team.
                  </p>
                  <Link
                    href="/ideas/create"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1A33C9]"
                  >
                    Post an Idea
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] p-5 transition hover:border-[#2342F5]/40 hover:bg-white hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              p.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : p.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {p.status === "approved" ? "Live on Hub" : p.status}
                          </span>
                          <span className="text-[10px] text-[#7B85A0]">
                            {formatDate(p.created_at)}
                          </span>
                        </div>

                        <h3 className="font-bold text-[#0E1633] line-clamp-1">{p.title}</h3>
                        <p className="mt-1 text-xs text-[#5B6584] line-clamp-2 leading-5">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#E8ECF5] pt-3 text-xs">
                        <span className="text-slate-500 font-medium">{p.category || "General"}</span>
                        <Link
                          href={`/ideas/${p.id}`}
                          className="font-bold text-[#2342F5] hover:underline inline-flex items-center gap-1"
                        >
                          View workspace <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* INCOMING APPLICANT REQUESTS */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold font-display text-[#0E1633]">
                  Incoming Applications
                </h2>
                <p className="text-xs text-[#5B6584]">
                  Students who applied to join your project teams.
                </p>
              </div>

              {loadingSummary ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#2342F5]" />
                </div>
              ) : !summary?.incoming_requests || summary.incoming_requests.length === 0 ? (
                <p className="text-xs text-[#7B85A0] italic">No incoming applications yet.</p>
              ) : (
                <div className="divide-y divide-[#E8ECF5]">
                  {summary.incoming_requests.map((req) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0E1633]">{req.user?.name || "Student"}</span>
                          {req.user?.college && (
                            <span className="text-xs text-[#5B6584]">({req.user.college})</span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                              req.status === "accepted"
                                ? "bg-emerald-50 text-emerald-700"
                                : req.status === "rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#0E1633] mt-1">
                          Role: <span className="font-bold text-[#2342F5]">{req.role}</span> for project: <strong className="font-semibold text-slate-700">{req.project_title}</strong>
                        </p>
                        {req.message && (
                          <p className="text-xs text-[#5B6584] mt-1 italic">&ldquo;{req.message}&rdquo;</p>
                        )}
                      </div>

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateApplicantStatus(req.project_id, req.id, "accepted")}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateApplicantStatus(req.project_id, req.id, "rejected")}
                            className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* MY PROJECT APPLICATIONS (OUTGOING) */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold font-display text-[#0E1633]">
                  My Applications
                </h2>
                <p className="text-xs text-[#5B6584]">
                  Join requests you submitted to other student projects.
                </p>
              </div>

              {loadingSummary ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#2342F5]" />
                </div>
              ) : !summary?.applications || summary.applications.length === 0 ? (
                <p className="text-xs text-[#7B85A0] italic">You have not submitted any join applications yet.</p>
              ) : (
                <div className="divide-y divide-[#E8ECF5]">
                  {summary.applications.map((app) => (
                    <div key={app.id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        {app.project_id ? (
                          <Link
                            href={`/ideas/${app.project_id}`}
                            className="font-bold text-sm text-[#0E1633] hover:text-[#2342F5] transition flex items-center gap-1"
                          >
                            <span>{app.project_title || "Project Idea"}</span>
                            <ArrowUpRight size={13} className="text-[#2342F5]" />
                          </Link>
                        ) : (
                          <h4 className="font-bold text-sm text-[#0E1633]">
                            {app.project_title || "Project Idea"}
                          </h4>
                        )}
                        <p className="text-xs text-[#5B6584] mt-0.5">
                          Applied as: <strong className="text-[#2342F5]">{app.role}</strong> · {formatDate(app.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          app.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : app.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {app.status === "accepted" ? "Accepted!" : app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROFILE SETTINGS & SECURITY */}
        {/* ========================================================= */}
        {activeTab === "profile" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left: Profile Details */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold font-display text-[#0E1633]">
                  Profile Information
                </h2>
                <p className="text-xs text-[#5B6584]">
                  Update your display name, college, skills, and builder portfolio links.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    College / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. St. Xavier's College, Ranchi"
                    value={profileForm.college}
                    onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    Bio / About Me
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your interests, what you like to build, or your experience..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                {/* Skills Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    Skills & Areas of Interest ({profileSkills.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {AVAILABLE_SKILLS.map((skill) => {
                      const selected = profileSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? "border-[#2342F5] bg-[#EEF1FF] text-[#2342F5]"
                              : "border-[#D5DBEB] bg-white text-[#5B6584] hover:bg-[#F9FAFD]"
                          }`}
                        >
                          {selected && <Check size={12} />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom skill add */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add another skill..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                      className="rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-2 text-xs outline-none focus:border-[#2342F5] flex-1"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs font-bold text-[#0E1633] hover:bg-[#EEF1FF]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                      <Globe size={14} /> GitHub Profile
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={profileForm.github_url}
                      onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                      className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                      <Link2 size={14} /> LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={profileForm.linkedin_url}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                      className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8ECF5] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] transition disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      "Save Profile Changes"
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Right: Security & Password */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-sm h-fit">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={18} className="text-[#2342F5]" />
                  <h2 className="text-xl font-bold font-display text-[#0E1633]">
                    Change Password
                  </h2>
                </div>
                <p className="text-xs text-[#5B6584]">
                  Ensure your account is protected with a secure password.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-5 py-3 text-sm font-bold text-[#0E1633] hover:bg-[#EEF1FF] hover:border-[#2342F5]/40 transition disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TASKS & REWARD TICKETS */}
        {/* ========================================================= */}
        {activeTab === "tasks" && (
          <div className="space-y-8">
            {/* Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Total Reward Points
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400 text-yellow-950">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-amber-950">
                  {userTickets.reduce((acc, t) => acc + (t.reward_points || 0), 0)} XP
                </div>
                <div className="mt-1 text-xs text-amber-700">
                  Earned across all completed sprint tasks
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Reward Passes Issued
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <Award size={16} />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-emerald-950">
                  {userTickets.length}
                </div>
                <div className="mt-1 text-xs text-emerald-700">
                  Certified on-time delivery passes
                </div>
              </div>

              <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6584]">
                    Assigned Tasks
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2342F5] text-white">
                    <Layers3 size={16} />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-[#0E1633]">
                  {userTasks.length}
                </div>
                <div className="mt-1 text-xs text-[#5B6584]">
                  {userTasks.filter((t) => t.status !== "completed").length} active deadlines
                </div>
              </div>
            </div>

            {/* SECTION 1: REWARD TICKETS VAULT */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#F0F2FA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-white shadow-md">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display text-[#0E1633]">
                      Official Reward Tickets Vault
                    </h2>
                    <p className="text-xs text-[#5B6584]">
                      Every time you beat the clock, an authenticated digital pass is unlocked
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                  {userTickets.length} Passes Claimed
                </span>
              </div>

              {userTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D5DBEB] bg-[#F8FAFF] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700 mb-3">
                    <Ticket size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0E1633]">No reward tickets yet</h3>
                  <p className="mt-1 text-xs text-[#5B6584] max-w-sm mx-auto">
                    Collaborate on project teams and complete tasks before the deadline to automatically receive official BuildMate reward passes!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {userTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0E1633] text-white p-5 shadow-lg transition hover:scale-[1.02] hover:shadow-2xl flex flex-col justify-between"
                    >
                      {/* Ticket header line */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            ON-TIME VERIFIED
                          </span>
                          <span className="font-mono text-[11px] font-bold text-yellow-300">
                            +{ticket.reward_points} XP
                          </span>
                        </div>

                        <div className="text-xs font-mono text-gray-400 tracking-wider">
                          {ticket.ticket_number}
                        </div>
                        <h4 className="mt-1 text-base font-bold text-white group-hover:text-blue-300 transition">
                          {ticket.reward_title || "Completion Pass"}
                        </h4>

                        <div className="mt-3 rounded-xl bg-white/[0.04] p-2.5 space-y-1 text-xs border border-white/5">
                          <div className="text-gray-400 text-[10px] uppercase font-semibold">Deliverable</div>
                          <div className="font-semibold text-gray-200 line-clamp-1">{ticket.task_title}</div>
                          {ticket.project && (
                            <div className="text-[11px] text-[#4361EE] line-clamp-1">
                              Project: {ticket.project.title}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          {new Date(ticket.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="flex items-center gap-1 text-xs font-bold text-[#4361EE] hover:text-blue-300 transition"
                        >
                          <span>Inspect Voucher</span>
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 2: ASSIGNED TASKS ACROSS PROJECTS */}
            <section className="rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#F0F2FA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2342F5] to-[#4361EE] text-white shadow-md">
                    <Layers3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display text-[#0E1633]">
                      My Assigned Tasks & Deadlines
                    </h2>
                    <p className="text-xs text-[#5B6584]">
                      Track your upcoming sprint deliverables and beat the timer
                    </p>
                  </div>
                </div>
              </div>

              {userTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D5DBEB] bg-[#F8FAFF] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2342F5] mb-3">
                    <Layers3 size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[#0E1633]">No tasks currently assigned</h3>
                  <p className="mt-1 text-xs text-[#5B6584] max-w-sm mx-auto">
                    When project owners assign you deliverables, they will appear here with live deadlines and reward perks.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {userTasks.map((t) => {
                    const isCompleted = t.status === "completed";
                    const isOverdue = !isCompleted && new Date(t.deadline).getTime() < Date.now();
                    const diffMs = new Date(t.deadline).getTime() - Date.now();
                    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
                    const daysLeft = Math.floor(hoursLeft / 24);

                    return (
                      <div
                        key={t.id}
                        className={`rounded-3xl border bg-white p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                          isCompleted
                            ? "border-emerald-200"
                            : isOverdue
                            ? "border-rose-200"
                            : "border-[#D5DBEB]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "in_progress"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {t.status === "in_progress" ? "In Progress" : t.status}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                isCompleted
                                  ? t.is_completed_on_time
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                  : isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold"
                                  : daysLeft <= 1
                                  ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {isCompleted
                                ? t.is_completed_on_time
                                  ? "Completed On-Time"
                                  : "Completed Late"
                                : isOverdue
                                ? "Overdue"
                                : daysLeft > 0
                                ? `${daysLeft}d left`
                                : `${hoursLeft}h left`}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-[#0E1633]">{t.title}</h4>
                          {t.description && (
                            <p className="mt-1 text-xs text-[#5B6584] line-clamp-2">
                              {t.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between text-xs text-[#5B6584] pt-2 border-t border-[#F0F2FA]">
                            <span className="font-semibold text-[#0E1633]">
                              {t.project ? t.project.title : `Project #${t.project_id}`}
                            </span>
                            <span className="font-bold text-yellow-700 flex items-center gap-1">
                              <Sparkles size={12} className="text-yellow-500" />
                              +{t.reward_points} XP
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F0F2FA] flex items-center justify-between">
                          <span className="text-[11px] text-[#7B85A0]">
                            Due: {new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>

                          <Link
                            href={`/ideas/${t.project_id}?tab=tasks`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#2342F5] hover:underline"
                          >
                            <span>Open Project Workspace</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Feedback & Suggestions Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Reward Ticket Modal */}
      {selectedTicket && (
        <RewardTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <Loader2 size={24} className="animate-spin text-[#2342F5]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
