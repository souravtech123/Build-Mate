"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Mail,
  ShieldCheck,
  Check,
} from "lucide-react";
import { loginUser, verifyOTP, resendOTP } from "../lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const reduce = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // OTP verification state if unverified
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!requiresOtp || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [requiresOtp, resendCooldown]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const result = await loginUser({
        email: form.email,
        password: form.password,
      });

      if (!result.success) {
        if (result.requires_verification) {
          setRequiresOtp(true);
          setSuccessMsg(
            result.message || "A verification code has been sent to your email."
          );
          setResendCooldown(30);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
          return;
        }

        setErrorMsg(
          result.message || "Invalid email or password. Please try again."
        );
        return;
      }

      router.push(redirectPath);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const newOtp = [...otpValues];
    if (cleaned.length > 1) {
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
      setErrorMsg("Please enter the full 6-digit code.");
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
        setErrorMsg(result.message || "Verification code is invalid or expired.");
        return;
      }

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
      {/* Navbar */}
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

      {/* Login content */}
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-6 py-12 md:px-10 lg:grid-cols-2 lg:gap-20">
        {/* Left panel */}
        <motion.section
          initial={reduce ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="hidden lg:block"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5DBEB] bg-white px-4 py-2 text-sm font-medium text-[#5B6584]">
            <span className="h-2 w-2 rounded-full bg-[#FFB620]" />
            Welcome back, builder
          </span>

          <h1 className="mt-7 font-display text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
            Your next big idea is waiting for{" "}
            <span className="text-[#2342F5]">you.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#4A5473]">
            Sign in to reconnect with your teammates, explore project ideas,
            and continue building something meaningful with Build-Mate.
          </p>

          {/* Benefits */}
          <div className="mt-10 space-y-6">
            {[
              {
                number: "01",
                title: "Pick up where you left off",
                description:
                  "Continue working on your projects and team collaborations.",
              },
              {
                number: "02",
                title: "Discover new opportunities",
                description:
                  "Explore ideas and find people with complementary skills.",
              },
              {
                number: "03",
                title: "Keep building your future",
                description:
                  "Turn your learning into real-world projects and experience.",
              },
            ].map((item) => (
              <div key={item.number} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D5DBEB] bg-white font-display text-sm font-bold text-[#2342F5]">
                  {item.number}
                </span>

                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 max-w-md text-sm leading-6 text-[#5B6584]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Brand card */}
          <div className="mt-12 rounded-2xl border border-[#D5DBEB] bg-white p-6 shadow-sm">
            <p className="font-display text-xl font-bold">
              Built by students.{" "}
              <span className="text-[#2342F5]">Driven by ideas.</span>
            </p>

            <p className="mt-3 text-sm leading-7 text-[#5B6584]">
              Build-Mate is built by Xavier TechByte Society at St. Xavier&apos;s
              College, Ranchi, to help student builders find their people.
            </p>
          </div>
        </motion.section>

        {/* Login form or OTP Form */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.1 }}
          className="mx-auto w-full max-w-md"
        >
          {requiresOtp ? (
            /* OTP VERIFICATION VIEW ON LOGIN */
            <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(14,22,51,0.35)] sm:p-9">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2342F5]/20 bg-[#2342F5]/[0.08] text-[#2342F5]">
                <Mail size={26} />
              </div>

              <div className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1FF] px-3 py-1.5 text-xs font-semibold text-[#2342F5]">
                  <ShieldCheck size={14} />
                  EMAIL VERIFICATION NEEDED
                </span>

                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#0E1633]">
                  Verify your account.
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#5B6584]">
                  Please enter the 6-digit verification code sent to{" "}
                  <strong className="text-[#0E1633]">{form.email}</strong>.
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

              {/* Error */}
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
                      className="h-14 w-11 sm:w-13 rounded-2xl border border-[#D5DBEB] bg-[#F8FAFF] text-center text-2xl font-bold text-[#0E1633] outline-none transition focus:border-[#2342F5] focus:bg-white focus:ring-4 focus:ring-[#2342F5]/10"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpValues.join("").length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-5 py-4 text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#E8ECF5] pt-6 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="text-xs font-semibold text-[#2342F5] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resending && <Loader2 size={13} className="animate-spin" />}
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiresOtp(false);
                    setErrorMsg("");
                  }}
                  className="text-xs text-[#5B6584] hover:text-[#0E1633]"
                >
                  Back to login
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD LOGIN FORM */
            <div className="rounded-3xl border border-[#D5DBEB] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(14,22,51,0.35)] sm:p-9">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF1FF] px-3 py-1.5 text-xs font-semibold text-[#2342F5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2342F5]" />
                  WELCOME BACK
                </span>

                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Sign in.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5B6584]">
                  Enter your credentials to access your account, projects, and dashboard.
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Email address
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
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setErrorMsg("Password reset will be available soon.")
                      }
                      className="text-xs font-medium text-[#2342F5] transition hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required
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
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2342F5] px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#2342F5]/20 transition hover:bg-[#1A33C9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2342F5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-[#5B6584]">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/register${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                  className="font-semibold text-[#2342F5] transition hover:underline"
                >
                  Create account
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <Loader2 size={24} className="animate-spin text-[#2342F5]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
