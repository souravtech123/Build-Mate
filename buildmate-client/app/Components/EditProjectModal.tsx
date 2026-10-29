"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { getStoredToken } from "../lib/auth";
import { API_BASE } from "@/api";

export interface EditableProject {
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
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EditableProject | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProjectUpdated: (updatedProject: any) => void;
}

const CATEGORIES = [
  "Web Development",
  "AI/ML",
  "IoT",
  "Mobile Development",
  "Cybersecurity",
  "Cloud & DevOps",
  "Data Science",
  "Open Source",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const COMMON_SKILLS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "UI/UX Design",
  "AI / ML",
  "Mobile Dev",
  "DevOps",
  "Embedded IoT",
  "Database",
  "Product Management",
];

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

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

  // Prepopulate form when project changes or modal opens
  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || "",
        description: project.description || "",
        category: project.category || "Web Development",
        difficulty: project.difficulty || "Intermediate",
        technologies: project.technologies || "",
        team_requirements: project.team_requirements || "",
        goal: project.goal || "",
        fund_plans: project.fund_plans || "",
        target_fund: project.target_fund || "",
        github_url: project.github_url || "",
        live_demo_url: project.live_demo_url || "",
      });

      if (project.required_skills) {
        const skills = project.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        setSelectedSkills(skills);
      } else {
        setSelectedSkills([]);
      }
      setErrorMsg("");
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const token = getStoredToken();
    if (!token) {
      setErrorMsg("Please log in to edit this project.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMsg("Project title and description are required.");
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

      const res = await fetch(`${API_BASE}/api/v1/ideas/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update project");
      }

      onProjectUpdated(data.data);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error updating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-[#D5DBEB] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D5DBEB] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5]">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 id="edit-project-title" className="text-base sm:text-lg font-bold text-[#0E1633]">
                Edit Project Details
              </h3>
              <p className="text-xs text-[#5B6584]">
                Update your project idea, required skills, and collaboration goals.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="rounded-xl border border-[#D5DBEB] p-2 text-slate-400 hover:bg-[#F4F6FB] hover:text-[#0E1633] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. AI-Powered Notes Organizer"
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
                Difficulty Level
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
              Project Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe what your project is building, the problem it solves, and its vision..."
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
            />
          </div>

          {/* Technologies Stack */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
              Tech Stack
            </label>
            <input
              type="text"
              value={form.technologies}
              onChange={(e) => updateField("technologies", e.target.value)}
              placeholder="e.g. Next.js, Go, PostgreSQL, Tailwind, Docker"
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
            />
          </div>

          {/* Required Skills Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7B85A0]">
                Required Team Skills ({selectedSkills.length} selected)
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#2342F5] text-white shadow-xs"
                        : "border border-[#D5DBEB] bg-[#F8FAFF] text-[#5B6584] hover:bg-[#EEF1FF] hover:text-[#2342F5]"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add other skill (e.g. GraphQL, Figma)..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="flex-1 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-1.5 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="inline-flex items-center gap-1 rounded-xl border border-[#2342F5]/30 bg-[#EEF1FF] px-3 py-1.5 text-xs font-bold text-[#2342F5] hover:bg-[#2342F5] hover:text-white transition"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Team Roles / Requirements */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
              Who are you looking for?
            </label>
            <input
              type="text"
              value={form.team_requirements}
              onChange={(e) => updateField("team_requirements", e.target.value)}
              placeholder="e.g. Looking for 1 Frontend developer and 1 UI/UX designer"
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
            />
          </div>

          {/* Project Goal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
              Project Goal / Milestones
            </label>
            <textarea
              rows={2}
              value={form.goal}
              onChange={(e) => updateField("goal", e.target.value)}
              placeholder="What are the target deliverables or MVP milestone?"
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
            />
          </div>

          {/* Links: GitHub & Live Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={form.github_url}
                onChange={(e) => updateField("github_url", e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-1.5">
                Live Demo / Website URL
              </label>
              <input
                type="url"
                value={form.live_demo_url}
                onChange={(e) => updateField("live_demo_url", e.target.value)}
                placeholder="https://myproject.com"
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5] transition"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D5DBEB]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-xs font-bold text-[#5B6584] hover:bg-[#F4F6FB] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
