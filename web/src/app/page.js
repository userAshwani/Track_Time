import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Flag,
  Target,
} from "lucide-react";

const features = [
  {
    title: "Daily Focus",
    description: "Plan the next execution window with clear priorities and tracked minutes.",
    icon: Clock3,
  },
  {
    title: "Weekly Commitments",
    description: "Group tactical work into visible weekly outcomes your team can trust.",
    icon: CalendarCheck,
  },
  {
    title: "Monthly Targets",
    description: "Measure delivery momentum across projects, alarms, and allocated time.",
    icon: Target,
  },
  {
    title: "Annual Goals",
    description: "Keep long-range objectives visible while daily execution keeps moving.",
    icon: Flag,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white">
              TT
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-950">
              Track Time
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-slate-900">
              Features
            </a>
            <a href="#horizons" className="transition hover:text-slate-900">
              Horizons
            </a>
            <a href="#free" className="transition hover:text-slate-900">
              Free
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Login / Get Started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-50">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              Free time horizon management
            </p>
            <h1 className="mt-7 max-w-4xl text-6xl font-bold leading-[1.02] tracking-tight text-slate-950 md:text-7xl">
              Master Your Time Horizons.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-500">
              Track tasks across daily focus, weekly commitments, monthly
              targets, and annual goals with clean dashboards and email-based
              secure access.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                Start Tracking for Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    Execution readiness
                  </p>
                  <p className="mt-2 text-5xl font-bold">84%</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200">
                  Healthy
                </span>
              </div>
              <div className="mt-8 h-3 rounded-full bg-white/10">
                <div className="h-3 w-[84%] rounded-full bg-emerald-400" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {["1 Day", "1 Week", "1 Month", "1 Year"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <p className="mt-4 text-lg font-bold">{item}</p>
                    <p className="mt-1 text-sm text-slate-300">Active horizon</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
              Core features
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Built around the way execution actually happens.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="free" className="bg-slate-50 px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">
              Start with the free stack.
            </h2>
            <p className="mt-2 text-base text-slate-500">
              No paid cache service required. Deploy the web app, add your
              MongoDB and SMTP variables, and begin tracking.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Start Tracking for Free
          </Link>
        </div>
      </section>
    </main>
  );
}
