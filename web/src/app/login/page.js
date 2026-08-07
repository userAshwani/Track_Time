"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function HorizonGlassCard({ title, value, progress, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/75">{title}</p>
        <p className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
          Live
        </p>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-white">{value}</p>
      <div className="mt-5 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-emerald-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
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
      setMessage("We sent a 6-digit OTP to your email.");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to verify OTP.");
      }

      router.replace("/dashboard");
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogle() {
    setMessage("Google sign-in UI is ready. Add Firebase credentials to enable it.");
    setError("");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-emerald-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                TT
              </span>
              Track Time
            </Link>

            <div className="mt-10">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                {step === "email" ? "Sign in to your workspace" : "Check your inbox"}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                {step === "email"
                  ? "Enter your email to receive a secure one-time password. New users are created automatically."
                  : `Enter the 6-digit code sent to ${email}.`}
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
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
                      className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isSubmitting ? "Sending OTP" : "Continue with Email"}
                  </button>

                  <div className="my-6 flex items-center gap-4">
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
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      6-digit OTP
                    </span>
                    <input
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-center text-3xl font-bold tracking-[0.35em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="000000"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isSubmitting ? "Verifying" : "Verify & Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setMessage("");
                      setError("");
                    }}
                    className="mt-4 w-full text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
                  >
                    Back to edit email
                  </button>
                </form>
              )}

              {message ? (
                <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-10 py-10 text-white lg:block">
          <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

          <div className="relative flex h-full min-h-[720px] flex-col justify-between">
            <div className="max-w-2xl pt-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
                Premium execution cockpit
              </p>
              <h2 className="mt-6 text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
                Verified tasks and execution horizons
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Move from scattered to structured: daily focus, weekly
                commitments, monthly targets, and annual goals in one polished
                operating system.
              </p>
            </div>

            <div className="relative pb-8">
              <HorizonGlassCard
                title="Today"
                value="12 tasks"
                progress={78}
                className="relative z-20 max-w-sm"
              />
              <HorizonGlassCard
                title="This Week"
                value="38 hours"
                progress={64}
                className="relative z-10 ml-24 mt-4 max-w-sm"
              />
              <div className="mt-4 grid max-w-xl grid-cols-2 gap-4">
                <HorizonGlassCard title="Month" value="86%" progress={86} />
                <HorizonGlassCard title="Year" value="4 goals" progress={52} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
