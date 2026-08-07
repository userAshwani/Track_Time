"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestOtp() {
    const response = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Unable to send OTP.");
    }

    setOtpSent(true);
    setMessage("OTP sent. Check your Gmail inbox.");
  }

  async function verifyOtp() {
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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "password") {
        await requestOtp();
        setMode("otp");
        return;
      }

      if (!otpSent) {
        await requestOtp();
        return;
      }

      await verifyOtp();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center bg-white px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                Track Time
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Sign in with your email. New users are automatically registered
                after OTP verification.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={otpSent}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
                  placeholder="you@example.com"
                  required
                />
              </label>

              {mode === "password" ? (
                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-700">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Use OTP for passwordless login"
                  />
                </label>
              ) : null}

              {mode === "otp" ? (
                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-700">
                    Email OTP
                  </span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="000000"
                    required
                  />
                </label>
              ) : null}

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode("otp");
                    setMessage("");
                    setError("");
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Use OTP instead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("otp");
                    setMessage("Enter your email and request an OTP to recover access.");
                    setError("");
                  }}
                  className="font-semibold text-slate-500 hover:text-slate-700"
                >
                  Forgot password?
                </button>
              </div>

              {message ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {isSubmitting
                  ? "Please wait"
                  : mode === "otp" && otpSent
                    ? "Verify OTP"
                    : "Continue"}
              </button>

              {mode === "otp" && otpSent ? (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setEmail("");
                    setMode("password");
                    setMessage("");
                    setError("");
                  }}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Change email
                </button>
              ) : null}
            </form>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-10 py-12 lg:block">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Modern execution control
              </p>
              <h2 className="mt-5 max-w-2xl text-5xl font-bold leading-tight tracking-tight text-slate-900">
                Verified tasks and execution horizons
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
                Plan daily work, weekly commitments, monthly targets, and annual
                outcomes from a clean enterprise dashboard.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Execution Readiness
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">84%</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                    Healthy
                  </div>
                </div>
                <div className="mt-5 h-3 rounded-full bg-slate-100">
                  <div className="h-3 w-[84%] rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <MetricCard label="Today" value="12" accent="text-emerald-600" />
                <MetricCard label="Week" value="38" accent="text-slate-900" />
                <MetricCard label="Alarms" value="7" accent="text-orange-500" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
