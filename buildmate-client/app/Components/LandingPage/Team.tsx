"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Code2, Lightbulb, Users, Zap, Sparkles } from "lucide-react";
import JoinDevTeamModal from "../JoinDevTeamModal";

const PILLARS = [
  {
    icon: Code2,
    number: "01",
    title: "Built by builders",
    description:
      "We turn ideas into working products through code, experimentation, and continuous improvement.",
  },
  {
    icon: Lightbulb,
    number: "02",
    title: "Ideas into action",
    description:
      "We believe great ideas deserve the right people, the right environment, and a chance to grow.",
  },
  {
    icon: Users,
    number: "03",
    title: "Powered by community",
    description:
      "Team Build-Mate brings student developers, designers, and problem-solvers together to create meaningful technology.",
  },
];

export default function Team() {
  const reduce = useReducedMotion();
  const [joinDevOpen, setJoinDevOpen] = useState(false);

  return (
    <section
      id="team"
      className="relative overflow-hidden bg-[#F4F6FB] font-body text-[#0E1633]"
      style={{
        backgroundImage:
          "linear-gradient(#E3E8F4 1px, transparent 1px), linear-gradient(90deg, #E3E8F4 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 md:px-10 md:py-28">
        {/* Section heading */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
            The people behind the product
          </span>

          <h2 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-6xl">
            Built by students.
            <br />
            <span className="text-[#2342F5]">Driven by ideas.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#4A5473] sm:text-lg sm:leading-8">
            Build-Mate is built by Team Build-Mate — a student-led
            tech community turning ambitious ideas into real products.
          </p>
        </motion.div>

        {/* XTS identity card */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-[#D5DBEB] bg-white shadow-[0_30px_70px_-40px_rgba(14,22,51,0.3)]"
        >
          <div className="grid md:grid-cols-[1fr_0.85fr]">
            <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#0E1633] p-8 text-white sm:p-10 md:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.10]"
                style={{
                  backgroundImage:
                    "linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-sm font-medium text-white/65">
                  A student-led tech society
                </span>
                <Zap size={20} className="text-[#FFB620]" />
              </div>

              <div className="relative z-10 mt-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Code2 size={30} className="text-[#FFB620]" />
                </div>

                <h3 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  Build-Mate<span className="text-[#FFB620]">.</span>
                </h3>

                <p className="mt-3 max-w-sm text-base leading-7 text-white/70">
                  Team Build-Mate
                  <br />
                  Open Student Collaboration & Innovation
                </p>
              </div>

              <div className="relative z-10 mt-10 flex items-center gap-2 text-sm font-medium text-white/60">
                <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
                Learn. Build. Ship. Repeat.
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2342F5]">
                Our approach
              </span>

              <h3 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                We don&apos;t just talk about technology. We build with it.
              </h3>

              <p className="mt-5 text-base leading-7 text-[#5B6584]">
                From identifying real problems to designing, developing, and
                launching software, Team Build-Mate gives students the space to collaborate,
                learn by doing, and create products that matter.
              </p>

              <div className="mt-8 border-t border-[#E3E8F4] pt-6">
                <p className="text-sm font-medium text-[#0E1633]">
                  Build-Mate is one step toward that vision.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5B6584]">
                  Helping students find their people and bring their ideas to life.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core principles */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <motion.article
                key={pillar.number}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: reduce ? 0 : index * 0.1,
                }}
                className="group rounded-2xl border border-[#D5DBEB] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#AEBBFF] hover:shadow-[0_20px_45px_-30px_rgba(35,66,245,0.4)] sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5] transition-colors group-hover:bg-[#2342F5] group-hover:text-white">
                    <Icon size={21} />
                  </div>

                  <span className="font-display text-sm font-semibold text-[#A0A9C1]">
                    / {pillar.number}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl font-semibold">
                  {pillar.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#5B6584]">
                  {pillar.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        {/* JOIN THE DEVELOPMENT TEAM CTA */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-3xl border border-[#2342F5]/30 bg-gradient-to-r from-[#EEF1FF] via-[#F4F6FB] to-white p-6 sm:p-10 shadow-lg shadow-[#2342F5]/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2342F5] px-3 py-1 text-xs font-bold text-white mb-3">
              <Sparkles size={13} />
              Open Call for Contributors
            </span>
            <h3 className="font-display text-2xl font-bold sm:text-3xl text-[#0E1633]">
              Join the Development Team and be a part of this Wonderful Project!
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5B6584]">
              Want to contribute to Build-Mate&apos;s frontend, backend, UI design, or community? We would love to have you on board!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setJoinDevOpen(true)}
              className="inline-flex justify-center items-center gap-2 rounded-xl bg-[#2342F5] px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/25 hover:bg-[#1A33C9] transition"
            >
              <Users size={15} />
              <span>Join Development Team</span>
            </button>
            <a
              href="/ideas"
              className="inline-flex justify-center items-center gap-2 rounded-xl border border-[#0E1633] bg-white px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-[#0E1633] hover:bg-[#0E1633] hover:text-white transition"
            >
              <span>Explore Ideas</span>
              <ArrowUpRight size={15} />
            </a>
          </div>
        </motion.div>
      </div>

      <JoinDevTeamModal isOpen={joinDevOpen} onClose={() => setJoinDevOpen(false)} />
    </section>
  );
}