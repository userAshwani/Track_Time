"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestOtp(event) {
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
      setMessage("OTP sent. Check your email inbox.");
    } catch (requestError) {
      setError(requestError.message);
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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
        <section className="flex items-center justify-center border-r border-slate-200 bg-white px-6 py-10">
          <div className="w-full max-w-md">
            <p className="text-sm font-black uppercase text-blue-900">
              Track Time Secure Access
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">
              Login or register with email OTP
            </h1>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              New users are created automatically after OTP verification.
              Existing users are signed into their dashboard.
            </p>

            <form
              onSubmit={step === "email" ? requestOtp : verifyOtp}
              className="mt-8 border border-slate-200 bg-slate-50 p-5"
            >
              <label className="block">
                <span className="text-xs font-black uppercase text-slate-600">
                  Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={step === "otp"}
                  className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-base font-bold outline-none focus:border-blue-900 disabled:bg-slate-100"
                  placeholder="you@example.com"
                  required
                />
              </label>

              {step === "otp" ? (
                <label className="mt-5 block">
                  <span className="text-xs font-black uppercase text-slate-600">
                    6 Digit OTP
                  </span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-blue-900"
                    placeholder="000000"
                    required
                  />
                </label>
              ) : null}

              {message ? (
                <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-blue-950 px-5 py-3 text-base font-black text-white disabled:bg-slate-400"
              >
                {isSubmitting
                  ? "Please wait"
                  : step === "email"
                    ? "Send OTP"
                    : "Verify and continue"}
              </button>

              {step === "otp" ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                  className="mt-3 w-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-blue-950"
                >
                  Change email
                </button>
              ) : null}
            </form>
          </div>
        </section>

        <section className="hidden bg-blue-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-blue-200">
              Enterprise Control Plane
            </p>
            <h2 className="mt-4 max-w-3xl text-5xl font-black leading-tight">
              Govern tasks, alarms, sessions, and execution horizons from one
              trusted platform.
            </h2>
          </div>

          <div className="grid grid-cols-3 border border-blue-800 bg-blue-900">
            <div className="border-r border-blue-800 p-5">
              <p className="text-3xl font-black">4</p>
              <p className="mt-1 text-sm font-bold text-blue-100">Time horizons</p>
            </div>
            <div className="border-r border-blue-800 p-5">
              <p className="text-3xl font-black">OTP</p>
              <p className="mt-1 text-sm font-bold text-blue-100">Email access</p>
            </div>
            <div className="p-5">
              <p className="text-3xl font-black">Admin</p>
              <p className="mt-1 text-sm font-bold text-blue-100">Analytics ready</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
