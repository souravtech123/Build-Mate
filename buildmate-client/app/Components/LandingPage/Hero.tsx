"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Plus, LayoutDashboard, Compass, Sparkles } from "lucide-react";
import { useCurrentUser } from "../../lib/auth";
import InstallPWAButton from "../InstallPWAButton";

/*
  Design tokens
  paper  #F4F6FB  cool blueprint paper
  ink    #0E1633  deep navy text
  blue   #2342F5  brand action color
  amber  #FFB620  "open role" marker
  line   #D5DBEB  grid + borders
  Type: Bricolage Grotesque (display) + DM Sans (body)
*/

const ROLES = [
  { id: "frontend", role: "Frontend", name: "Aarav S.", skill: "React, Tailwind", year: "2nd year", filled: true },
  { id: "backend", role: "Backend", name: "Meera K.", skill: "Node, PostgreSQL", year: "3rd year" },
  { id: "design", role: "UI designer", name: "Rohan D.", skill: "Figma, prototyping", year: "2nd year" },
  { id: "ml", role: "ML engineer", name: "Ishita P.", skill: "Python, PyTorch", year: "4th year" },
];

function initials(name: string) {
  return name.split(" ").map((p: string) => p[0]).join("").replace(".", "");
}

function TeamBoard({ userLoggedIn }: { userLoggedIn: boolean }) {
  const reduce = useReducedMotion();
  const [invited, setInvited] = useState<Record<string, boolean>>({});

  const filledCount = ROLES.filter((r) => r.filled || invited[r.id]).length;
  const complete = filledCount === ROLES.length;

  const toggle = (id: string) => setInvited((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#D5DBEB] bg-white p-4 sm:p-7 shadow-[0_15px_35px_-20px_rgba(14,22,51,0.15)] sm:shadow-[0_30px_60px_-30px_rgba(14,22,51,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7B85A0]">Interactive Demo</span>
          <h3 className="mt-0.5 font-display text-lg sm:text-2xl font-bold leading-tight text-[#0E1633]">
            Campus event planner
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-bold text-[#2342F5]">
          {filledCount}/{ROLES.length} filled
        </span>
      </div>

      <div className="mt-3 sm:mt-4 h-1.5 overflow-hidden rounded-full bg-[#E6EAF5]">
        <motion.div
          className="h-full rounded-full bg-[#2342F5]"
          initial={false}
          animate={{ width: `${(filledCount / ROLES.length) * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>

      <ul className="mt-3 sm:mt-5 space-y-2">
        {ROLES.map((r) => {
          const isFilled = r.filled || invited[r.id];
          return (
            <li
              key={r.id}
              className={`flex items-center gap-2.5 sm:gap-3.5 rounded-xl sm:rounded-2xl border px-3 py-2 sm:px-3.5 sm:py-3 transition-colors ${
                isFilled
                  ? "border-[#C7D1FF] bg-[#F3F5FF]"
                  : "border-dashed border-[#BCC5DE] bg-white"
              }`}
            >
              <div
                className={`flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-semibold ${
                  isFilled ? "bg-[#2342F5] text-white" : "bg-[#FFF3D1] text-[#8A5F00]"
                }`}
                aria-hidden="true"
              >
                {isFilled ? initials(r.name) : "?"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-[#0E1633]">{r.role}</p>
                <p className="truncate text-[11px] sm:text-sm text-[#5B6584]">
                  {isFilled ? `${r.name} · ${r.skill}` : `Suggested: ${r.name}`}
                </p>
              </div>

              {r.filled ? (
                <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#2342F5]">
                  <Check size={14} /> You
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-pressed={!!invited[r.id]}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5] ${
                    invited[r.id]
                      ? "bg-[#2342F5] text-white"
                      : "border border-[#0E1633] text-[#0E1633] hover:bg-[#0E1633] hover:text-white"
                  }`}
                >
                  {invited[r.id] ? (
                    <>
                      <Check size={13} /> Invited
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Invite
                    </>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 min-h-[36px]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {complete ? (
            <motion.div
              key="ready"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Link
                href={userLoggedIn ? "/dashboard" : "/register"}
                className="flex w-full items-center justify-between rounded-xl bg-[#0E1633] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#2342F5]"
              >
                <span>{userLoggedIn ? "Team complete · Go to Dashboard" : "Team complete · Create account"}</span>
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[#5B6584] text-center"
            >
              💡 Tap &quot;Invite&quot; to assemble your mock team
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Hero() {
  const user = useCurrentUser();

  return (
    <section
      className="relative overflow-hidden bg-[#F4F6FB] font-body text-[#0E1633]"
      style={{
        backgroundImage:
          "linear-gradient(#E3E8F4 1px, transparent 1px), linear-gradient(90deg, #E3E8F4 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
        .font-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      <div className="mx-auto flex flex-col lg:grid max-w-7xl items-center gap-8 lg:gap-16 px-4 py-8 sm:px-6 sm:py-14 md:px-10 lg:min-h-[85vh] lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div className="w-full text-center lg:text-left">
          {user ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome back, {user.name}!</span>
            </div>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-3 py-1 text-xs font-medium text-[#5B6584]">
              <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
              Xavier TechByte Society
            </p>
          )}

          {user ? (
            <div className="mt-4">
              <h1 className="font-display max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl lg:leading-[1.02]">
                Welcome to Build-Mate<span className="text-[#2342F5]">.</span>
              </h1>
              <p className="mt-2 text-sm sm:text-2xl font-bold text-[#2342F5]">
                Ready to collaborate and build, {user.name.split(" ")[0]}?
              </p>
            </div>
          ) : (
            <h1 className="font-display mt-4 max-w-2xl text-2xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight lg:leading-[1.02]">
              Post an idea. Find the people to build it.
            </h1>
          )}

          <p className="mx-auto lg:mx-0 mt-3 max-w-lg text-xs sm:text-base sm:leading-7 text-[#4A5473]">
            {user
              ? "Discover active student projects looking for your skills, or jump into your personal dashboard to track incoming requests and post your own ideas."
              : "Build-Mate matches students by skill, so your next hackathon or side project starts with a full team, not a group chat of strangers."}
          </p>

          <div className="mt-6 flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="group inline-flex flex-1 sm:flex-initial justify-center items-center gap-1.5 sm:gap-2 rounded-xl bg-[#2342F5] px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9]"
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                  <ArrowRight size={15} className="hidden sm:inline transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/ideas"
                  className="inline-flex flex-1 sm:flex-initial justify-center items-center gap-1.5 sm:gap-2 rounded-xl border border-[#0E1633] bg-white px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-[#0E1633] transition hover:bg-[#0E1633] hover:text-white"
                >
                  <Compass size={15} className="text-[#2342F5]" />
                  <span>Explore Ideas</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group inline-flex flex-1 sm:flex-initial justify-center items-center gap-1.5 sm:gap-2 rounded-xl bg-[#2342F5] px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#1A33C9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5]"
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/ideas"
                  className="inline-flex flex-1 sm:flex-initial justify-center items-center rounded-xl border border-[#0E1633] bg-white px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold transition hover:bg-[#0E1633] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5]"
                >
                  Browse Ideas
                </Link>
              </>
            )}
          </div>

          <div className="mt-4 flex sm:hidden items-center justify-center">
            <InstallPWAButton />
          </div>

          <p className="mt-3 text-xs text-[#5B6584]">
            Free for Xavier students · No setup required
          </p>
        </div>

        <div className="w-full flex justify-center lg:justify-end">
          <TeamBoard userLoggedIn={!!user} />
        </div>
      </div>
    </section>
  );
}