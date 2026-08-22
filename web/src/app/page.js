import Link from "next/link";
import { Fraunces } from "next/font/google";
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
import InstallAppButton from "../components/InstallAppButton";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

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
    <main
      className={`${display.variable} landing min-h-screen bg-[var(--paper)] text-[var(--ink)]`}
    >
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <span className="block text-base font-bold text-[var(--ink)]">
                Track Time
              </span>
              <span className="text-xs font-semibold text-[var(--ink-dim)]">
                Built by Ashwani Developer
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink-dim)] md:flex">
            <a href="#about" className="transition hover:text-[var(--ink)]">About</a>
            <a href="#how" className="transition hover:text-[var(--ink)]">How it works</a>
            <a href="#developer" className="transition hover:text-[var(--ink)]">Developer</a>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-[var(--teal-deep)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--teal)]"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--teal)]/25 bg-[var(--teal-soft)] px-3 py-1.5 text-sm font-bold text-[var(--teal-deep)]">
            <ShieldCheck className="h-4 w-4" />
            Free, no card required
          </p>
          <h1
            className="mt-6 max-w-xl text-[2.6rem] leading-[1.08] font-medium tracking-tight text-[var(--ink)] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
          >
            Time you can actually account for.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--ink-dim)]">
            Track Time plans work across four horizons — today, this week, this
            month, this year — and tracks the minutes you actually spend against
            what you planned. One task model, no scattered notes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal-deep)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--teal)]"
            >
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] px-5 py-3 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:border-[var(--teal)]/40"
            >
              See workflow
            </a>
            <InstallAppButton />
          </div>
          <p className="mt-6 inline-flex max-w-lg items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-dim)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
            Updated continuously — new features ship free while the product is young
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4 shadow-xl shadow-[var(--ink)]/5">
          <div className="rounded-2xl bg-[var(--teal-deep)] p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--amber)]">
                  Today
                </p>
                <p
                  className="mt-1 text-2xl"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                >
                  Execution board
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                Live
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {horizons.map(([title, text, Icon]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <Icon className="h-5 w-5 text-[var(--amber)]" />
                  <p className="mt-3 font-bold">{title}</p>
                  <p className="mt-1 text-sm text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-[var(--line)] bg-[var(--paper-raised)] px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold text-[var(--teal-deep)]">About the project</p>
            <h2
              className="mt-2 max-w-sm text-3xl tracking-tight text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, textWrap: "balance" }}
            >
              Built like a practical CRM, focused only on time execution.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
              <BellRing className="h-5 w-5 text-[var(--teal)]" />
              <h3 className="mt-4 font-bold text-[var(--ink)]">Alarms included</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
                Add reminder time to tasks so execution does not depend on memory.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
              <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
              <h3 className="mt-4 font-bold text-[var(--ink)]">One task model</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
                Day, week, month, and year are filters over the same task system.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
              <Clock3 className="h-5 w-5 text-[var(--teal)]" />
              <h3 className="mt-4 font-bold text-[var(--ink)]">Start and stop timer</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
                Select a task, start tracking, stop when finished, and the CRM stores your actual work time.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
              <Layers3 className="h-5 w-5 text-[var(--teal)]" />
              <h3 className="mt-4 font-bold text-[var(--ink)]">Installable mobile CRM</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">
                Install Track Time as a web app on Android, desktop Chrome, or Edge and use it like a focused CRM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-[var(--teal-deep)]">How it works</p>
            <h2
              className="mt-2 text-3xl tracking-tight text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, textWrap: "balance" }}
            >
              Four clear steps from idea to completion.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--teal-soft)] text-sm font-bold text-[var(--teal-deep)]">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-bold text-[var(--ink)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-dim)]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="developer" className="bg-[var(--paper-raised)] px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="flex items-center gap-4">
            <LogoMark className="h-14 w-14" />
            <div>
              <p className="text-sm font-bold text-[var(--teal-deep)]">Ashwani Developer</p>
              <h2 className="text-2xl font-bold text-[var(--ink)]">
                Websites, apps, and CRM systems
              </h2>
            </div>
          </div>
          <div>
            <p className="text-sm leading-6 text-[var(--ink-dim)]">
              Ashwani Developer builds websites, mobile apps, CRM systems, and
              e-commerce solutions for startups, SMEs, and enterprises. Track
              Time follows the same practical approach: clean UI, secure access,
              role-based admin visibility, and a launch-ready Next.js backend.
            </p>
            <a
              href="https://ashwanitiwari.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--teal-deep)] transition hover:text-[var(--teal)]"
            >
              Visit ashwanitiwari.com
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-[var(--paper-raised)] px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-[var(--ink-dim)] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © 2026 Track Time. All rights reserved.</p>
          <a
            href="https://ashwanitiwari.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-bold text-[var(--ink)] transition hover:text-[var(--teal-deep)]"
          >
            <Code2 className="h-4 w-4" />
            Developed by Ashwani Developer
          </a>
        </div>
      </footer>
    </main>
  );
}
