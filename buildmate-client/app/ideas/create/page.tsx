"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { useCurrentUser, getStoredToken } from "../../lib/auth";

const categories = [
  "Web Development",
  "AI/ML",
  "IoT",
  "Mobile Development",
  "Cybersecurity",
  "Cloud & DevOps",
  "Data Science",
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];

const commonSkills = [
  "Frontend",
  "Backend",
  "UI/UX Design",
  "AI / ML",
  "Mobile Dev",
  "DevOps",
  "Embedded IoT",
  "Database",
  "Product Management",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function CreateIdeaPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    difficulty: "Intermediate",
    technologies: "",
    team_requirements: "",
    goal: "",
    fund_plans: "",
    target_fund: "",
    github_url: "",
    live_demo_url: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const token = getStoredToken();
    if (!token || !user) {
      setErrorMsg("Please log in first to create a project.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMsg("Please provide both a title and description.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        technologies: form.technologies.trim(),
        required_skills: selectedSkills.join(", "),
        team_requirements: form.team_requirements.trim(),
        goal: form.goal.trim(),
        fund_plans: form.fund_plans.trim(),
        target_fund: form.target_fund.trim(),
        github_url: form.github_url.trim(),
        live_demo_url: form.live_demo_url.trim(),
      };

      const res = await fetch(`${API_URL}/api/v1/ideas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create project");
      }

      // Successfully created! Navigate to ideas list
      router.push("/ideas");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to publish project."
      );
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, prompt them to sign in
  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F4F6FB] text-[#0E1633]">
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/ideas" className="flex items-center gap-3">
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
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 text-sm text-[#596580] transition hover:text-[#2342F5]"
          >
            <ArrowLeft size={16} />
            Back to Ideas
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-md items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-[#D5DBEB] bg-white p-8 text-center shadow-xl shadow-[#0E1633]/[0.06]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2342F5]/20 bg-[#2342F5]/[0.07] text-[#2342F5]">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl font-bold">Publish your project idea</h2>
            <p className="mt-2 text-sm text-[#596580]">
              You need to be signed in to post a project and build your team.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl bg-[#2342F5] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B35D5]"
              >
                Log in to continue
              </Link>
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-xl border border-[#D5DBEB] py-3 text-sm font-medium text-[#34405F] hover:bg-[#2342F5]/[0.05]"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4F6FB] text-[#0E1633]">
      {/* Subtle blueprint grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(35,66,245,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(35,66,245,0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed -right-32 -top-40 h-96 w-96 rounded-full bg-[#2342F5]/[0.06] blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/ideas" className="flex items-center gap-3">
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

        <Link
          href="/ideas"
          className="inline-flex items-center gap-2 text-sm text-[#596580] transition hover:text-[#2342F5]"
        >
          <ArrowLeft size={16} />
          Back to ideas
        </Link>
      </header>

      {/* Form Container */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2342F5]/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2342F5]">
            <Sparkles size={14} />
            Post Your Project
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find teammates for your idea
          </h1>
          <p className="mt-2 text-sm text-[#596580]">
            Share what you want to build and invite students with matching skills to join you.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-sm shadow-[#0E1633]/[0.03] sm:p-8 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-[#0E1633]"
              >
                Project Title <span className="text-[#2342F5]">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                minLength={3}
                placeholder="e.g. AI Campus Study Buddy or Real-Time Collab Canvas"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3.5 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-[#0E1633]"
              >
                Project Overview & Vision <span className="text-[#2342F5]">*</span>
              </label>
              <textarea
                id="description"
                required
                rows={4}
                minLength={10}
                placeholder="Describe what the project does, the problem it solves, and why it's exciting..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
              />
            </div>

            {/* Category and Difficulty */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3.5 text-sm text-[#34405F] outline-none focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  value={form.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3.5 text-sm text-[#34405F] outline-none focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                >
                  {difficulties.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label
                htmlFor="technologies"
                className="mb-2 block text-sm font-medium text-[#0E1633]"
              >
                Technologies Planned
              </label>
              <div className="relative">
                <input
                  id="technologies"
                  type="text"
                  placeholder="e.g. Next.js, Go, Python, LangChain, PostgreSQL"
                  value={form.technologies}
                  onChange={(e) => updateField("technologies", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3.5 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                />
              </div>
              <p className="mt-1.5 text-xs text-[#71809D]">
                Separate technologies with commas.
              </p>
            </div>

            {/* Required Skills */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0E1633]">
                Skills Needed in Teammates
              </label>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                        selected
                          ? "border-[#2342F5]/40 bg-[#2342F5]/[0.08] text-[#2342F5]"
                          : "border-[#D5DBEB] bg-[#F8FAFF] text-[#596580] hover:text-[#2342F5]"
                      }`}
                    >
                      {selected && <Check size={13} />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Requirements / Pitch to Collaborators */}
            <div>
              <label
                htmlFor="team_requirements"
                className="mb-2 block text-sm font-medium text-[#0E1633]"
              >
                Team Needs & Open Roles
              </label>
              <textarea
                id="team_requirements"
                rows={3}
                placeholder="e.g. Looking for 1 UI/UX designer and 1 backend developer who can spend 5-10 hrs/week."
                value={form.team_requirements}
                onChange={(e) =>
                  updateField("team_requirements", e.target.value)
                }
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
              />
            </div>

            {/* Project Goal & Vision */}
            <div>
              <label
                htmlFor="goal"
                className="mb-2 block text-sm font-medium text-[#0E1633]"
              >
                Project Goal & Milestones
              </label>
              <textarea
                id="goal"
                rows={3}
                placeholder="Describe your primary vision, core problems you are solving, target outcomes, or roadmap..."
                value={form.goal}
                onChange={(e) => updateField("goal", e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
              />
            </div>

            {/* Fund Plans & Target Budget */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="fund_plans"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  Fund Plans & Budget Strategy
                </label>
                <textarea
                  id="fund_plans"
                  rows={2}
                  placeholder="e.g. Applying for student incubator grant, self-funded domain/hosting, hackathon pool..."
                  value={form.fund_plans}
                  onChange={(e) => updateField("fund_plans", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                />
              </div>

              <div>
                <label
                  htmlFor="target_fund"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  Target Fund / Budget
                </label>
                <input
                  id="target_fund"
                  type="text"
                  placeholder="e.g. ₹20,000 or Bootstrapped"
                  value={form.target_fund}
                  onChange={(e) => updateField("target_fund", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                />
              </div>
            </div>

            {/* External Links */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="github_url"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  GitHub Repository (Optional)
                </label>
                <input
                  id="github_url"
                  type="url"
                  placeholder="https://github.com/your-username/your-repo"
                  value={form.github_url}
                  onChange={(e) => updateField("github_url", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                />
              </div>

              <div>
                <label
                  htmlFor="live_demo_url"
                  className="mb-2 block text-sm font-medium text-[#0E1633]"
                >
                  Live Demo URL (Optional)
                </label>
                <input
                  id="live_demo_url"
                  type="url"
                  placeholder="https://yourproject.vercel.app"
                  value={form.live_demo_url}
                  onChange={(e) => updateField("live_demo_url", e.target.value)}
                  className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-3 text-sm outline-none placeholder:text-[#8995AE] focus:border-[#2342F5]/60 focus:ring-4 focus:ring-[#2342F5]/[0.08]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <Link
              href="/ideas"
              className="rounded-xl border border-[#D5DBEB] px-5 py-3 text-sm font-medium text-[#596580] hover:text-[#2342F5]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2342F5]/15 transition-colors hover:bg-[#1B35D5] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing project...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Publish Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
