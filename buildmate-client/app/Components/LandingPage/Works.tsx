
"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Lightbulb,
  Search,
  Users,
  Rocket,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Share Your Idea",
    description:
      "Have an idea for a project, hackathon, or startup? Share what you want to build and the skills your project needs.",
    detail: "Start with an idea",
  },
  {
    number: "02",
    icon: Search,
    title: "Discover Teammates",
    description:
      "Explore project ideas and discover students with the skills and interests that match your vision.",
    detail: "Find the right people",
  },
  {
    number: "03",
    icon: Users,
    title: "Build Your Team",
    description:
      "Connect with potential collaborators, invite teammates, and bring different skills together.",
    detail: "Create your team",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Start Building",
    description:
      "Bring your team together, work on your project, and turn your idea into something real.",
    detail: "Make it happen",
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-white px-6 py-20 text-[#0E1633] md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-[#F4F6FB] px-4 py-2 text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#2342F5]" />
            How It Works
          </span>

          <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            From idea to team.
            <br />
            <span className="text-[#2342F5]">It's that simple.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#5B6584] sm:text-lg">
            Your next project starts with an idea and the right people.
            Build-Mate helps bring them together.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting line on desktop */}
          <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-[#D5DBEB] lg:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduce ? 0 : 1,
                delay: 0.2,
              }}
              className="h-full origin-left bg-[#2342F5]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  className="relative rounded-2xl border border-[#D5DBEB] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#AAB8FF] hover:shadow-xl hover:shadow-[#0E1633]/[0.05]"
                >
                  {/* Icon and number */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D5DBEB] bg-white text-[#2342F5] shadow-sm">
                      <Icon size={25} strokeWidth={1.8} />
                    </div>

                    <span className="font-display text-sm font-semibold text-[#9AA4C0]">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>

                  <p className="mt-3 min-h-[112px] text-sm leading-7 text-[#5B6584]">
                    {step.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-[#E8ECF5] pt-4 text-sm font-medium text-[#2342F5]">
                    <CheckCircle2 size={16} />
                    {step.detail}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
