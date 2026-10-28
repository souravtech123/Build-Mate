"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Copy,
  Check,
  X,
  Share2,
  ShieldCheck,
  Zap,
  FolderGit2,
  UserCheck,
} from "lucide-react";
import { RewardTicket } from "../lib/auth";

interface RewardTicketModalProps {
  ticket: RewardTicket | null;
  onClose: () => void;
}

export default function RewardTicketModal({ ticket, onClose }: RewardTicketModalProps) {
  const [copied, setCopied] = useState(false);

  if (!ticket) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedCompleted = new Date(ticket.completed_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDeadline = new Date(ticket.deadline).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B19]/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition"
          aria-label="Close ticket"
        >
          <X size={20} />
        </button>

        {/* TICKET CONTAINER */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0E1633] text-white shadow-2xl border border-white/10">
          {/* Top Gradient Header */}
          <div className="relative bg-gradient-to-r from-[#2342F5] via-[#4361EE] to-[#7B2CBF] p-6 pb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Zap size={18} className="text-yellow-300" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-blue-200 uppercase">BuildMate Achievement</div>
                  <div className="text-xs font-bold tracking-wider">OFFICIAL REWARD PASS</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
                <CheckCircle2 size={13} />
                <span>On-Time Certified</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Award className="text-yellow-300" size={26} />
                <span>{ticket.reward_title || "Task Completion Pass"}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-blue-100">
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold">
                  +{ticket.reward_points} REWARD XP
                </span>
                <span>•</span>
                <span>Sprint Reward Milestone</span>
              </div>
            </div>
          </div>

          {/* Ticket Perforated Divider with Side Cutouts */}
          <div className="relative flex items-center bg-[#0B1229] py-3">
            {/* Left cutout hole */}
            <div className="absolute -left-4 h-8 w-8 rounded-full bg-[#070B19]" />
            {/* Dashed line */}
            <div className="w-full border-b-2 border-dashed border-white/15 mx-6" />
            {/* Right cutout hole */}
            <div className="absolute -right-4 h-8 w-8 rounded-full bg-[#070B19]" />
          </div>

          {/* Main Ticket Body */}
          <div className="p-6 bg-[#0B1229] space-y-4">
            {/* Task and Project Detail */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
              <div>
                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Completed Task</div>
                <div className="text-base font-bold text-white mt-0.5">{ticket.task_title}</div>
              </div>

              {ticket.project && (
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <FolderGit2 size={14} className="text-[#4361EE]" />
                  <span>Project:</span>
                  <span className="font-semibold text-white">{ticket.project.title}</span>
                </div>
              )}

              {ticket.user && (
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <UserCheck size={14} className="text-emerald-400" />
                  <span>Awarded To:</span>
                  <span className="font-semibold text-emerald-300">{ticket.user.name}</span>
                  {ticket.user.college && <span className="text-gray-400">({ticket.user.college})</span>}
                </div>
              )}
            </div>

            {/* Time Stamp Comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                  <Calendar size={13} />
                  <span>Task Deadline</span>
                </div>
                <div className="font-semibold text-gray-200">{formattedDeadline}</div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center gap-1.5 text-emerald-300 mb-1">
                  <Clock size={13} />
                  <span>Completed At</span>
                </div>
                <div className="font-semibold text-emerald-200">{formattedCompleted}</div>
              </div>
            </div>

            {/* Ticket Code and Barcode Aesthetic */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Digital Voucher Code</div>
                <div className="font-mono text-sm font-bold text-yellow-300 mt-0.5">{ticket.ticket_number}</div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Barcode Visual Line */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="flex items-center gap-1 opacity-40 h-8">
                {[4, 2, 8, 3, 6, 2, 10, 4, 3, 7, 2, 5, 8, 3, 2, 6, 4, 9, 3, 2, 7, 5, 2, 4, 8, 3, 2, 6].map((h, i) => (
                  <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${h * 2.5}px` }} />
                ))}
              </div>
              <div className="text-[10px] font-mono text-gray-500 mt-1 tracking-widest">
                VERIFIED CRYPTOGRAPHIC REWARD RECORD
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-[#0E1633] border-t border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck size={15} className="text-[#4361EE]" />
              <span>Authentic Member Voucher</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#2342F5] hover:bg-[#1b34c2] px-5 py-2 text-xs font-bold text-white transition shadow-lg shadow-blue-600/30"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
