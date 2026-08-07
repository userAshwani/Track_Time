"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard?view=today", label: "Today", icon: Clock3 },
  { href: "/dashboard?view=week", label: "Weekly Plan", icon: CalendarDays },
  { href: "/dashboard?view=completed", label: "Completed", icon: CheckCircle2 },
  { href: "/dashboard?view=health", label: "Account Health", icon: Activity },
];

export default function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-white shadow-sm">
        <div className="flex h-full min-h-screen flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white">
                TT
              </div>
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

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split("?")[0] && item.href === "/dashboard";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-50 text-slate-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
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

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{user.email}</p>
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
        </div>
      </aside>

      <div className="min-w-0 bg-slate-50">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Modern SaaS Corporate Workspace
              </p>
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                Free stack
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
