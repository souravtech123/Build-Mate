"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Loader2,
  Users,
  MessageSquare,
  Sparkles,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Crown,
} from "lucide-react";
import { User, ChatMessage, getStoredToken } from "../lib/auth";

interface TeamChatProps {
  projectId: number;
  projectTitle: string;
  currentUser: User;
  isOwner?: boolean;
  userRole?: string;
}

import { API_BASE } from "@/api";

function formatChatTime(timestamp?: string) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

export default function TeamChat({
  projectId,
  projectTitle,
  currentUser,
  isOwner = false,
  userRole = isOwner ? "Project Lead" : "Team Member",
}: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting");
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch past messages
  const fetchHistory = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/ideas/${projectId}/chat/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch {
      // ignore history fetch error
    } finally {
      setLoadingHistory(false);
    }
  }, [projectId]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      setErrorMsg("Please log in to join the team chat.");
      setConnectionStatus("disconnected");
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");
    setErrorMsg(null);

    // Convert http/https API_BASE to ws/wss
    const url = new URL(API_BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${url.host}/api/v1/ideas/${projectId}/chat/ws?token=${encodeURIComponent(
      token
    )}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        setErrorMsg(null);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.online_count) {
            setOnlineCount(payload.online_count);
          }

          if (payload.type === "chat" && payload.data) {
            setMessages((prev) => {
              // Avoid duplicates if message with same ID already exists
              if (payload.data.id && prev.some((m) => m.id === payload.data.id)) {
                return prev;
              }
              return [...prev, payload.data];
            });
          } else if (
            (payload.type === "user_joined" || payload.type === "user_left") &&
            payload.data
          ) {
            setMessages((prev) => [...prev, payload.data]);
          }
        } catch {
          // ignore non-json messages
        }
      };

      ws.onerror = () => {
        setConnectionStatus("disconnected");
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
      };
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to team chat");
      setConnectionStatus("disconnected");
    }
  }, [projectId]);

  // Initial setup & cleanup
  useEffect(() => {
    void fetchHistory();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [fetchHistory, connectWebSocket]);

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("Chat connection is offline. Reconnecting...");
      connectWebSocket();
      return;
    }

    const payload = {
      type: "chat",
      message: trimmed,
    };

    socketRef.current.send(JSON.stringify(payload));
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-[#D5DBEB] bg-white shadow-sm">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between border-b border-[#E8ECF5] bg-[#F8FAFF] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5]/10 text-[#2342F5]">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#0E1633] line-clamp-1">
                {projectTitle} • Team Room
              </h3>
              <span className="rounded-md bg-[#EEF1FF] px-2 py-0.5 text-[10px] font-bold text-[#2342F5]">
                WebSocket API
              </span>
            </div>
            <p className="text-xs text-[#5B6584]">
              Real-time collaboration for project teammates
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-[#D5DBEB] bg-white px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
            <span className="font-medium text-[#4A5473]">
              {connectionStatus === "connected"
                ? `Live (${onlineCount} active)`
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Offline"}
            </span>
          </div>

          {connectionStatus === "disconnected" && (
            <button
              type="button"
              onClick={connectWebSocket}
              className="inline-flex items-center gap-1 rounded-xl bg-[#EEF1FF] px-2.5 py-1 text-xs font-semibold text-[#2342F5] transition hover:bg-[#2342F5] hover:text-white"
            >
              <RefreshCw size={12} />
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAFBFD]">
        {loadingHistory ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#7B85A0]">
            <Loader2 className="h-6 w-6 animate-spin text-[#2342F5]" />
            <p className="text-xs">Loading team chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#2342F5] mb-3">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold text-sm text-[#0E1633]">Start the team conversation!</h4>
            <p className="mt-1 text-xs text-[#5B6584] max-w-sm">
              This is the private workspace channel for teammates. Send ideas, updates, questions, or milestones here.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.message_type === "system") {
              return (
                <div key={msg.id || idx} className="flex justify-center my-2">
                  <span className="rounded-full bg-[#EBF0FE] px-3 py-1 text-[11px] font-medium text-[#2342F5]">
                    {msg.message}
                  </span>
                </div>
              );
            }

            const isSelf = Number(msg.sender_id) === Number(currentUser.id);

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {!isSelf && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2342F5] text-white text-xs font-bold shadow-sm">
                    {getInitials(msg.sender_name || "U")}
                  </div>
                )}

                <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-xs font-bold text-[#0E1633]">
                      {isSelf ? "You" : msg.sender_name}
                    </span>
                    {msg.sender_role && (
                      <span className="rounded bg-[#EEF1FF] px-1.5 py-0.2 text-[9px] font-bold text-[#2342F5]">
                        {msg.sender_role}
                      </span>
                    )}
                    <span className="text-[10px] text-[#8C96AD]">
                      {formatChatTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isSelf
                        ? "bg-[#2342F5] text-white rounded-tr-none shadow-md shadow-[#2342F5]/10"
                        : "bg-white text-[#0E1633] border border-[#D5DBEB] rounded-tl-none shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t border-[#E8ECF5] bg-white p-3 sm:p-4"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message teammates in real-time... (Press Enter to send)"
          className="flex-1 rounded-xl border border-[#D5DBEB] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0E1633] placeholder:text-[#929BB2] focus:border-[#2342F5] focus:bg-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || connectionStatus !== "connected"}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2342F5] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1b34c7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
