"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Award, Clock, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ProjectTask, RewardTicket, updateTaskStatus } from "../lib/auth";

interface CompleteTaskModalProps {
  projectId: number;
  task: ProjectTask;
  onClose: () => void;
  onSuccess: (updatedTask: ProjectTask, ticket?: RewardTicket) => void;
}

export default function CompleteTaskModal({
  projectId,
  task,
  onClose,
  onSuccess,
}: CompleteTaskModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverdue = new Date(task.deadline).getTime() < Date.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await updateTaskStatus(projectId, task.id, "completed", note);
    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.message || "Failed to mark task complete");
      return;
    }

    onSuccess(res.data.task, res.data.ticket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B19]/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E1E5F2]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E5F2]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0E1633]">Submit Task Completion</h3>
              <p className="text-xs text-[#5B6584]">Verify completion & claim your reward</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-100 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</div>
            <div className="text-sm font-bold text-gray-900">{task.title}</div>
            
            {/* On-Time Status Banner */}
            {!isOverdue ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                <Sparkles size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">On-Time Reward Eligible! </span>
                  Completing now generates an authenticated <strong>{task.reward_title}</strong> with <strong>+{task.reward_points} XP</strong>!
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Deadline Passed: </span>
                  This task is overdue. It will be marked completed, but without an on-time reward ticket.
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E1633] mb-1">
              Submission Proof or Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. PR link, commit hash, or notes on completed deliverables..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs text-[#0E1633] placeholder:text-gray-400 focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D5DBEB] px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{!isOverdue ? "Complete & Claim Ticket" : "Mark as Completed"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
