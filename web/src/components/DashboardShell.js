"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  Settings,
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, view: "overview" },
  { href: "/dashboard?view=today", label: "Today", icon: Clock3, view: "today" },
  { href: "/dashboard?view=week", label: "Weekly Plan", icon: CalendarDays, view: "week" },
  { href: "/dashboard?view=month", label: "Monthly Targets", icon: Target, view: "month" },
  { href: "/dashboard?view=year", label: "Annual Goals", icon: ShieldCheck, view: "year" },
  { href: "/dashboard?view=completed", label: "Completed", icon: CheckCircle2, view: "completed" },
  { href: "/dashboard?view=health", label: "Account Health", icon: Activity, view: "health" },
  { href: "/dashboard?view=profile", label: "Profile Settings", icon: Settings, view: "profile" },
];

const viewTitles = {
  overview: "Dashboard",
  today: "Today",
  week: "Weekly Plan",
  month: "Monthly Targets",
  year: "Annual Goals",
  completed: "Completed Work",
  health: "Account Health",
  profile: "Profile Settings",
};

export default function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeView = searchParams.get("view") || "overview";

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[292px_1fr]">
      <aside className="hidden h-screen flex-col justify-between border-r border-slate-200 bg-white shadow-sm lg:flex">
        <div className="min-h-0">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  Track Time
                </p>
                <p className="text-sm font-medium text-slate-500">
                  Execution CRM
                </p>
              </div>
            </Link>
          </div>

          <nav className="space-y-1 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === "/dashboard" && activeView === item.view;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}

            {user.role === "superadmin" ? (
              <Link
                href="/superadmin"
                className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                Superadmin
              </Link>
            ) : null}
          </nav>

          <div className="px-4 pb-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Current plan
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                Free workspace, no paid cache
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="truncate text-sm font-bold text-slate-900">
                {user.name || user.email}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {user.email}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-col bg-slate-50">
        <header className="shrink-0 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Track Time Command Center
              </p>
              <h1 className="text-xl font-black text-slate-950">
                {viewTitles[activeView] || "Dashboard"}
              </h1>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                Free workspace
              </div>
              <Link
                href="/dashboard?view=profile"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                  {(user.name || user.email).slice(0, 2).toUpperCase()}
                </span>
                <span className="max-w-36 truncate text-sm font-bold text-slate-700">
                  {user.name || user.email}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</main>
      </div>
    </div>
  );
}
