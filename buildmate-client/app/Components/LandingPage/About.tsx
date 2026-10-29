
"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Lightbulb,
  Code2,
  ArrowUpRight,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    number: "01",
    title: "Share Your Ideas",
    description:
      "Have an idea for a hackathon, startup, or side project? Share it and find people who want to make it happen.",
  },
  {
    icon: Users,
    number: "02",
    title: "Find Your Team",
    description:
      "Discover potential teammates based on their skills, interests, and the roles your project needs.",
  },
  {
    icon: Code2,
    number: "03",
    title: "Build Together",
    description:
      "Bring different talents together, collaborate on meaningful projects, and turn concepts into real products.",
  },
];

export default function About() {
  const reduce = useReducedMotion();

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-white px-4 py-14 text-[#0E1633] sm:px-6 sm:py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-[#F4F6FB] px-3.5 py-1.5 text-xs sm:text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#2342F5]" />
            About Build-Mate
          </span>

          <h2 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-6xl">
            Great projects start with{" "}
            <span className="text-[#2342F5]">the right people.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#5B6584] sm:text-lg sm:leading-8">
            Build-Mate helps students find project partners, bring ideas
            to life, and build beyond the classroom.
          </p>
        </motion.div>

        {/* About Story */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2342F5]">
              Built for student builders
            </p>

            <h3 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Stop searching for teammates. Start building your vision.
            </h3>

            <p className="mt-5 leading-8 text-[#5B6584]">
              Finding the right people for a project can be difficult.
              You may have a great idea but need a developer, a designer,
              or someone who shares your vision.
            </p>

            <p className="mt-4 leading-8 text-[#5B6584]">
              Build-Mate brings project ideas and student talent together
              in one place, making it easier to discover opportunities,
              connect with potential collaborators, and form teams.
            </p>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-[#D5DBEB] bg-[#F4F6FB] p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0E1633] text-white">
                <Target size={23} />
              </div>

              <div>
                <h4 className="font-semibold">Our mission</h4>
                <p className="mt-1 text-sm leading-6 text-[#5B6584]">
                  Help students turn individual ideas into collaborative
                  projects by connecting the right people and skills.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.number}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.12,
                  }}
                  className="group rounded-2xl border border-[#D5DBEB] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#AAB8FF] hover:shadow-xl hover:shadow-[#0E1633]/[0.06] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5] transition group-hover:bg-[#2342F5] group-hover:text-white">
                      <Icon size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-lg font-semibold">
                          {feature.title}
                        </h4>

                        <span className="font-display text-sm font-semibold text-[#9AA4C0]">
                          {feature.number}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-[#5B6584]">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <ArrowUpRight
                      size={18}
                      className="text-[#9AA4C0] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2342F5]"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
