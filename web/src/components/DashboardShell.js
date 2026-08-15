"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  CalendarDays,
  FolderKanban,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import InstallAppButton from "./InstallAppButton";

const LOGO_URL = "https://ashwanitiwari.com/logo.png";

function LogoMark({ className = "h-10 w-10" }) {
  return (
    <span
      aria-label="Track Time"
      role="img"
      className={`${className} block shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat shadow-sm`}
      style={{ backgroundImage: `url(${LOGO_URL})` }}
    />
  );
}

const baseNavItems = [
  { href: "/dashboard", label: "Tasks", icon: LayoutDashboard, view: "overview" },
  { href: "/dashboard?view=tasks", label: "All Tasks", icon: CheckCircle2, view: "tasks" },
  { href: "/dashboard?view=categories", label: "Categories", icon: FolderKanban, view: "categories" },
  { href: "/dashboard?view=timer", label: "Time Tracker", icon: Clock3, view: "timer" },
  { href: "/dashboard?view=daily", label: "Daily Schedule", icon: CalendarDays, view: "daily" },
  { href: "/dashboard?view=summary", label: "Summary", icon: Activity, view: "summary" },
  { href: "/dashboard?view=profile", label: "Profile", icon: Settings, view: "profile" },
];

const viewTitles = {
  overview: "Tasks",
  tasks: "All Tasks",
  categories: "Categories",
  timer: "Time Tracker",
  daily: "Daily Schedule",
  summary: "Schedule Summary",
  completed: "Completed",
  insights: "Insights",
  health: "Insights",
  profile: "Profile",
  admin: "Admin Analytics",
};

function SidebarContent({
  compact = false,
  user,
  navItems,
  activeView,
  pathname,
  onLogout,
  onCloseMobile,
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="min-h-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            {!compact ? (
              <div className="min-w-0">
                <p className="truncate text-base font-bold tracking-tight text-slate-950">
                  Track Time
                </p>
                <p className="truncate text-xs font-medium text-slate-500">
                  Time and task CRM
                </p>
              </div>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === "/dashboard" && activeView === item.view;

            return (
              <Link
                key={item.label}
                href={item.href}
                title={compact ? item.label : undefined}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                } ${compact ? "justify-center" : ""}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                {!compact ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/dashboard?view=profile"
          title={compact ? user.email : undefined}
          className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50 ${
            compact ? "justify-center" : ""
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
            {(user.name || user.email).slice(0, 2).toUpperCase()}
          </span>
          {!compact ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-950">
                {user.name || user.email}
              </span>
              <span className="block truncate text-xs font-medium text-slate-500">
                {user.email}
              </span>
            </span>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          title={compact ? "Logout" : undefined}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 ${
            compact ? "px-2" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!compact ? "Logout" : null}
        </button>
      </div>
    </div>
  );
}

export default function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeView = searchParams.get("view") || "overview";
  const navItems =
    user.role === "superadmin"
      ? [
          ...baseNavItems,
          {
            href: "/dashboard?view=admin",
            label: "Admin Analytics",
            icon: ShieldCheck,
            view: "admin",
          },
        ]
      : baseNavItems;

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
  }

  return (
    <div
      className={`h-screen overflow-hidden bg-slate-50 text-slate-900 transition-[grid-template-columns] duration-300 lg:grid ${
        isCollapsed ? "lg:grid-cols-[78px_1fr]" : "lg:grid-cols-[280px_1fr]"
      }`}
    >
      <aside className="hidden h-screen border-r border-slate-200 bg-white lg:block">
        <SidebarContent
          compact={isCollapsed}
          user={user}
          navItems={navItems}
          activeView={activeView}
          pathname={pathname}
          onLogout={handleLogout}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <aside className="relative h-full w-[280px] translate-x-0 border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300">
            <SidebarContent
              user={user}
              navItems={navItems}
              activeView={activeView}
              pathname={pathname}
              onLogout={handleLogout}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex h-screen min-w-0 flex-col bg-slate-50">
        <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 xl:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed((current) => !current)}
                className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Track Time
                </p>
                <h1 className="truncate text-lg font-bold text-slate-950">
                  {viewTitles[activeView] || "Tasks"}
                </h1>
              </div>
            </div>

            <InstallAppButton className="hidden xl:block" />

            <Link
              href="/dashboard?view=profile"
              className="flex min-w-0 items-center gap-2 justify-self-end rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                {(user.name || user.email).slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden max-w-40 truncate text-sm font-semibold text-slate-700 sm:block">
                {user.name || user.email}
              </span>
            </Link>
          </div>
          <div className="mx-auto mt-3 max-w-7xl xl:hidden">
            <InstallAppButton />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
