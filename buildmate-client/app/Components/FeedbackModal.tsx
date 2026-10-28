"use client";

import { useState } from "react";
import { MessageSquarePlus, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useCurrentUser } from "../lib/auth";

import { API_BASE as API_URL } from "@/api";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const user = useCurrentUser();
  const [type, setType] = useState<"suggestion" | "feedback" | "bug">("suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: user?.email || email.trim(),
          name: user?.name || "Student User",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit feedback");
      }

      setStatus({ success: true, text: "Thanks for helping improve BuildMate! We received your feedback." });
      setMessage("");
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);
    } catch (err: unknown) {
      setStatus({
        success: false,
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

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

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5]">
            <MessageSquarePlus size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Feedback & Suggestions</h3>
            <p className="text-xs text-[#5B6584]">Help us make Build-Mate better for every student</p>
          </div>
        </div>

        {status && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
              status.success
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {status.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "suggestion", label: "💡 Suggestion" },
                { id: "feedback", label: "💬 General" },
                { id: "bug", label: "🐞 Bug Report" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as "suggestion" | "feedback" | "bug")}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
                    type === item.id
                      ? "border-[#2342F5] bg-[#EEF1FF] text-[#2342F5]"
                      : "border-[#D5DBEB] bg-white text-[#5B6584] hover:bg-[#F9FAFD]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
              Your Message / Suggestion <span className="text-[#2342F5]">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell us what's working, what could be improved, or an idea you have..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] p-3 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7B85A0] mb-2">
                Your Email (Optional)
              </label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0E1633] outline-none focus:border-[#2342F5]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-[#D5DBEB] px-4 py-2.5 text-xs font-semibold text-[#5B6584] hover:bg-[#F9FAFD]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#2342F5]/20 hover:bg-[#1A33C9] disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
