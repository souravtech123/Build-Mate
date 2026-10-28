"use client";

import { useState } from "react";
import { Sparkles, X, CheckCircle, AlertCircle, Loader2, Code2, Send, Mail } from "lucide-react";
import { useCurrentUser } from "../lib/auth";

import { API_BASE as API_URL } from "@/api";

interface JoinDevTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinDevTeamModal({ isOpen, onClose }: JoinDevTeamModalProps) {
  const user = useCurrentUser();
  const [role, setRole] = useState("Full Stack Developer");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [college, setCollege] = useState(user?.college || "");
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitch.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "join_dev_team",
          message: `[JOIN DEV TEAM APPLICATION]\nRole: ${role}\nCollege: ${college}\nPitch/Experience: ${pitch}`,
          email: user?.email || email.trim(),
          name: user?.name || name.trim() || "Student Builder",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit application");
      }

      setStatus({
        success: true,
        text: "Application sent! Welcome to the Build-Mate developer community. We will be in touch soon!",
      });
      setPitch("");
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2500);
    } catch (err: unknown) {
      setStatus({
        success: false,
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const mailtoLink = `mailto:souravsuman846@gmail.com?subject=${encodeURIComponent(
    "Application to Join Build-Mate Development Team"
  )}&body=${encodeURIComponent(
    `Hi Team Build-Mate,\n\nI want to join the Development Team and be a part of this Wonderful Project!\n\nName: ${user?.name || name}\nRole: ${role}\nCollege: ${college}\nWhat I can contribute: ${pitch}\n\nBest regards,\n${user?.name || name}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0E1633]/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-[#D5DBEB] bg-white p-6 sm:p-8 text-[#0E1633] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-[#D5DBEB] p-2 text-slate-500 hover:bg-[#F9FAFD] hover:text-[#0E1633] transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/25">
            <Code2 size={22} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Join the Development Team</h3>
            <p className="text-xs text-[#5B6584]">Be a core part of this wonderful project!</p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#4A5473] bg-[#EEF1FF] p-3 rounded-xl border border-[#2342F5]/20">
          We are actively looking for passionate developers, designers, and students to build the future of student collaboration on <strong>Build-Mate</strong>.
        </p>

        {status && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
              status.success
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {status.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B85A0] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                defaultValue={user?.name || name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B85A0] mb-1">
                Your Email
              </label>
              <input
                type="email"
                required
                defaultValue={user?.email || email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B85A0] mb-1">
                Role You Want to Take
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3 py-2 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
              >
                <option value="Frontend Developer">Frontend Developer (React/Next.js)</option>
                <option value="Backend Developer">Backend Developer (Go / APIs)</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="UI/UX Designer">UI/UX Designer (Figma)</option>
                <option value="Community Lead">Community & Growth Lead</option>
                <option value="Other / Contributor">Open Source Contributor</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B85A0] mb-1">
                College / Organization
              </label>
              <input
                type="text"
                defaultValue={user?.college || college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="College or University"
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-3.5 py-2 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B85A0] mb-1">
              Skills, GitHub, or Why you want to join <span className="text-[#2342F5]">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Tell us what technologies you love, links to your GitHub or projects, and what you'd like to build on Build-Mate..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] p-3 text-xs text-[#0E1633] outline-none focus:border-[#2342F5]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <a
              href={mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2342F5] hover:underline"
            >
              <Mail size={13} />
              Or send email directly
            </a>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="rounded-xl border border-[#D5DBEB] px-4 py-2 text-xs font-semibold text-[#5B6584] hover:bg-[#F9FAFD]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !pitch.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Join Team
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
