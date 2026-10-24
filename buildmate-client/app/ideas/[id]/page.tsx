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
} from "lucide-react";
import {
  useCurrentUser,
  getStoredToken,
  ProjectIdea,
  JoinRequest,
} from "../../lib/auth";
import TeamChat from "../../Components/TeamChat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

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

  // Tabs: "overview", "chat", "applicants"
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "applicants">("overview");

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
        <div className="mb-6 flex border-b border-[#D5DBEB]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition ${
              activeTab === "overview"
                ? "border-[#2342F5] text-[#2342F5]"
                : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
            }`}
          >
            <Layers size={16} />
            <span>Project Details & Plans</span>
          </button>

          {isTeamMate && (
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition ${
                activeTab === "chat"
                  ? "border-[#2342F5] text-[#2342F5]"
                  : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
              }`}
            >
              <MessageSquare size={16} />
              <span>Team Mate Chat (Live)</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab("applicants")}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition ${
                activeTab === "applicants"
                  ? "border-[#2342F5] text-[#2342F5]"
                  : "border-transparent text-[#5B6584] hover:text-[#0E1633]"
              }`}
            >
              <Users size={16} />
              <span>Review Join Requests</span>
              {pendingApplicantsCount > 0 && (
                <span className="rounded-full bg-[#2342F5] px-2 py-0.5 text-[10px] font-bold text-white">
                  {pendingApplicantsCount}
                </span>
              )}
            </button>
          )}
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
