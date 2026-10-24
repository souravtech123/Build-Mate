"use client";

import { useState } from "react";
import { ArrowUpRight, Code2, Users } from "lucide-react";
import JoinDevTeamModal from "../JoinDevTeamModal";

export default function Footer() {
  const [joinDevOpen, setJoinDevOpen] = useState(false);

  return (
    <footer className="border-t border-[#D5DBEB] bg-[#F4F6FB] font-body text-[#0E1633]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-10">
        {/* Brand */}
        <a href="/" className="flex w-fit items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white">
            <Code2 size={21} />
          </div>

          <div>
            <p className="font-display text-lg font-bold leading-none">
              Build-Mate
            </p>
            <p className="mt-1 text-xs text-[#5B6584]">
              Team Build-Mate
            </p>
          </div>
        </a>

        {/* Links */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#5B6584]">
          <button
            type="button"
            onClick={() => setJoinDevOpen(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-[#2342F5] hover:underline"
          >
            <Users size={15} />
            Join Development Team
          </button>
          <a href="/#mobile-app" className="inline-flex items-center gap-1 font-semibold text-[#2342F5] hover:underline">
            📱 Mobile App (Coming Soon)
          </a>
          <a href="/ideas" className="transition hover:text-[#2342F5]">
            Explore Ideas
          </a>
          <a href="/register" className="transition hover:text-[#2342F5]">
            Get Started
          </a>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition hover:text-[#2342F5]"
          >
            LinkedIn <ArrowUpRight size={14} />
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-[#5B6584]">
          © 2026 Build-Mate · Team Build-Mate
        </p>
      </div>

      <JoinDevTeamModal isOpen={joinDevOpen} onClose={() => setJoinDevOpen(false)} />
    </footer>
  );
}