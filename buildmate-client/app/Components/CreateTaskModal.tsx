"use client";

import React, { useState } from "react";
import { X, Calendar, Flag, Award, Sparkles, User, Loader2 } from "lucide-react";
import { JoinRequest, createProjectTask, ProjectTask } from "../lib/auth";

interface CreateTaskModalProps {
  projectId: number;
  members: JoinRequest[];
  onClose: () => void;
  onCreated: (task: ProjectTask) => void;
}

export default function CreateTaskModal({
  projectId,
  members,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState<number>(
    members.length > 0 ? members[0].user_id : 0
  );
  // Default deadline: 3 days from now
  const defaultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [rewardPoints, setRewardPoints] = useState(100);
  const [rewardTitle, setRewardTitle] = useState("Sprint Star Ticket");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a task title");
      return;
    }
    if (!assignedToUserId) {
      setError("Please select a member to assign this task to");
      return;
    }
    if (!deadline) {
      setError("Please pick a deadline");
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate.getTime() <= Date.now()) {
      setError("Deadline must be in the future");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createProjectTask(projectId, {
      title: title.trim(),
      description: description.trim(),
      assigned_to_user_id: Number(assignedToUserId),
      deadline: deadlineDate.toISOString(),
      priority,
      reward_points: Number(rewardPoints),
      reward_title: rewardTitle.trim() || "On-Time Completion Pass",
    });

    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to assign task");
      return;
    }

    onCreated(res.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B19]/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E1E5F2]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E1E5F2]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2342F5] to-[#4361EE] text-white">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0E1633]">Assign Task & Deadline</h3>
              <p className="text-xs text-[#5B6584]">Assign work with an on-time reward ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-[#0E1633] mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-[#2342F5]" />
              <span>Assign To Team Member *</span>
            </label>
            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0E1633] focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
              required
            >
              {members.length === 0 ? (
                <option value={0} disabled>No accepted members yet</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.user_id}>
                    {m.user?.name || `Member #${m.user_id}`} — {m.role}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#0E1633] mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Implement WebSocket Chat Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2.5 text-sm text-[#0E1633] placeholder:text-gray-400 focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0E1633] mb-1.5">
              Requirements & Guidelines
            </label>
            <textarea
              rows={3}
              placeholder="Detail the deliverables and acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3.5 py-2.5 text-sm text-[#0E1633] placeholder:text-gray-400 focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
            />
          </div>

          {/* Deadline & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0E1633] mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#2342F5]" />
                <span>Deadline & Timelimit *</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs text-[#0E1633] focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1633] mb-1.5 flex items-center gap-1.5">
                <Flag size={13} className="text-[#2342F5]" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs font-semibold text-[#0E1633] focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Deadline</option>
              </select>
            </div>
          </div>

          {/* Reward Points & Ticket Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0E1633] mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-500" />
                <span>Reward XP Points</span>
              </label>
              <select
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs font-semibold text-[#0E1633] focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
              >
                <option value={50}>50 XP (Standard)</option>
                <option value={100}>100 XP (Major Task)</option>
                <option value={150}>150 XP (Critical Sprint)</option>
                <option value={200}>200 XP (Milestone Hero)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1633] mb-1.5 flex items-center gap-1.5">
                <Award size={13} className="text-[#2342F5]" />
                <span>Ticket Name / Badge</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sprint Star Ticket"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="w-full rounded-xl border border-[#D5DBEB] bg-white px-3 py-2 text-xs text-[#0E1633] placeholder:text-gray-400 focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/20"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D5DBEB] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2342F5] to-[#4361EE] px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Assign Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
