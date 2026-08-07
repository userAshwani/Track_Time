/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
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

function GlassCard({ icon: Icon, label, value, helper, className = "" }) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70">
          Live
        </span>
      </div>
      <p className="mt-5 text-sm font-bold text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{helper}</p>
    </div>
  );
}

function OtpInput({ value, onChange, onComplete, disabled }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  function updateDigit(index, nextValue) {
    const cleaned = nextValue.replace(/\D/g, "");

    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
      return;
    }

    const nextDigits = [...digits];
    cleaned
      .slice(0, 6 - index)
      .split("")
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

    const nextCode = nextDigits.join("").slice(0, 6);
    onChange(nextCode);

    const nextIndex = Math.min(index + cleaned.length, 5);
    inputsRef.current[nextIndex]?.focus();

    if (nextCode.length === 6) {
      onComplete(nextCode);
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pasted) {
      return;
    }

    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, 6) - 1]?.focus();

    if (pasted.length === 6) {
      onComplete(pasted);
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          data-otp-index={index}
          value={digit}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          className="h-14 rounded-2xl border border-slate-300 bg-white text-center text-2xl font-black text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const lastSubmittedOtp = useRef("");
  const [authMode, setAuthMode] = useState("otp");
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setMessage("OTP sent. Check your inbox and enter the 6 digit code.");
      setTimeout(() => document.querySelector("[data-otp-index='0']")?.focus(), 0);
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loginWithPassword(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to sign in.");
      }

      router.replace("/dashboard");
    } catch (loginError) {
      setError(loginError.message);
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

  function handleGoogle() {
    setMessage("Google sign-in button is ready. Add Firebase credentials to connect it.");
    setError("");
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white text-slate-950">
      <section className="flex h-screen w-full items-center justify-center bg-white px-5 py-5 lg:w-[46%]">
        <div className="w-full max-w-[440px]">
          <Link href="/" className="inline-flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo" className="mb-8 h-10 w-auto" />
            <span className="mb-8 text-sm font-black uppercase tracking-[0.28em] text-emerald-700">
              Track Time
            </span>
          </Link>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              Secure workspace access
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              {step === "otp"
                ? "Verify your email."
                : authMode === "password"
                  ? "Login with password."
                  : "Login or register."}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-500">
              {step === "otp"
                ? `Enter the code sent to ${email}. Verification completes automatically on the sixth digit.`
                : authMode === "password"
                  ? "Use your admin password or a password saved from your profile."
                  : "Continue with email OTP. If the account is new, Track Time creates it after verification."}
            </p>
          </div>

          <div className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80">
            {step === "otp" ? (
              <form onSubmit={(event) => event.preventDefault()}>
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                  <Mail className="h-5 w-5 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                      Verification email
                    </p>
                    <p className="truncate text-sm font-bold text-slate-700">{email}</p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    6 digit security code
                  </span>
                  <div className="mt-3">
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      onComplete={verifyOtpCode}
                      disabled={isSubmitting}
                    />
                  </div>
                </label>

                <button
                  type="button"
                  disabled={isSubmitting || otp.length !== 6}
                  onClick={() => verifyOtpCode(otp)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-500 transition hover:text-emerald-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to edit email
                </button>
              </form>
            ) : authMode === "password" ? (
              <form onSubmit={loginWithPassword}>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="admin@gmail.com"
                    required
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-slate-700">Password</span>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isSubmitting ? "Signing in" : "Login with Password"}
                  <LockKeyhole className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setPassword("");
                    setError("");
                    setMessage("");
                  }}
                  className="mt-4 w-full text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
                >
                  Use email OTP instead
                </button>
              </form>
            ) : (
              <form onSubmit={sendOtp}>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isSubmitting ? "Sending OTP" : "Continue with Email"}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="my-5 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <GoogleLogo />
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("password");
                    setError("");
                    setMessage("");
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-500 transition hover:text-emerald-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Login with password
                </button>
              </form>
            )}

            {message ? (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative hidden h-screen flex-1 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 px-10 py-10 text-white lg:block">
        <div className="absolute left-[-12rem] top-[-12rem] h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-emerald-200 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              Enterprise-grade time command
            </div>
            <h2 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight xl:text-6xl">
              Turn scattered work into visible execution horizons.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Track daily focus, weekly commitments, and annual goals from one
              crisp operating cockpit with secure email access.
            </p>
          </div>

          <div className="mt-10 grid max-w-4xl grid-cols-12 gap-5">
            <GlassCard
              icon={BarChart3}
              label="Daily Focus"
              value="12 tasks"
              helper="Immediate work, measurable progress, clear reminders."
              className="col-span-7"
            />
            <GlassCard
              icon={CalendarDays}
              label="Weekly Commitments"
              value="38 hours"
              helper="Commitment windows your team can review and trust."
              className="col-span-5 translate-y-8"
            />
            <GlassCard
              icon={Target}
              label="Annual Goals"
              value="4 goals"
              helper="Long-range priorities connected to the work happening today."
              className="col-span-6 translate-x-16"
            />
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-3 overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/10 backdrop-blur-md">
            {["Secure OTP", "Free stack", "Admin ready"].map((item) => (
              <div key={item} className="border-r border-white/10 p-5 last:border-r-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <p className="mt-2 text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
