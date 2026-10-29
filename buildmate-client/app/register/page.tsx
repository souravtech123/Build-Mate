"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Check,
  Eye,
  EyeOff,
  Lightbulb,
  Users,
  Zap,
  AlertCircle,
  Loader2,
  Mail,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { registerUser, verifyOTP, resendOTP } from "../lib/auth";

const skills = [
  "Frontend",
  "Backend",
  "UI/UX Design",
  "AI / ML",
  "Mobile Development",
  "DevOps",
  "Product Management",
  "Marketing",
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const reduce = useReducedMotion();

  // Step 1: form, Step 2: otp
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
  });

  // OTP states
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill]
    );
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!acceptedTerms) {
      setErrorMsg("Please accept the Terms of Service to continue.");
      return;
    }

    if (selectedSkills.length === 0) {
      setErrorMsg("Please select at least one skill or area of interest.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        skills: selectedSkills,
      });

      if (!result.success && !result.token) {
        setErrorMsg(
          result.message || "Failed to create account. Please try again."
        );
        return;
      }

      // Successfully registered and logged in! Redirect to dashboard/target
      router.push(redirectPath === "/" ? "/dashboard" : redirectPath);
    } catch {
      setErrorMsg("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const newOtp = [...otpValues];

    if (cleaned.length > 1) {
      // Paste handling
      const digits = cleaned.slice(0, 6).split("");
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpValues(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtpValues(newOtp);
    setErrorMsg("");

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const result = await verifyOTP({
        email: form.email,
        otp: otpCode,
      });

      if (!result.success) {
        setErrorMsg(result.message || "Invalid or expired verification code.");
        return;
      }

      // Verified and logged in! Redirect to destination
      router.push(redirectPath);
    } catch {
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await resendOTP({ email: form.email });
      if (result.success) {
        setSuccessMsg("A new code has been sent to your email.");
        setResendCooldown(45);
        setOtpValues(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(result.message || "Failed to resend code.");
      }
    } catch {
      setErrorMsg("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#F4F6FB] font-body text-[#0E1633]"
      style={{
        backgroundImage:
          "linear-gradient(#E3E8F4 1px, transparent 1px), linear-gradient(90deg, #E3E8F4 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Header */}
      <header className="relative z-10 border-b border-[#D5DBEB] bg-[#F4F6FB]/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2342F5] text-white shadow-md shadow-[#2342F5]/20">
              <Code2 size={22} />
            </div>

            <div>
              <span className="block font-display text-lg font-bold leading-tight">
                Build-Mate
              </span>
              <span className="block text-xs text-[#5B6584]">
                Team Build-Mate
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B6584] transition hover:text-[#2342F5]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </nav>
      </header>

      {/* Registration / OTP content */}
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Left: Product introduction */}
        <motion.section
          initial={reduce ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="hidden lg:block"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-4 py-2 text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
            Built for student builders
          </span>

          <h1 className="mt-7 font-display text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
            Your next idea deserves a{" "}
            <span className="text-[#2342F5]">great team.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#4A5473]">
            Join Build-Mate to connect with students who share your interests,
            discover project opportunities, and build something meaningful
            together.
          </p>

          <div className="mt-10 space-y-6">
            {[
              {
                icon: Users,
                title: "Find your people",
                text: "Connect with developers, designers, and other student builders.",
              },
              {
                icon: Lightbulb,
                title: "Turn ideas into products",
                text: "Work on side projects, hackathons, and portfolio-worthy applications.",
              },
              {
                icon: Zap,
                title: "Learn by building",
                text: "Develop practical skills through collaboration and real projects.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D5DBEB] bg-white text-[#2342F5]">
                    <Icon size={21} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#0E1633]">
                      {item.title}
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-6 text-[#5B6584]">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* XTS identity card */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#2342F5]">
                <Code2 size={22} />
              </div>

              <div>
                <p className="font-display font-bold">Xavier TechByte Society</p>
                <p className="mt-1 text-sm text-[#5B6584]">
                  St. Xavier&apos;s College, Ranchi
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#E3E8F4] pt-4">
              <p className="text-sm leading-7 text-[#5B6584]">
                <span className="font-semibold text-[#2342F5]">
                  Learn. Build. Ship. Repeat.
                </span>{" "}
                We believe the best projects are built by people who share an
                idea and work together to make it real.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Right Panel: Step 1 (Register) or Step 2 (OTP) */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.1 }}
          className="mx-auto w-full max-w-xl"
        >
          {step === "otp" ? (
            /* STEP 2: OTP VERIFICATION */
            <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(14,22,51,0.35)] sm:p-9">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2342F5]/20 bg-[#2342F5]/[0.08] text-[#2342F5]">
                <Mail size={26} />
              </div>

              <div className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1FF] px-3 py-1.5 text-xs font-semibold text-[#2342F5]">
                  <ShieldCheck size={14} />
                  EMAIL VERIFICATION
                </span>

                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#0E1633]">
                  Enter the 6-digit code.
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#5B6584]">
                  We sent a verification code to{" "}
                  <strong className="text-[#0E1633]">{form.email}</strong>.
                  Please enter it below to activate your account.
                </p>
              </div>

              {/* Success message */}
              {successMsg && (
                <div
                  role="status"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error message */}
              {errorMsg && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6 OTP Inputs */}
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="h-14 w-12 sm:w-14 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] text-center text-2xl font-bold text-[#0E1633] outline-none transition focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                    />
                  ))}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || otpValues.join("").length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-5 py-4 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Activate Account
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Resend and Edit Email Actions */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#E8ECF5] pt-6 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2342F5] transition hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resending && <Loader2 size={13} className="animate-spin" />}
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend verification code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-[#5B6584] hover:text-[#0E1633] transition"
                >
                  Edit details / change email
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: REGISTRATION FORM */
            <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(14,22,51,0.35)] sm:p-9">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1FF] px-3 py-1.5 text-xs font-semibold text-[#2342F5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2342F5]" />
                  YOUR JOURNEY STARTS HERE
                </span>

                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Create your account.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5B6584]">
                  Tell us a little about yourself and verify your email to start building with
                  Build-Mate.
                </p>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#929BB2] focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    College email
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#929BB2] focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-[#7B85A0]">
                    Use your college or personal email address.
                  </p>
                </div>

                {/* College */}
                <div>
                  <label
                    htmlFor="college"
                    className="mb-2 block text-sm font-semibold"
                  >
                    College / Institution
                  </label>

                  <input
                    id="college"
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. St. Xavier's College, Ranchi"
                    value={form.college}
                    onChange={(e) => updateField("college", e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-4 py-3.5 text-sm outline-none transition placeholder:text-[#929BB2] focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-[#D5DBEB] bg-[#F9FAFD] px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-[#929BB2] focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B85A0] transition hover:text-[#2342F5]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#7B85A0]">
                    Use at least 6 characters.
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold">
                      What are your skills & interests?
                    </label>

                    <span className="shrink-0 rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-medium text-[#2342F5]">
                      {selectedSkills.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => {
                      const selected = selectedSkills.includes(skill);

                      return (
                        <button
                          key={skill}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleSkill(skill)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5] ${
                            selected
                              ? "border-[#2342F5] bg-[#EEF1FF] text-[#2342F5]"
                              : "border-[#D5DBEB] bg-white text-[#5B6584] hover:border-[#AEBBFF] hover:bg-[#F9FAFD]"
                          }`}
                        >
                          {selected && <Check size={13} />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      setErrorMsg("");
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#2342F5]"
                  />

                  <span className="text-xs leading-6 text-[#7B85A0]">
                    I agree to the Terms of Service and Privacy Policy.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-[#5B6584]">
                Already have an account?{" "}
                <Link
                  href={`/login${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                  className="font-semibold text-[#2342F5] transition hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-[#7B85A0]">
            Built for student builders · Made for collaboration
          </p>
        </motion.section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <Loader2 size={24} className="animate-spin text-[#2342F5]" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
