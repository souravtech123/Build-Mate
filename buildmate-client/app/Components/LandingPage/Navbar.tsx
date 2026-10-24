"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Code2, Menu, X, User as UserIcon, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useCurrentUser, clearAuth } from "../../lib/auth";
import JoinDevTeamModal from "../JoinDevTeamModal";

const NAV_LINKS = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Mobile App", href: "/#mobile-app" },
  { label: "Explore Ideas", href: "/ideas" },
  { label: "Our Team", href: "/#team" },
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinDevOpen, setJoinDevOpen] = useState(false);
  const reduce = useReducedMotion();
  const user = useCurrentUser();

  const handleLogout = () => {
    clearAuth();
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#D5DBEB] bg-[#F4F6FB]/95 font-body text-[#0E1633] backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 md:px-10"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20">
            <Code2 size={22} />
          </div>

          <div>
            <span className="block font-display text-lg font-bold leading-tight tracking-tight">
              Build-Mate
            </span>
            <span className="block text-xs text-[#5B6584]">
              Team Build-Mate
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#5B6584] transition-colors hover:text-[#2342F5]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => setJoinDevOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2342F5]/30 bg-[#EEF1FF] px-3.5 py-2 text-xs font-bold text-[#2342F5] hover:bg-[#2342F5] hover:text-white transition shadow-sm"
          >
            <Users size={14} />
            <span>Join Dev Team</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D5DBEB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0E1633] transition hover:border-[#2342F5]/40 hover:bg-[#EEF1FF]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2342F5] text-[10px] font-bold text-white">
                  {initials(user.name)}
                </div>
                <span>Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4A5473] transition hover:text-[#2342F5]"
              >
                Log In
              </Link>

              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#2342F5] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition-all hover:bg-[#1A33C9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5]"
              >
                Get Started
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D5DBEB] bg-white transition hover:border-[#2342F5] md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
            className="overflow-hidden border-t border-[#D5DBEB] md:hidden bg-white/95 backdrop-blur-md"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 md:px-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[#5B6584] transition hover:bg-[#EEF1FF] hover:text-[#2342F5]"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-3 border-t border-[#D5DBEB] pt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2342F5] text-xs font-bold text-white">
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0E1633] truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-4 py-3 text-sm font-semibold text-white"
                    >
                      <LayoutDashboard size={16} />
                      Go to Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-[#D5DBEB] bg-white px-5 py-3 text-sm font-semibold text-[#0E1633] transition hover:bg-[#EEF1FF]"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1A33C9]"
                    >
                      Get Started
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setJoinDevOpen(true);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#2342F5]/30 bg-[#EEF1FF] px-4 py-3 text-xs font-bold text-[#2342F5]"
                >
                  <Users size={15} />
                  <span>Join Development Team</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <JoinDevTeamModal isOpen={joinDevOpen} onClose={() => setJoinDevOpen(false)} />
    </header>
  );
}
