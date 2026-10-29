"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { getStoredToken } from "../lib/auth";
import { API_BASE } from "@/api";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number;
    title: string;
  } | null;
  onProjectDeleted: (projectId: number) => void;
}

export default function DeleteProjectModal({
  isOpen,
  onClose,
  project,
  onProjectDeleted,
}: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    const token = getStoredToken();
    if (!token) {
      setErrorMsg("Please sign in to delete this project.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/ideas/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete project");
      }

      onProjectDeleted(project.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error deleting project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Trash2 size={24} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-xl border border-[#D5DBEB] p-2 text-slate-400 hover:bg-[#F4F6FB] hover:text-[#0E1633] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <h3 id="delete-project-title" className="text-lg font-bold text-[#0E1633]">
            Delete Project Permanently?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#5B6584]">
            Are you sure you want to delete <strong className="text-[#0E1633]">&ldquo;{project.title}&rdquo;</strong>?
            This will permanently remove the project posting, team members, join requests, tasks, and chat history. This action cannot be undone.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-xs font-bold text-[#5B6584] hover:bg-[#F4F6FB] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Yes, Delete Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
