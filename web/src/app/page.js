import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Layers3,
  ShieldCheck,
  Target,
} from "lucide-react";

const LOGO_URL = "https://ashwanitiwari.com/logo.png";

function LogoMark({ className = "h-11 w-11" }) {
  return (
    <span
      aria-label="Track Time"
      role="img"
      className={`${className} block rounded-xl bg-white bg-contain bg-center bg-no-repeat shadow-sm`}
      style={{ backgroundImage: `url(${LOGO_URL})` }}
    />
  );
}

const steps = [
  {
    title: "Create a task",
    text: "Write the work once, add a short outcome, and keep it visible.",
  },
  {
    title: "Choose a horizon",
    text: "Assign it to Today, Week, Month, or Year depending on the planning window.",
  },
  {
    title: "Set time and alarm",
    text: "Add planned minutes and an optional reminder so the task has a boundary.",
  },
  {
    title: "Track and close",
    text: "Add spent time, mark tasks complete, and review progress from one dashboard.",
  },
];

const horizons = [
  ["Today", "Immediate execution", Clock3],
  ["Week", "Commitments and follow-up", CalendarDays],
  ["Month", "Targets and delivery", Target],
  ["Year", "Long-range goals", Layers3],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <span className="block text-base font-bold text-slate-950">
                Track Time
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Built by Ashwani Developer
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-500 md:flex">
            <a href="#about" className="transition hover:text-slate-950">About</a>
            <a href="#how" className="transition hover:text-slate-950">How it works</a>
            <a href="#developer" className="transition hover:text-slate-950">Developer</a>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Free time and task workspace
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Plan your work by time horizon, not by scattered notes.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Track Time is a simple task management CRM for daily focus, weekly
            commitments, monthly targets, and annual goals. It is built to stay
            practical, clean, and free to run.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              See workflow
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-200">
                  Today
                </p>
                <p className="mt-1 text-3xl font-bold">Execution board</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                Live
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {horizons.map(([title, text, Icon]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 font-bold">{title}</p>
                  <p className="mt-1 text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-slate-200 bg-white px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold text-emerald-700">About the project</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Built like a practical CRM, focused only on time execution.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <BellRing className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-4 font-bold text-slate-950">Alarms included</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add reminder time to tasks so execution does not depend on memory.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-4 font-bold text-slate-950">One task model</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Day, week, month, and year are filters over the same task system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-emerald-700">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Four clear steps from idea to completion.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="developer" className="bg-white px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="flex items-center gap-4">
            <LogoMark className="h-14 w-14" />
            <div>
              <p className="text-sm font-bold text-emerald-700">Ashwani Developer</p>
              <h2 className="text-2xl font-bold text-slate-950">
                Websites, apps, and CRM systems
              </h2>
            </div>
          </div>
          <div>
            <p className="text-sm leading-6 text-slate-600">
              Ashwani Developer builds websites, mobile apps, CRM systems, and
              e-commerce solutions for startups, SMEs, and enterprises. Track
              Time follows the same practical approach: clean UI, secure access,
              role-based admin visibility, and a launch-ready Next.js backend.
            </p>
            <a
              href="https://ashwanitiwari.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              Visit ashwanitiwari.com
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © 2026 Track Time. All rights reserved.</p>
          <a
            href="https://ashwanitiwari.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-bold text-slate-700 transition hover:text-emerald-700"
          >
            <Code2 className="h-4 w-4" />
            Developed by Ashwani Developer
          </a>
        </div>
      </footer>
    </main>
  );
}
