/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
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
    inputsRef.current[Math.min(index + cleaned.length, 5)]?.focus();

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
          className="h-12 rounded-xl border border-slate-300 bg-white text-center text-xl font-bold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
        />
      ))}
    </div>
  );
}

function PreviewCard({ icon: Icon, title, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition duration-300 hover:bg-white/15">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-300">{helper}</p>
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
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
      setMessage("OTP sent. Enter the 6 digit code from your inbox.");
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
    setMessage("Verifying code...");

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
    setMessage("Google sign-in is ready for Firebase credentials.");
    setError("");
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white text-slate-950">
      <section className="flex h-screen w-full items-center justify-center px-5 lg:w-[48%]">
        <div className="w-full max-w-[410px]">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
            <span className="text-sm font-bold tracking-[0.22em] text-emerald-700">
              TRACK TIME
            </span>
          </Link>

          <div className="mt-8">
            <p className="text-sm font-semibold text-emerald-700">
              Secure access
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {step === "otp"
                ? "Enter verification code"
                : authMode === "password"
                  ? "Login with password"
                  : "Welcome back"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {step === "otp"
                ? `We sent a 6 digit code to ${email}.`
                : authMode === "password"
                  ? "Use your admin password or a password saved from profile."
                  : "Sign in with email OTP. New accounts are created after verification."}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 transition duration-300">
            {step === "otp" ? (
              <form onSubmit={(event) => event.preventDefault()}>
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Mail className="h-4 w-4 text-emerald-700" />
                  <p className="truncate text-sm font-semibold text-slate-700">{email}</p>
                </div>

                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={verifyOtpCode}
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  disabled={isSubmitting || otp.length !== 6}
                  onClick={() => verifyOtpCode(otp)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {isSubmitting ? "Verifying" : "Verify and continue"}
                  <ShieldCheck className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                    setMessage("");
                    lastSubmittedOtp.current = "";
                  }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Edit email
                </button>
              </form>
            ) : authMode === "password" ? (
              <form onSubmit={loginWithPassword}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="admin@gmail.com"
                    required
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {isSubmitting ? "Signing in" : "Login"}
                  <LockKeyhole className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setPassword("");
                    setError("");
                    setMessage("");
                  }}
                  className="mt-4 w-full text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Use email OTP instead
                </button>
              </form>
            ) : (
              <form onSubmit={sendOtp}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {isSubmitting ? "Sending code" : "Continue with Email"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="my-5 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-bold uppercase text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
                  className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Login with password
                </button>
              </form>
            )}

            {message ? (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hidden h-screen flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white lg:flex">
        <div className="w-full max-w-[520px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
            <p className="text-sm font-semibold text-emerald-200">Track Time workspace</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Simple task planning across four horizons.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create one task, select a horizon, set planned minutes, and keep
              reminders visible from the dashboard.
            </p>
            <div className="mt-6 grid gap-3">
              <PreviewCard icon={CheckCircle2} title="Daily focus" value="12 tasks" helper="Today" />
              <PreviewCard icon={CalendarDays} title="Weekly commitments" value="38 hours" helper="This week" />
              <PreviewCard icon={Target} title="Annual goals" value="4 goals" helper="This year" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
