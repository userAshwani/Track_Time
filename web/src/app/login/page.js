"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const LOGO_URL = "https://ashwanitiwari.com/logo.png";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function LogoMark({ className = "h-11 w-11" }) {
  return (
    <span
      aria-label="Track Time"
      role="img"
      className={`${className} block rounded-2xl bg-white bg-contain bg-center bg-no-repeat shadow-sm`}
      style={{ backgroundImage: `url(${LOGO_URL})` }}
    />
  );
}

function OtpBoxes({ value }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`flex h-14 items-center justify-center rounded-2xl border text-xl font-bold shadow-sm transition ${
            value[index]
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-300"
          }`}
        >
          {value[index] || ""}
        </div>
      ))}
    </div>
  );
}

function FloatingCard({ icon: Icon, title, value, meta, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          {meta}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-white/70">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const lastSubmittedOtp = useRef("");
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function sendOtp(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to send OTP.");
      }

      setStep("otp");
      setMessage("A 6-digit OTP has been sent to your email.");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtpCode(code) {
    if (isSubmitting || code.length !== 6 || lastSubmittedOtp.current === code) {
      return;
    }

    lastSubmittedOtp.current = code;
    setIsSubmitting(true);
    setError("");
    setMessage("Verifying secure code...");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        lastSubmittedOtp.current = "";
        throw new Error(payload.error || "Unable to verify OTP.");
      }

      router.replace("/dashboard");
    } catch (verifyError) {
      setError(verifyError.message);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function verifyOtp(event) {
    event.preventDefault();
    verifyOtpCode(otp);
  }

  function handleOtpChange(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);

    if (step === "otp" && value.length === 6) {
      setTimeout(() => {
        verifyOtpCode(value);
      }, 0);
    }
  }

  function handleGoogle() {
    setMessage("Google sign-in is prepared for Firebase. Add credentials to enable it.");
    setError("");
  }

  return (
    <main className="h-screen overflow-hidden bg-white text-slate-900">
      <div className="grid h-screen lg:grid-cols-[0.86fr_1.14fr]">
        <section className="flex h-screen items-center justify-center bg-white px-6 py-6 sm:px-10">
          <div className="w-full max-w-[430px]">
            <Link href="/" className="inline-flex items-center gap-3">
              <LogoMark />
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Track Time
              </span>
            </Link>

            <div className="mt-8">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                {step === "email" ? "Sign in beautifully." : "Enter your secure code."}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                {step === "email"
                  ? "Use your email to receive a secure OTP. New users are registered automatically."
                  : `We sent a one-time password to ${email}.`}
              </p>
            </div>

            <div className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80">
              {step === "email" ? (
                <form onSubmit={sendOtp}>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Email address
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isSubmitting ? "Sending OTP" : "Continue with Email"}
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <div className="my-5 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Or
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <GoogleLogo />
                    Continue with Google
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp}>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Verification email
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                      {email}
                    </p>
                  </div>

                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-slate-700">
                      6-digit OTP
                    </span>
                    <input
                      value={otp}
                      onChange={handleOtpChange}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="sr-only"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => document.querySelector("[data-otp-input]")?.focus()}
                      className="mt-2 block w-full"
                    >
                      <OtpBoxes value={otp} />
                    </button>
                    <input
                      data-otp-input
                      value={otp}
                      onChange={handleOtpChange}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Paste or type OTP"
                      maxLength={6}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isSubmitting ? "Verifying" : "Verify & Login"}
                    <ShieldCheck className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setMessage("");
                      setError("");
                      lastSubmittedOtp.current = "";
                    }}
                    className="mt-4 w-full text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                  >
                    Back to edit email
                  </button>
                </form>
              )}

              {message ? (
                <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative hidden h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-10 py-8 text-white lg:flex lg:items-center">
          <div className="absolute left-[-160px] top-[-160px] h-[360px] w-[360px] rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-[-180px] right-[-140px] h-[460px] w-[460px] rounded-full bg-teal-300/20 blur-3xl" />
          <div className="absolute right-16 top-16 h-28 w-28 rounded-full border border-white/10" />
          <div className="absolute bottom-20 left-16 h-20 w-20 rounded-3xl border border-emerald-300/20 bg-white/5 backdrop-blur" />

          <div className="relative mx-auto grid w-full max-w-5xl gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Premium execution cockpit
              </div>
              <h2 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight xl:text-6xl">
                Your time horizons, finally under control.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                A polished operating layer for daily focus, weekly commitments,
                monthly targets, annual goals, and timely reminders.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {["Free", "Secure", "Focused"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-sm font-bold text-white/85 backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px]">
              <div className="absolute left-0 top-0 w-[78%] rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-200">
                      Execution Readiness
                    </p>
                    <p className="mt-2 text-5xl font-bold">84%</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-4 py-2 text-sm font-bold text-emerald-100">
                    Healthy
                  </span>
                </div>
                <div className="mt-7 h-3 rounded-full bg-white/10">
                  <div className="h-3 w-[84%] rounded-full bg-emerald-400" />
                </div>
              </div>

              <FloatingCard
                icon={Clock3}
                title="Daily Focus"
                value="12 tasks"
                meta="Today"
                className="absolute left-6 top-48 w-[42%]"
              />
              <FloatingCard
                icon={CalendarDays}
                title="Weekly Commitments"
                value="38 hours"
                meta="Week"
                className="absolute right-0 top-36 w-[48%]"
              />
              <FloatingCard
                icon={Target}
                title="Monthly Targets"
                value="86%"
                meta="Month"
                className="absolute bottom-24 left-0 w-[46%]"
              />
              <FloatingCard
                icon={Bell}
                title="Smart Alarms"
                value="7 live"
                meta="Notify"
                className="absolute bottom-0 right-8 w-[45%]"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
