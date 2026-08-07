import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Flag,
  ShieldCheck,
  Target,
} from "lucide-react";

const LOGO_URL = "https://ashwanitiwari.com/logo.png";

function LogoMark({ className = "h-12 w-12" }) {
  return (
    <span
      aria-label="Track Time"
      role="img"
      className={`${className} block rounded-2xl bg-white bg-contain bg-center bg-no-repeat shadow-sm`}
      style={{ backgroundImage: `url(${LOGO_URL})` }}
    />
  );
}

const features = [
  {
    title: "Daily Focus",
    description: "Convert today into a clear execution window with planned minutes and alarm visibility.",
    icon: Clock3,
  },
  {
    title: "Weekly Commitments",
    description: "Group tactical work into outcomes that are easy to review before the week slips.",
    icon: CalendarCheck,
  },
  {
    title: "Monthly Targets",
    description: "Measure delivery momentum across projects, active tasks, and time allocation.",
    icon: Target,
  },
  {
    title: "Annual Goals",
    description: "Keep long-range goals visible while daily and weekly work continues moving.",
    icon: Flag,
  },
];

function HorizonPill({ label, value, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur ${className}`}>
      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
      <p className="mt-4 text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-300">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <span className="block text-lg font-black tracking-tight text-slate-950">
                Track Time
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Execution CRM
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-slate-950">
              Features
            </a>
            <a href="#horizons" className="transition hover:text-slate-950">
              Horizons
            </a>
            <a href="#free" className="transition hover:text-slate-950">
              Free
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
          >
            Login / Get Started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-slate-50">
        <div className="absolute right-[-8rem] top-10 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute left-[-10rem] bottom-[-10rem] h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:min-h-[calc(100vh-81px)] lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Free time horizon management
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-slate-950 md:text-7xl">
              Master your time horizons with one calm command center.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600">
              Plan daily focus, weekly commitments, monthly targets, and annual
              goals with secure email access, task progress, and scheduled alarms.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                Start Tracking for Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-emerald-200" />
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200">
              <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-200">
                      Execution readiness
                    </p>
                    <p className="mt-3 text-6xl font-black">84%</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-200">
                    Healthy
                  </span>
                </div>
                <div className="mt-8 h-3 rounded-full bg-white/10">
                  <div className="h-3 w-[84%] rounded-full bg-emerald-400" />
                </div>
                <div id="horizons" className="mt-6 grid grid-cols-2 gap-4">
                  <HorizonPill label="Daily focus" value="1 Day" />
                  <HorizonPill label="Commitments" value="1 Week" />
                  <HorizonPill label="Delivery plan" value="1 Month" />
                  <HorizonPill label="Strategic goals" value="1 Year" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {["Tasks", "Progress", "Alarms"].map((item) => (
                    <div key={item} className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-bold uppercase text-slate-400">{item}</p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {item === "Tasks" ? "128" : item === "Progress" ? "76%" : "18"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-6 py-18">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                Core operating system
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                Built around real execution rhythms.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              No paid cache dependency, no bloated onboarding, just a focused
              task platform ready for Vercel and MongoDB.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-slate-950">
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
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700">
              <BellRing className="h-4 w-4" />
              Alarms included
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Start with the free stack.
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-500">
              Deploy the web app, add MongoDB and SMTP variables, then connect
              the mobile app to your Vercel URL.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Start Tracking for Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <p className="font-semibold">
              Copyright © 2026 Track Time. All rights reserved.
            </p>
          </div>
          <a
            href="https://ashwanitiwari.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-black text-slate-700 transition hover:text-emerald-700"
          >
            Developed by Ashwani Developer
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </main>
  );
}
