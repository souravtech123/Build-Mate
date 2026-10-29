
"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Lightbulb,
  Users,
  UserSearch,
  Code2,
  Handshake,
  Rocket,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Share Project Ideas",
    description:
      "Have an idea worth building? Post your concept and help others discover what you're planning to create.",
    tags: ["Ideas", "Innovation"],
    featured: true,
  },
  {
    number: "02",
    icon: UserSearch,
    title: "Discover Teammates",
    description:
      "Find students with the skills, interests, and motivation your project needs.",
    tags: ["Connect", "Discover"],
  },
  {
    number: "03",
    icon: Users,
    title: "Build Your Team",
    description:
      "Identify open roles, invite potential collaborators, and bring the right people together.",
    tags: ["Teamwork", "Collaboration"],
  },
  {
    number: "04",
    icon: Code2,
    title: "Showcase Your Skills",
    description:
      "Highlight your technical abilities and let project creators see how you can contribute.",
    tags: ["Skills", "Profile"],
  },
  {
    number: "05",
    icon: Handshake,
    title: "Collaborate on Projects",
    description:
      "Connect with like-minded builders and work together to turn ideas into meaningful projects.",
    tags: ["Community", "Building"],
  },
  {
    number: "06",
    icon: Rocket,
    title: "Bring Ideas to Life",
    description:
      "Move beyond planning, gain practical experience, and create projects with your team.",
    tags: ["Experience", "Growth"],
  },
];

export default function Features() {
  const reduce = useReducedMotion();

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#F4F6FB] px-4 py-14 text-[#0E1633] sm:px-6 sm:py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#2342F5]" />
            What You Can Do
          </span>

          <h2 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-6xl">
            Everything you need to{" "}
            <span className="text-[#2342F5]">build together.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#5B6584] sm:text-lg sm:leading-8">
            From sharing your first idea to finding the right teammates,
            Build-Mate helps you take the next step in your building journey.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.number}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.07,
                }}
                className={`group relative flex flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:border-[#AAB8FF] hover:shadow-xl hover:shadow-[#0E1633]/[0.06] sm:p-7 ${
                  feature.featured
                    ? "border-[#C7D1FF] bg-white"
                    : "border-[#D5DBEB] bg-white"
                }`}
              >
                {/* Number and Icon */}
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition duration-300 ${
                      feature.featured
                        ? "bg-[#2342F5] text-white"
                        : "bg-[#EEF1FF] text-[#2342F5] group-hover:bg-[#2342F5] group-hover:text-white"
                    }`}
                  >
                    <Icon size={23} strokeWidth={1.8} />
                  </div>

                  <span className="font-display text-sm font-semibold text-[#9AA4C0]">
                    {feature.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-[#5B6584]">
                  {feature.description}
                </p>

                {/* Feature Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[#E2E7F2] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#5B6584]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom Accent */}
                <div className="mt-6 flex items-center justify-between border-t border-[#E8ECF5] pt-4">
                  <span className="text-sm font-medium text-[#5B6584]">
                    Built for students
                  </span>

                  <ArrowUpRight
                    size={18}
                    className="text-[#9AA4C0] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2342F5]"
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
