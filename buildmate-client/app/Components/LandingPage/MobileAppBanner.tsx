"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Smartphone,
  Download,
  Sparkles,
  CheckCircle2,
  Bell,
  Zap,
  Users,
  Compass,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function MobileAppBanner() {
  const reduce = useReducedMotion();
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"android" | "ios" | "both">("android");
  const [college, setCollege] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setErrorMsg("Please enter both your name and email.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const messageContent = `[MOBILE APP PRE-REGISTRATION] Platform Preference: ${platform.toUpperCase()} | College: ${
        college || "Not specified"
      } | Interested in early beta testing and download.`;

      const res = await fetch(`${API_BASE}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "app_waitlist",
          name: name.trim(),
          email: email.trim(),
          message: messageContent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to reserve your app spot.");
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setEmail("");
      setCollege("");
      setErrorMsg("");
    }, 300);
  };

  return (
    <section
      id="mobile-app"
      className="relative overflow-hidden bg-[#0E1633] py-20 font-body text-white sm:py-28"
    >
      {/* Blueprint grid accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(#2342F5 1px, transparent 1px), linear-gradient(90deg, #2342F5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radiant glow spots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-[#2342F5]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#FFB620]/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Heading, Perks, CTAs */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2342F5]/50 bg-[#2342F5]/20 px-3.5 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>📱 OFFICIAL MOBILE APP IS COMING</span>
            </div>

            <h2 className="mt-6 font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Build-Mate in Your Pocket<span className="text-[#2342F5]">.</span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              We’re bringing the complete student collaboration experience to iOS & Android.
              Discover groundbreaking campus ideas, get real-time chat notifications from project owners,
              and assemble your dream team anywhere, anytime.
            </p>

            {/* Key feature pills */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2342F5] text-white">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instant Notifications</p>
                  <p className="text-[11px] text-slate-400">Never miss an owner reply or invite</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFB620] text-[#0E1633]">
                  <Compass size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Explore On The Go</p>
                  <p className="text-[11px] text-slate-400">Swipe through trending campus repos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">1-Tap Team Joining</p>
                  <p className="text-[11px] text-slate-400">Apply to open roles in seconds</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Lightweight & Fast</p>
                  <p className="text-[11px] text-slate-400">Sub-10MB native performance</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-[#2342F5] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-[#2342F5]/30 transition hover:bg-[#1936DF] hover:shadow-2xl"
              >
                <Smartphone size={18} />
                <span>Book the App Now</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  VIP Early Access
                </span>
                <ChevronRight size={16} className="transition group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Download size={18} />
                <span>Download APK (Beta)</span>
              </button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              Free for all students · No spam guaranteed · Beta invites sent by priority
            </p>
          </motion.div>

          {/* Right Column: Interactive Phone Mockup */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex justify-center lg:col-span-5"
          >
            <div className="relative w-full max-w-xs rounded-[44px] border-4 border-slate-700/80 bg-slate-900 p-3 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
              {/* Speaker / Notch bar */}
              <div className="absolute left-1/2 top-4 h-4 w-28 -translate-x-1/2 rounded-full bg-slate-800" />

              {/* Screen Content */}
              <div className="mt-5 overflow-hidden rounded-[32px] border border-white/5 bg-[#F4F6FB] p-4 text-[#0E1633]">
                {/* App Header inside phone */}
                <div className="flex items-center justify-between border-b border-[#D5DBEB] pb-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2342F5] text-white">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-black">Build-Mate</p>
                      <p className="text-[9px] font-bold text-[#2342F5]">CAMPUS RADAR</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                    Live Feed
                  </span>
                </div>

                {/* Mockup Project Cards */}
                <div className="mt-3 space-y-2.5">
                  <div className="rounded-2xl border border-[#D5DBEB] bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#2342F5]">
                        Web & Mobile
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">Just now</span>
                    </div>
                    <p className="mt-1.5 text-xs font-black line-clamp-1">Campus Event Tracker</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                      Looking for 1 React Native dev & 1 backend engineer.
                    </p>
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="text-[9px] font-bold text-[#FFB620]">2 open roles</span>
                      <span className="rounded-lg bg-[#2342F5] px-2 py-1 text-[9px] font-bold text-white">
                        Join Team
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D5DBEB] bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                        AI / ML
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">10m ago</span>
                    </div>
                    <p className="mt-1.5 text-xs font-black line-clamp-1">Smart Lecture Summarizer</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                      Python Whisper + Gemini pipeline.
                    </p>
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="text-[9px] font-bold text-[#FFB620]">1 open role</span>
                      <span className="rounded-lg bg-[#2342F5] px-2 py-1 text-[9px] font-bold text-white">
                        Join Team
                      </span>
                    </div>
                  </div>

                  {/* Booking Teaser Card */}
                  <div
                    onClick={() => setModalOpen(true)}
                    className="cursor-pointer rounded-2xl border border-dashed border-[#2342F5] bg-[#2342F5]/5 p-3 text-center transition hover:bg-[#2342F5]/10"
                  >
                    <Smartphone size={20} className="mx-auto text-[#2342F5]" />
                    <p className="mt-1 text-xs font-black text-[#2342F5]">Pre-Register Now</p>
                    <p className="text-[10px] text-slate-600">Get early Android APK / TestFlight</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOOK THE APP NOW MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetModal}
              className="absolute inset-0 bg-[#0E1633]/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-lg rounded-3xl border border-[#D5DBEB] bg-white p-6 text-[#0E1633] shadow-2xl sm:p-8"
            >
              <button
                onClick={resetModal}
                className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              {submitted ? (
                /* Success screen */
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-[#0E1633]">
                    You&apos;re On The Early Access List! 🎉
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Thank you, <span className="font-bold text-[#0E1633]">{name}</span>! We’ve reserved
                    your spot for the <span className="font-bold text-[#2342F5]">{platform.toUpperCase()}</span> build.
                    We will send the direct APK and beta instructions to{" "}
                    <span className="font-bold text-[#0E1633]">{email}</span> the moment the release is published.
                  </p>

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-[#F4F6FB] p-4 text-xs font-semibold text-slate-600">
                    💡 Tip: Bookmark Build-Mate on your browser while we prepare your mobile download package!
                  </div>

                  <button
                    onClick={resetModal}
                    className="mt-6 w-full rounded-2xl bg-[#2342F5] py-3.5 text-sm font-bold text-white transition hover:bg-[#1936DF]"
                  >
                    Awesome, take me back
                  </button>
                </div>
              ) : (
                /* Form screen */
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2342F5]/10 text-[#2342F5]">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Book the Mobile App</h3>
                      <p className="text-xs text-slate-500">
                        Get early beta access & direct APK download link
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sourav Suman"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#D5DBEB] px-3.5 py-2.5 text-sm font-medium focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@college.edu or personal email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#D5DBEB] px-3.5 py-2.5 text-sm font-medium focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/10"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        We will send the APK download link and beta TestFlight invite here.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Select Platform
                      </label>
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        {[
                          { id: "android", label: "Android (APK)" },
                          { id: "ios", label: "iOS (TestFlight)" },
                          { id: "both", label: "Both" },
                        ].map((opt) => (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setPlatform(opt.id as "android" | "ios" | "both")}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                              platform === opt.id
                                ? "border-[#2342F5] bg-[#2342F5]/10 text-[#2342F5]"
                                : "border-[#D5DBEB] text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        College / University <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IIT, NIT, Delhi University..."
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#D5DBEB] px-3.5 py-2.5 text-sm font-medium focus:border-[#2342F5] focus:outline-none focus:ring-2 focus:ring-[#2342F5]/10"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2342F5] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2342F5]/25 transition hover:bg-[#1936DF] disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Reserving Your App Spot…
                          </>
                        ) : (
                          <>
                            <Smartphone size={16} />
                            Book the App Now & Join Waitlist
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
