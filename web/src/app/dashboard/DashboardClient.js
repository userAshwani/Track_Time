"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  ListChecks,
  MessageSquare,
  Play,
  Plus,
  Save,
  Square,
  Timer,
  Trash2,
  UserRound,
} from "lucide-react";
import TaskReminders from "../../components/TaskReminders";
import {
  DEFAULT_WEEKLY_DAYS,
  WEEKDAY_OPTIONS,
  dateKey,
  isTaskScheduledOnDate,
  normalizeTimeString,
  normalizeWeeklyDays,
} from "../../../lib/taskSchedule.js";

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#059669", "#047857", "#0D9488", "#14B8A6", "#16A34A", "#22C55E", "#84CC16", "#06B6D4", "#6B7280"];
const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["pending", "in_progress", "completed", "cancelled"];
const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Time is what we want most, but what we use worst.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
];

function todayString() {
  return dateKey(new Date());
}

function dateString(value) {
  return dateKey(value);
}

function localDateKey(value) {
  return dateKey(value);
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toDateInput(value) {
  return dateKey(value);
}

function toTimeInput(value, fallback = "09:00") {
  if (!value) return fallback;
  if (/^\d{2}:\d{2}$/.test(String(value))) return normalizeTimeString(value, fallback);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function hours(minutes) {
  return Math.round(((Number(minutes) || 0) / 60) * 10) / 10;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "No date";
}

function formatElapsed(totalSeconds) {
  const hoursValue = Math.floor(totalSeconds / 3600);
  const minutesValue = Math.floor((totalSeconds % 3600) / 60);
  const secondsValue = totalSeconds % 60;
  return `${hoursValue}h ${minutesValue}m ${secondsValue}s`;
}

function normalizeCategoryIdForSubmit(categoryId) {
  const value = String(categoryId || "").trim();
  return value.startsWith("demo-cat-") ? "" : value;
}

function buildMonthDays(monthDate, tasks = []) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const iso = localDateKey(day);
    days.push({
      iso,
      label: day.getDate(),
      isCurrentMonth: day.getMonth() === month,
      isToday: iso === todayString(),
      tasks: tasks.filter((task) => isTaskScheduledOnDate(task, iso) || dateString(task.dueDate) === iso || dateString(task.startDate) === iso),
    });
  }

  return days;
}

function demoDate(offsetDays = 0, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function createCodeashwaniDemoState(scheduleDate = todayString()) {
  const categories = [
    { _id: "demo-cat-js", name: "JavaScript & Frontend", color: "#059669", icon: "code" },
    { _id: "demo-cat-java", name: "Java & Backend", color: "#0F766E", icon: "server" },
    { _id: "demo-cat-cyber", name: "Cybersecurity", color: "#16A34A", icon: "shield" },
    { _id: "demo-cat-freelance", name: "Freelance Projects", color: "#10B981", icon: "briefcase" },
    { _id: "demo-cat-mnc", name: "MNC Preparation", color: "#65A30D", icon: "target" },
    { _id: "demo-cat-site", name: "AshwaniTiwari.com", color: "#0D9488", icon: "globe" },
  ];
  const byId = Object.fromEntries(categories.map((category) => [category._id, category]));
  const tasks = [
    ["demo-task-site-audit", "demo-cat-site", "Audit ashwanitiwari.com service pages", "Map website, app, CRM, ecommerce, SEO, and branding service paths into CRM follow-up tasks.", "high", "completed", -2, 2, 125],
    ["demo-task-js-dom", "demo-cat-js", "Build JavaScript DOM mini-project", "Practice form validation, fetch calls, local state, and reusable UI components.", "high", "completed", -1, 2.5, 145],
    ["demo-task-next", "demo-cat-js", "Complete React and Next.js dashboard module", "Study App Router, API routes, Mongo integration, auth guards, and production deployment.", "high", "in_progress", 0, 3, 110],
    ["demo-task-java-oop", "demo-cat-java", "Revise Java OOP and collections", "Cover inheritance, interfaces, generics, HashMap internals, streams, and exception handling.", "medium", "in_progress", 1, 2.5, 75],
    ["demo-task-spring", "demo-cat-java", "Design Spring Boot CRM API outline", "Plan entities, controllers, service layer, validation, security, and deployment notes.", "medium", "pending", 3, 3, 0],
    ["demo-task-owasp", "demo-cat-cyber", "Practice OWASP Top 10 checklist", "Review auth flaws, injection, XSS, CSRF, rate limits, secret handling, and secure headers.", "high", "in_progress", 0, 2, 70],
    ["demo-task-security-audit", "demo-cat-cyber", "Run basic security audit on portfolio forms", "Check validation, error messages, bot protection, and sensitive data exposure.", "medium", "pending", 4, 2, 0],
    ["demo-task-proposal", "demo-cat-freelance", "Send ecommerce website proposal", "Finalize scope, payment milestones, timeline, hosting plan, and maintenance package.", "high", "pending", 1, 1.5, 35],
    ["demo-task-screens", "demo-cat-freelance", "Prepare CRM demo screenshots for client", "Capture dashboard, categories, task planner, admin analytics, and feedback screen.", "high", "in_progress", 0, 1.5, 40],
    ["demo-task-dsa", "demo-cat-mnc", "Solve 8 DSA problems for product companies", "Focus on arrays, strings, hashing, sliding window, and recursion patterns.", "high", "in_progress", 0, 2.5, 95],
    ["demo-task-dbms", "demo-cat-mnc", "Revise DBMS and operating systems notes", "Transactions, indexing, normalization, processes, threads, deadlocks, and memory.", "medium", "pending", 2, 2, 0],
    ["demo-task-mock", "demo-cat-mnc", "Mock interview answer practice", "Prepare crisp stories for freelancing, learning discipline, project ownership, and problem solving.", "medium", "pending", 5, 1.5, 0],
    ["demo-task-react-query", "demo-cat-js", "Learn React Query data caching", "Practice server state, invalidation, optimistic updates, and loading states for CRM screens.", "medium", "in_progress", 2, 2, 50],
    ["demo-task-tailwind", "demo-cat-js", "Polish Tailwind responsive layout", "Improve mobile cards, dense desktop grids, spacing rhythm, and table overflow.", "medium", "pending", 4, 2, 0],
    ["demo-task-node-auth", "demo-cat-js", "Review Node.js authentication flow", "Study sessions, signed cookies, OTP mail flow, Google auth, and production env handling.", "high", "pending", 1, 2, 20],
    ["demo-task-spring-security", "demo-cat-java", "Practice Spring Security JWT module", "Build login filters, password hashing, route authorization, and refresh-token notes.", "high", "pending", 6, 3, 0],
    ["demo-task-sql", "demo-cat-java", "Solve SQL joins and indexing set", "Practice joins, grouping, subqueries, indexing tradeoffs, and query explanations.", "medium", "completed", -3, 2, 130],
    ["demo-task-linux", "demo-cat-cyber", "Linux privilege and networking lab", "Practice permissions, processes, ports, nmap basics, logs, and secure SSH settings.", "medium", "completed", -4, 2.5, 155],
    ["demo-task-burp", "demo-cat-cyber", "Burp Suite request replay practice", "Capture requests, test validation, inspect headers, and document safe findings.", "medium", "pending", 3, 2, 0],
    ["demo-task-client-call", "demo-cat-freelance", "Follow up with CRM client lead", "Send progress summary, collect requirements, confirm analytics expectations, and next milestone.", "high", "pending", 0, 1, 0],
    ["demo-task-invoice", "demo-cat-freelance", "Prepare freelance invoice template", "Create reusable invoice sections for domain, hosting, development, and support retainers.", "low", "completed", -5, 1, 60],
    ["demo-task-portfolio-case", "demo-cat-site", "Publish Track Time CRM case study", "Write problem, stack, features, screenshots, deployment, and future roadmap for ashwanitiwari.com.", "high", "in_progress", 2, 2.5, 80],
    ["demo-task-ats-resume", "demo-cat-mnc", "Update ATS resume for product roles", "Add Track Time CRM, Next.js, MongoDB, Firebase auth, and measurable outcomes.", "high", "pending", 1, 1.5, 0],
    ["demo-task-system-design", "demo-cat-mnc", "System design notes for task CRM", "Cover scaling, indexes, queues, notification workers, analytics aggregation, and caching.", "medium", "pending", 7, 3, 0],
  ].map(([id, categoryId, title, description, priority, status, offset, estimatedHours, timeSpent], index) => {
    const start = demoDate(offset, 10 + (index % 10));
    const endHour = Math.min(22, 11 + (index % 8));
    return {
      _id: id,
      categoryId,
      category: byId[categoryId],
      title,
      description,
      priority,
      status,
      startDate: start,
      dueDate: demoDate(offset + (index % 3), endHour),
      slotStart: toTimeInput(start, "09:00"),
      slotEnd: `${String(endHour).padStart(2, "0")}:00`,
      weeklyDays: [...DEFAULT_WEEKLY_DAYS],
      scheduleConfirmed: false,
      estimatedHours,
      timeAllocated: Math.round(estimatedHours * 60),
      timeSpent,
      timeLogs: [],
    };
  });
  const todayLogs = [
    ["demo-log-next", "demo-task-next", 110, "Studied routing, server APIs, and Mongo models.", 8],
    ["demo-log-java", "demo-task-java-oop", 75, "Covered collections and exception notes.", 10],
    ["demo-log-owasp", "demo-task-owasp", 70, "Reviewed injection, XSS, and auth issues.", 17],
    ["demo-log-screens", "demo-task-screens", 40, "Planned screenshots and feature order.", 15],
    ["demo-log-dsa", "demo-task-dsa", 95, "Solved arrays and hashing practice set.", 19],
  ].map(([id, taskId, durationMinutes, notes, hour]) => ({
    _id: id,
    taskId,
    task: tasks.find((task) => task._id === taskId),
    startTime: demoDate(0, hour),
    endTime: demoDate(0, hour, durationMinutes % 60),
    durationMinutes,
    notes,
  }));
  const categoryStats = categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.categoryId === category._id);
    return {
      ...category,
      tasksCount: categoryTasks.length,
      completedTasks: categoryTasks.filter((task) => task.status === "completed").length,
      totalTimeHours: hours(categoryTasks.reduce((sum, task) => sum + task.timeSpent, 0)),
    };
  });
  const dailyData = [
    { date: demoDate(-8).slice(0, 10), planned: 5, actual: 3.5, completion: 70 },
    { date: demoDate(-7).slice(0, 10), planned: 6, actual: 4.2, completion: 70 },
    { date: demoDate(-6).slice(0, 10), planned: 7, actual: 5.5, completion: 79 },
    { date: demoDate(-5).slice(0, 10), planned: 5, actual: 1, completion: 20 },
    { date: demoDate(-4).slice(0, 10), planned: 8, actual: 2.6, completion: 33 },
    { date: demoDate(-3).slice(0, 10), planned: 6, actual: 2.2, completion: 37 },
    { date: demoDate(-2).slice(0, 10), planned: 6, actual: 2.1, completion: 35 },
    { date: demoDate(-1).slice(0, 10), planned: 7, actual: 3, completion: 43 },
    { date: todayString(), planned: 8, actual: 6.5, completion: 81 },
    { date: demoDate(1).slice(0, 10), planned: 6, actual: 0, completion: 0 },
    { date: demoDate(2).slice(0, 10), planned: 7, actual: 0, completion: 0 },
  ];
  const scheduleTasks = tasks.filter((task) => isTaskScheduledOnDate(task, scheduleDate));
  const hourlyBreakdown = Array.from({ length: 14 }, (_, index) => {
    const hour = index + 7;
    const logs = todayLogs.filter((log) => new Date(log.startTime).getHours() === hour);
    const plannedTasks = scheduleTasks.filter((task) => {
      const start = Number(String(task.slotStart || "09:00").split(":")[0]);
      const end = Number(String(task.slotEnd || "10:00").split(":")[0]);
      return hour >= start && hour < Math.max(start + 1, end);
    });
    return { hour: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`, logs, plannedTasks, isEmpty: logs.length === 0 && plannedTasks.length === 0 };
  });

  return {
    tasks,
    categories: categoryStats,
    timeData: { tasks, todayLogs },
    scheduleData: {
      date: scheduleDate,
      schedule: { date: scheduleDate, plannedHours: 8, actualHours: scheduleDate === todayString() ? 6.5 : 0 },
      tasks: scheduleTasks,
      allTasks: tasks,
      hourlyBreakdown,
    },
    summary: {
      totalPlanned: dailyData.reduce((sum, day) => sum + day.planned, 0),
      totalActual: Math.round(dailyData.reduce((sum, day) => sum + day.actual, 0) * 10) / 10,
      completionRate: Math.round((dailyData.reduce((sum, day) => sum + day.actual, 0) / dailyData.reduce((sum, day) => sum + day.planned, 0)) * 100),
      tasksCompleted: tasks.filter((task) => task.status === "completed").length,
      productiveDays: dailyData.filter((day) => day.actual > 0).map((day) => ({ date: day.date, dayOfWeek: new Date(day.date).toLocaleDateString("en", { weekday: "long" }), hours: day.actual })),
      dailyData,
      dayOfWeekAverage: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
        const rows = dailyData.filter((row) => new Date(row.date).toLocaleDateString("en", { weekday: "short" }) === day);
        return { day, average: rows.length ? Math.round((rows.reduce((sum, row) => sum + row.actual, 0) / rows.length) * 10) / 10 : 0 };
      }),
    },
    adminData: {},
    loading: false,
    error: "",
  };
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300";
const subtleButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50";

function Metric({ icon: Icon, label, value, helper, color = "text-emerald-700", bg = "bg-emerald-50" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function MiniBar({ label, value, max, color = "#059669", helper }) {
  const width = max > 0 ? Math.max(4, Math.min(100, Math.round((Number(value || 0) / max) * 100))) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
        <span className="truncate">{label}</span>
        <span>{helper ?? value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function InstallPrompt() {
  const [event, setEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstall = (installEvent) => {
      installEvent.preventDefault();
      setEvent(installEvent);
    };
    const onInstalled = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!event) return;
    event.prompt();
    await event.userChoice;
    setEvent(null);
  }

  if (isInstalled || !event) return null;

  return (
    <button className={subtleButton} onClick={installApp}>
      <Download className="h-4 w-4" />
      Install app
    </button>
  );
}

function TaskForm({ categories, task, onSubmit, onCancel }) {
  const defaultDate = toDateInput(task?.startDate || task?.dueDate) || todayString();
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    categoryId: task?.categoryId || "",
    priority: task?.priority || "medium",
    status: task?.status || "pending",
    startDate: toDateInput(task?.startDate) || defaultDate,
    dueDate: toDateInput(task?.dueDate) || defaultDate,
    slotStart: toTimeInput(task?.slotStart || task?.startDate || task?.dueDate, "09:00"),
    slotEnd: toTimeInput(task?.slotEnd || task?.dueDate, "10:00"),
    weeklyDays: normalizeWeeklyDays(task?.weeklyDays),
    estimatedHours: task?.estimatedHours ?? "",
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleWeekday(day) {
    setForm((current) => {
      const exists = current.weeklyDays.includes(day);
      const weeklyDays = exists
        ? current.weeklyDays.filter((value) => value !== day)
        : [...current.weeklyDays, day].sort((a, b) => a - b);
      return { ...current, weeklyDays: weeklyDays.length ? weeklyDays : [...DEFAULT_WEEKLY_DAYS] };
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...task,
          ...form,
          categoryId: normalizeCategoryIdForSubmit(form.categoryId),
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          slotStart: form.slotStart,
          slotEnd: form.slotEnd,
          weeklyDays: normalizeWeeklyDays(form.weeklyDays),
          estimatedHours: form.estimatedHours === "" ? null : Number(form.estimatedHours),
          timeAllocated: Math.max(1, Math.round((Number(form.estimatedHours) || 1) * 60)),
          timeHorizon: "1_Day",
          isAlarmSet: true,
          scheduleConfirmed: task?.scheduleConfirmed || false,
        });
      }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(event) => update("title", event.target.value)} required />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputClass} value={form.priority} onChange={(event) => update("priority", event.target.value)}>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={(event) => update("status", event.target.value)}>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
          </select>
        </Field>
        <Field label="Start date">
          <input type="date" className={inputClass} value={form.startDate} onChange={(event) => update("startDate", event.target.value)} required />
        </Field>
        <Field label="Due date">
          <input type="date" className={inputClass} value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} required />
        </Field>
        <Field label="Work slot start">
          <input type="time" className={inputClass} value={form.slotStart} onChange={(event) => update("slotStart", event.target.value)} required />
        </Field>
        <Field label="Work slot end">
          <input type="time" className={inputClass} value={form.slotEnd} onChange={(event) => update("slotEnd", event.target.value)} required />
        </Field>
        <Field label="Estimated hours">
          <input type="number" min="0" step="0.5" className={inputClass} value={form.estimatedHours} onChange={(event) => update("estimatedHours", event.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Weekly select</span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((day) => {
            const active = form.weeklyDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Defaults to every weekday. Toggle days this task should appear on.</p>
      </div>
      <Field label="Description">
        <textarea className={inputClass} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} />
      </Field>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={primaryButton} type="submit"><Save className="h-4 w-4" />Save Task</button>
        {onCancel ? <button type="button" className={subtleButton} onClick={onCancel}>Cancel</button> : null}
      </div>
    </form>
  );
}

function TasksView({ tasks, categories, reload, timer }) {
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all", date_filter: "" });

  async function saveTask(task) {
    const isEdit = Boolean(task._id);
    const response = await fetch("/api/tasks", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: task._id, ...task } : task),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || payload.errors?.join(" ") || "Unable to save task.");
    setEditing(null);
    setShowCreate(false);
    await reload();
  }

  async function deleteTask(task) {
    await fetch(`/api/tasks?id=${task._id}`, { method: "DELETE" });
    await reload();
  }

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = !filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "all" || task.status === filters.status;
    const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const today = todayString();
    const matchesDate =
      !filters.date_filter ||
      (filters.date_filter === "today" && (isTaskScheduledOnDate(task, today) || dateString(task.dueDate) === today || dateString(task.startDate) === today)) ||
      (filters.date_filter === "week" && dueDate && (dueDate - new Date()) / 86400000 <= 7);
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]">
          <input className={inputClass} placeholder="Search tasks by title..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <select className={inputClass} value={filters.date_filter} onChange={(event) => setFilters({ ...filters, date_filter: event.target.value })}>
            <option value="">All tasks</option><option value="today">Today</option><option value="week">This week</option>
          </select>
          <select className={inputClass} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="all">All priorities</option>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">All status</option>{STATUSES.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
          </select>
          <button className={primaryButton} onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Create</button>
        </div>
      </div>
      {showCreate ? <TaskForm categories={categories} onSubmit={saveTask} onCancel={() => setShowCreate(false)} /> : null}
      <div className="space-y-3">
        {visibleTasks.map((task) => {
          const logged = hours(task.timeLogs?.reduce((sum, log) => sum + log.durationMinutes, 0) || task.timeSpent);
          const estimate = Number(task.estimatedHours) || hours(task.timeAllocated);
          const progress = estimate > 0 ? Math.min(100, Math.round((logged / estimate) * 100)) : 0;
          const isRunning = timer.activeTimer?.taskId === task._id;
          return (
            <article key={task._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              {editing?._id === task._id ? (
                <TaskForm categories={categories} task={editing} onSubmit={saveTask} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px_270px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="min-w-0 text-lg font-bold text-slate-950">{task.title}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{task.priority}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {task.category ? <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${task.category.color}20`, color: task.category.color }}>{task.category.name}</span> : null}
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{task.status.replace("_", " ")}</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{formatDate(task.startDate || task.dueDate)} → {formatDate(task.dueDate || task.startDate)}</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{normalizeTimeString(task.slotStart || toTimeInput(task.startDate || task.dueDate), "09:00")}–{normalizeTimeString(task.slotEnd || toTimeInput(task.dueDate), "10:00")}</span>
                      </div>
                      {task.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p> : null}
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>{logged}h / {estimate}h</span><span>{progress}%</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>
                    </div>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <button type="button" className={primaryButton} onClick={() => timer.startTask(task)} disabled={Boolean(timer.activeTimer) && !isRunning}><Play className="h-4 w-4" />Start</button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300" onClick={timer.stopTask} disabled={!isRunning}><Square className="h-4 w-4" />Stop</button>
                      {task.status !== "completed" ? <button className={subtleButton} onClick={() => saveTask({ ...task, status: "completed" })}><CheckCircle2 className="h-4 w-4" />Complete</button> : null}
                      <button className={subtleButton} onClick={() => setEditing(task)}>Edit</button>
                      <button className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700" onClick={() => deleteTask(task)}><Trash2 className="h-4 w-4" />Delete</button>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesView({ categories, tasks, reload }) {
  const [form, setForm] = useState({ name: "", color: COLORS[3], icon: "folder" });
  const [editing, setEditing] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const activeForm = editing || form;
  const setActiveForm = editing ? setEditing : setForm;
  const selectedCategory = categories.find((category) => category._id === selectedCategoryId);
  const selectedTasks = selectedCategoryId ? tasks.filter((task) => String(task.categoryId) === String(selectedCategoryId)) : [];

  async function saveCategory(event) {
    event.preventDefault();
    const response = await fetch("/api/categories", {
      method: editing?._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing?._id ? { id: editing._id, ...activeForm } : activeForm),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to save category.");
    setForm({ name: "", color: COLORS[3], icon: "folder" });
    setEditing(null);
    await reload();
  }

  async function deleteCategory(category) {
    const response = await fetch(`/api/categories?id=${category._id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || !payload.success) alert(payload.error || "Unable to delete category.");
    await reload();
  }

  return (
    <section className="space-y-5">
      <form onSubmit={saveCategory} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field label={editing ? "Edit category" : "Create category"}>
            <input className={inputClass} value={activeForm.name} onChange={(event) => setActiveForm({ ...activeForm, name: event.target.value })} placeholder="Work, Personal, Study..." required />
          </Field>
          <button className={primaryButton}><Save className="h-4 w-4" />Save Category</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button key={color} type="button" aria-label={color} onClick={() => setActiveForm({ ...activeForm, color })} className={`h-9 w-9 rounded-lg border-4 ${activeForm.color === color ? "border-slate-950" : "border-white"}`} style={{ backgroundColor: color }} />
          ))}
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const completion = category.tasksCount > 0 ? Math.round((category.completedTasks / category.tasksCount) * 100) : 0;
          return (
            <article key={category._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" style={{ borderTop: `4px solid ${category.color}` }}>
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.tasksCount} tasks</p>
                </div>
                <span className="h-10 w-10 rounded-lg" style={{ backgroundColor: category.color }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-3"><p className="font-bold text-emerald-700">{category.totalTimeHours}h</p><p className="text-xs text-slate-500">Time</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="font-bold text-green-700">{category.completedTasks}</p><p className="text-xs text-slate-500">Completed</p></div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${completion}%`, backgroundColor: category.color }} /></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={subtleButton} onClick={() => setSelectedCategoryId(category._id)}><Eye className="h-4 w-4" />View</button>
                <button className={subtleButton} onClick={() => setEditing(category)}>Edit</button>
                <button className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700" onClick={() => deleteCategory(category)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
      {selectedCategory ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">Category tasks</p>
              <h2 className="text-2xl font-bold" style={{ color: selectedCategory.color }}>{selectedCategory.name}</h2>
            </div>
            <button className={subtleButton} onClick={() => setSelectedCategoryId("")}>Close</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {selectedTasks.map((task) => {
              const estimate = Number(task.estimatedHours) || hours(task.timeAllocated);
              const logged = hours(task.timeSpent);
              const progress = estimate > 0 ? Math.min(100, Math.round((logged / estimate) * 100)) : 0;
              return (
                <div key={task._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-950">{task.title}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{task.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{task.description}</p>
                  <MiniBar label="Progress" value={progress} max={100} color={selectedCategory.color} helper={`${logged}h / ${estimate}h`} />
                </div>
              );
            })}
          </div>
          {selectedTasks.length === 0 ? <p className="mt-5 text-sm font-semibold text-slate-500">No tasks in this category yet.</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function TimerView({ timeData, reload, timer }) {
  const [form, setForm] = useState({ taskId: "", startTime: toLocalInput(new Date()), endTime: "", notes: "" });
  const totalToday = hours(timeData.todayLogs?.reduce((sum, log) => sum + log.durationMinutes, 0));
  const selectedTask = timeData.tasks?.find((task) => task._id === form.taskId);
  const activeTask = timeData.tasks?.find((task) => task._id === timer.activeTimer?.taskId);

  async function saveLog(event) {
    event.preventDefault();
    const start = new Date(form.startTime);
    const end = form.endTime ? new Date(form.endTime) : new Date();
    const durationMinutes = Math.max(1, Math.floor((end - start) / 60000));
    await fetch("/api/time-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, startTime: start, endTime: end, durationMinutes }),
    });
    setForm({ taskId: "", startTime: toLocalInput(new Date()), endTime: "", notes: "" });
    await reload();
  }

  async function deleteLog(log) {
    await fetch(`/api/time-logs?id=${log._id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold text-emerald-700">Live tracker</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{activeTask?.title || "Select a task and start tracking"}</h2>
            <p className="mt-1 text-sm text-slate-500">{timer.activeTimer ? `Running for ${formatElapsed(timer.elapsedSeconds)}` : "Track actual work time directly from this CRM."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => selectedTask && timer.startTask(selectedTask)} disabled={!selectedTask || Boolean(timer.activeTimer)}><Play className="h-4 w-4" />Start</button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300" onClick={timer.stopTask} disabled={!timer.activeTimer}><Square className="h-4 w-4" />Stop</button>
            <a href="/api/time-logs/export" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50" title="Download every logged time entry as a CSV, ready for client invoicing"><Download className="h-4 w-4" />Export CSV</a>
          </div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_0.8fr_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Choose Task</h2>
        <div className="mt-4 max-h-[540px] space-y-2 overflow-y-auto">
          {timeData.tasks?.map((task) => {
            const isRunning = timer.activeTimer?.taskId === task._id;
            return (
              <button key={task._id} type="button" onClick={() => setForm((current) => ({ ...current, taskId: task._id }))} className={`w-full rounded-lg border p-3 text-left transition ${form.taskId === task._id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{task.category?.name || "No category"} - {task.status.replace("_", " ")}</p>
                  </div>
                  {isRunning ? <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Running</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <form onSubmit={saveLog} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Manual Time Entry</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Task">
            <select className={inputClass} value={form.taskId} onChange={(event) => setForm({ ...form, taskId: event.target.value })} required>
              <option value="">Choose a task</option>
              {timeData.tasks?.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
            </select>
          </Field>
          <Field label="Start time"><input type="datetime-local" className={inputClass} value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required /></Field>
          <Field label="End time"><input type="datetime-local" className={inputClass} value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></Field>
          <Field label="Notes"><textarea className={inputClass} rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
        </div>
        <button className={`${primaryButton} mt-4`}><Timer className="h-4 w-4" />Save Time Log</button>
      </form>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Today&apos;s Time Logs</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-700">Total today: {totalToday}h</p>
        <div className="mt-4 space-y-3">
          {timeData.todayLogs?.map((log) => (
            <div key={log._id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex justify-between gap-3">
                <div><p className="font-bold text-slate-950">{log.task?.title || "Unknown task"}</p><p className="text-sm text-slate-500">{hours(log.durationMinutes)}h {log.notes ? `- ${log.notes}` : ""}</p></div>
                <button className="text-red-600" onClick={() => deleteLog(log)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {timeData.todayLogs?.length === 0 ? <p className="text-sm text-slate-500">No time logs for today yet.</p> : null}
        </div>
      </div>
      </div>
    </section>
  );
}

function DailyView({ scheduleData, reload }) {
  const [date, setDate] = useState(scheduleData.date || todayString());
  const [plannedHours, setPlannedHours] = useState(scheduleData.schedule?.plannedHours ?? 8);
  const [taskId, setTaskId] = useState("");
  const [monthDate, setMonthDate] = useState(() => new Date(`${scheduleData.date || todayString()}T12:00:00`));
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const completion = scheduleData.schedule?.plannedHours ? Math.min(100, Math.round((scheduleData.schedule.actualHours / scheduleData.schedule.plannedHours) * 100)) : 0;
  const allTasks = scheduleData.allTasks || [];
  const selectedTasks = allTasks
    .filter((task) => isTaskScheduledOnDate(task, date) || dateString(task.dueDate) === date || dateString(task.startDate) === date)
    .sort((a, b) => {
      const aStart = a.slotStart || toTimeInput(a.startDate || a.dueDate, "09:00");
      const bStart = b.slotStart || toTimeInput(b.startDate || b.dueDate, "09:00");
      return aStart.localeCompare(bStart);
    });
  const monthDays = buildMonthDays(monthDate, allTasks);
  const monthTitle = monthDate.toLocaleDateString("en", { month: "long", year: "numeric" });

  async function loadDate(nextDate) {
    setDate(nextDate);
    setShowCreate(false);
    setEditing(null);
    await reload(nextDate);
  }

  function moveMonth(direction) {
    setMonthDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  async function postSchedule(body) {
    await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await reload(date);
  }

  async function saveTask(task) {
    const isEdit = Boolean(task._id);
    const startDate = task.startDate || date;
    const dueDate = task.dueDate || startDate;
    const slotStart = task.slotStart || "09:00";
    const slotEnd = task.slotEnd || "10:00";
    const payloadBody = {
      ...task,
      startDate,
      dueDate,
      slotStart,
      slotEnd,
      weeklyDays: normalizeWeeklyDays(task.weeklyDays),
      isAlarmSet: true,
    };
    const response = await fetch("/api/tasks", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: task._id, ...payloadBody } : payloadBody),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || payload.errors?.join(" ") || "Unable to save task.");
    setShowCreate(false);
    setEditing(null);
    await reload(date);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Schedule date"><input type="date" className={inputClass} value={date} onChange={(event) => loadDate(event.target.value)} /></Field>
          <Field label="Planned hours"><input type="number" min="0" max="24" step="0.5" className={inputClass} value={plannedHours} onChange={(event) => setPlannedHours(event.target.value)} /></Field>
          <button className={primaryButton} onClick={() => postSchedule({ action: "planned-hours", date, plannedHours })}>Update</button>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-950">{monthTitle}</h2>
            <div className="flex gap-2">
              <button type="button" className={subtleButton} onClick={() => moveMonth(-1)}>Prev</button>
              <button type="button" className={subtleButton} onClick={() => { const today = new Date(); setMonthDate(today); loadDate(todayString()); }}>Today</button>
              <button type="button" className={subtleButton} onClick={() => moveMonth(1)}>Next</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {monthDays.map((day) => (
              <button key={day.iso} type="button" onClick={() => loadDate(day.iso)} className={`min-h-20 rounded-lg border p-2 text-left transition ${day.iso === date ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"} ${day.isCurrentMonth ? "" : "opacity-45"}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${day.isToday ? "bg-slate-950 text-white" : "text-slate-700"}`}>{day.label}</span>
                {day.tasks.length > 0 ? <p className="mt-2 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">{day.tasks.length} task{day.tasks.length > 1 ? "s" : ""}</p> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={Clock3} label="Planned" value={`${scheduleData.schedule?.plannedHours ?? 0}h`} helper="Target hours" />
            <Metric icon={CheckCircle2} label="Actual" value={`${scheduleData.schedule?.actualHours ?? 0}h`} helper="Logged hours" color="text-green-700" bg="bg-green-50" />
            <Metric icon={BarChart3} label="Complete" value={`${completion}%`} helper="Actual vs planned" color="text-amber-700" bg="bg-amber-50" />
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <div className="mb-2 flex justify-between text-sm font-bold text-slate-600"><span>Daily completion</span><span>{completion}%</span></div>
            <div className="h-3 rounded-full bg-white"><div className="h-3 rounded-full bg-emerald-600" style={{ width: `${completion}%` }} /></div>
          </div>
          <div className="mt-5 flex gap-2">
            <select className={inputClass} value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="">Add task to schedule</option>
              {scheduleData.allTasks?.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
            </select>
            <button className={primaryButton} onClick={() => taskId && postSchedule({ action: "add-task", date, taskId })}><Plus className="h-4 w-4" />Add</button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{formatDate(`${date}T12:00:00`)}</h2>
              <p className="text-sm font-semibold text-slate-500">{selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"} for this day</p>
            </div>
            <button className={primaryButton} onClick={() => { setEditing(null); setShowCreate(true); }}><Plus className="h-4 w-4" />Create Task</button>
          </div>
          {showCreate ? <div className="mt-5"><TaskForm categories={scheduleData.categories || []} task={{ startDate: date, dueDate: date, slotStart: "09:00", slotEnd: "10:00", weeklyDays: [...DEFAULT_WEEKLY_DAYS] }} onSubmit={saveTask} onCancel={() => setShowCreate(false)} /></div> : null}
          {editing ? <div className="mt-5"><TaskForm categories={scheduleData.categories || []} task={editing} onSubmit={saveTask} onCancel={() => setEditing(null)} /></div> : null}
          <div className="mt-5 space-y-3">
            {selectedTasks.map((task) => (
              <div key={task._id} className="rounded-lg border-l-4 bg-slate-50 p-3" style={{ borderLeftColor: task.category?.color || "#6B7280" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{task.title}</p>
                    <p className="text-sm text-slate-500">
                      {task.priority} priority - {task.status.replace("_", " ")} - {normalizeTimeString(task.slotStart || toTimeInput(task.startDate || task.dueDate), "09:00")}–{normalizeTimeString(task.slotEnd || toTimeInput(task.dueDate), "10:00")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(task.startDate || task.dueDate)} → {formatDate(task.dueDate || task.startDate)} · {(normalizeWeeklyDays(task.weeklyDays).map((day) => WEEKDAY_OPTIONS[day].label).join(", "))}
                      {task.scheduleConfirmed ? " · confirmed" : ""}
                    </p>
                  </div>
                  <button type="button" className={subtleButton} onClick={() => { setShowCreate(false); setEditing(task); }}>Edit</button>
                </div>
              </div>
            ))}
            {selectedTasks.length === 0 ? <p className="text-sm text-slate-500">No tasks scheduled for this day.</p> : null}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Hourly Breakdown</h2>
        <div className="mt-4 grid max-h-[620px] gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-4">
          {scheduleData.hourlyBreakdown?.map((hour) => (
            <div key={hour.hour} className="rounded-lg bg-slate-50 p-2">
              <p className="text-sm font-bold text-slate-700">{hour.hour}</p>
              {(hour.plannedTasks || []).map((task) => (
                <p key={`plan-${task._id}`} className="text-xs font-semibold text-emerald-700">{task.title} · planned</p>
              ))}
              {(hour.logs || []).map((log) => (
                <p key={log._id} className="text-xs text-slate-500">{log.task?.title} - {hours(log.durationMinutes)}h</p>
              ))}
              {hour.isEmpty ? <p className="text-xs text-slate-400">No activity</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryView({ summary }) {
  const maxActual = Math.max(...(summary.dailyData || []).map((row) => Number(row.actual || 0)), 1);
  const maxPlanned = Math.max(...(summary.dailyData || []).map((row) => Number(row.planned || 0)), 1);
  const maxDayAverage = Math.max(...(summary.dayOfWeekAverage || []).map((row) => Number(row.average || 0)), 1);
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Clock3} label="Planned" value={`${summary.totalPlanned || 0}h`} helper="Last 30 days" />
        <Metric icon={CheckCircle2} label="Actual" value={`${summary.totalActual || 0}h`} helper="Logged" color="text-green-700" bg="bg-green-50" />
        <Metric icon={BarChart3} label="Completion" value={`${summary.completionRate || 0}%`} helper="Actual vs planned" color="text-amber-700" bg="bg-amber-50" />
        <Metric icon={ListChecks} label="Tasks Done" value={summary.tasksCompleted || 0} helper="Completed" color="text-sky-700" bg="bg-sky-50" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Planned vs actual trend</h2>
          <div className="mt-5 space-y-4">
            {summary.dailyData?.map((row) => (
              <div key={`trend-${row.date}`} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500"><span>{row.date}</span><span>{row.actual}h of {row.planned}h</span></div>
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (row.actual / maxActual) * 100)}%` }} /></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-400" style={{ width: `${Math.min(100, (row.planned / maxPlanned) * 100)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Best weekdays</h2>
          <div className="mt-5 space-y-3">
            {summary.dayOfWeekAverage?.map((row) => <MiniBar key={row.day} label={row.day} value={row.average} max={maxDayAverage} helper={`${row.average}h avg`} />)}
          </div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Most Productive Days</h2>
          <div className="mt-4 space-y-2">{summary.productiveDays?.map((day, index) => <div key={`${day.date}-${index}`} className="flex justify-between rounded-lg bg-slate-50 p-3"><span>{index + 1}. {day.date} ({day.dayOfWeek})</span><strong>{day.hours}h</strong></div>)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Detailed Schedule History</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="text-slate-500"><th className="py-2">Date</th><th>Planned</th><th>Actual</th><th>Complete</th></tr></thead>
              <tbody>{summary.dailyData?.map((row) => <tr key={row.date} className="border-t border-slate-100"><td className="py-2 font-semibold">{row.date}</td><td>{row.planned}h</td><td>{row.actual}h</td><td>{row.completion}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileView({ user }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name || "", email: user.email || "", password: "" });
  const [message, setMessage] = useState("");

  async function saveProfile(event) {
    event.preventDefault();
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (payload.success) {
      setMessage("Profile updated.");
      setForm((current) => ({ ...current, password: "" }));
      router.refresh();
    }
  }

  return (
    <form onSubmit={saveProfile} className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-emerald-700" /><h2 className="text-xl font-bold">Profile settings</h2></div>
      <div className="mt-5 grid gap-4">
        <Field label="Full name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Email address"><input type="email" className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
        <Field label="New password"><input type="password" className={inputClass} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" /></Field>
      </div>
      {message ? <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p> : null}
      <button className={`${primaryButton} mt-5`}><Save className="h-4 w-4" />Save profile</button>
    </form>
  );
}

function Overview({ user, tasks, timeData }) {
  const today = todayString();
  const totalTasksToday = tasks.filter((task) => isTaskScheduledOnDate(task, today) || task.dueDate?.slice(0, 10) === today || dateString(task.startDate) === today).length;
  const completedTasksToday = tasks.filter((task) => (isTaskScheduledOnDate(task, today) || task.dueDate?.slice(0, 10) === today) && task.status === "completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const timeSpentToday = hours(timeData.todayLogs?.reduce((sum, log) => sum + log.durationMinutes, 0));
  const productivityScore = Math.round((totalTasksToday ? (completedTasksToday / totalTasksToday) * 50 : 0) + Math.min(timeSpentToday * 5, 50));
  const todayPending = tasks.filter((task) => (isTaskScheduledOnDate(task, today) || task.dueDate?.slice(0, 10) === today) && task.status !== "completed" && task.status !== "cancelled").sort((a, b) => String(a.slotStart || "").localeCompare(String(b.slotStart || "")));
  const upcoming = tasks.filter((task) => {
    const start = dateString(task.startDate || task.dueDate);
    return start && start > today && task.status !== "completed" && task.status !== "cancelled";
  }).sort((a, b) => new Date(a.startDate || a.dueDate) - new Date(b.startDate || b.dueDate)).slice(0, 6);
  const categoryHours = Object.values(tasks.reduce((acc, task) => {
    const category = task.category || { _id: "uncategorized", name: "Uncategorized", color: "#64748B" };
    acc[category._id] ||= { ...category, hours: 0, tasks: 0 };
    acc[category._id].hours += hours(task.timeSpent);
    acc[category._id].tasks += 1;
    return acc;
  }, {}));
  const maxCategoryHours = Math.max(...categoryHours.map((item) => item.hours), 1);
  const focus = Object.values(tasks.filter((task) => task.status === "pending" && task.category).reduce((acc, task) => {
    acc[task.category._id] ||= { ...task.category, tasksCount: 0 };
    acc[task.category._id].tasksCount += 1;
    return acc;
  }, {})).sort((a, b) => b.tasksCount - a.tasksCount)[0];

  return (
    <section className="space-y-5">
      <div className="rounded-lg bg-gradient-to-r from-emerald-700 to-green-500 p-6 text-white shadow-sm">
        <h2 className="text-3xl font-bold">Welcome back, {user.name || user.email}</h2>
        <p className="mt-2 text-emerald-50">Here&apos;s what&apos;s happening with your time today.</p>
      </div>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{QUOTES[new Date().getDate() % QUOTES.length]}</div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={BarChart3} label="Productivity Score" value={`${productivityScore}%`} helper="Today's performance" />
        <Metric icon={CheckCircle2} label="Today's Tasks" value={`${completedTasksToday}/${totalTasksToday}`} helper="Completed today" color="text-green-700" bg="bg-green-50" />
        <Metric icon={Clock3} label="Hours Today" value={`${timeSpentToday}h`} helper="Logged time" color="text-amber-700" bg="bg-amber-50" />
        <Metric icon={ListChecks} label="Pending Tasks" value={pendingTasks} helper="Need attention" color="text-red-700" bg="bg-red-50" />
      </div>
      {focus ? <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">Today&apos;s Focus</p><h3 className="mt-1 text-xl font-bold" style={{ color: focus.color }}>{focus.name}</h3><p className="mt-1 text-sm text-slate-500">{focus.tasksCount} pending tasks in this category</p></div> : null}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">Pending today</h2>
            <Bell className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {todayPending.map((task) => (
              <div key={task._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-950">{task.title}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-700">{task.priority}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{task.category?.name || "No category"} - {normalizeTimeString(task.slotStart || toTimeInput(task.startDate || task.dueDate), "09:00")}–{normalizeTimeString(task.slotEnd || toTimeInput(task.dueDate), "10:00")}</p>
              </div>
            ))}
            {todayPending.length === 0 ? <p className="text-sm font-semibold text-slate-500">No pending tasks due today.</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Upcoming notifications</h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((task) => (
              <div key={task._id} className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3">
                <div>
                  <p className="font-bold text-slate-950">{task.title}</p>
                  <p className="text-xs font-semibold text-emerald-700">{formatDate(task.startDate || task.dueDate)} - {task.category?.name || "No category"}</p>
                </div>
                <Bell className="h-4 w-4 text-emerald-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950">Workload by category</h2>
          <InstallPrompt />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {categoryHours.map((item) => <MiniBar key={item._id} label={`${item.name} (${item.tasks} tasks)`} value={item.hours} max={maxCategoryHours} color={item.color} helper={`${item.hours}h`} />)}
        </div>
      </div>
      <FeedbackBox />
    </section>
  );
}

function FeedbackBox() {
  const [form, setForm] = useState({ type: "suggestion", rating: "", message: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitFeedback(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to submit feedback.");
      }

      setForm({ type: "suggestion", rating: "", message: "" });
      setMessage("Thanks. Your feedback was sent to the admin.");
    } catch (feedbackError) {
      setError(feedbackError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitFeedback} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Suggestion or review</h2>
          <p className="text-sm text-slate-500">Share what should improve in this CRM.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[180px_140px_1fr]">
        <Field label="Type">
          <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="suggestion">Suggestion</option>
            <option value="review">Review</option>
            <option value="bug">Bug</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Rating">
          <select className={inputClass} value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
          </select>
        </Field>
        <Field label="Message">
          <textarea className={inputClass} rows={3} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Write your suggestion or review..." required />
        </Field>
      </div>
      {message ? <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
      <button className={`${primaryButton} mt-4`} disabled={isSubmitting}>
        <MessageSquare className="h-4 w-4" />
        {isSubmitting ? "Sending" : "Send feedback"}
      </button>
    </form>
  );
}

function AdminView({ data, reload }) {
  const [seedMessage, setSeedMessage] = useState("");
  const [seedError, setSeedError] = useState("");

  async function seedDemoUser() {
    setSeedMessage("");
    setSeedError("");
    const response = await fetch("/api/superadmin/seed-demo", { method: "POST" });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setSeedError(payload.error || "Unable to create demo data.");
      return;
    }

    setSeedMessage(`${payload.message} Login: ${payload.login.email} / ${payload.login.password}`);
    await reload();
  }

  const usageWindows = [
    ["24h logins", data.loginsLast24Hours || 0],
    ["7d logins", data.loginsLast7Days || 0],
    ["30d logins", data.loginsLast30Days || 0],
    ["Year logins", data.loginsThisYear || 0],
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Admin Analytics</h2>
          <p className="text-sm text-slate-500">Track user adoption, CRM usage, and feedback.</p>
        </div>
        <button className={primaryButton} onClick={seedDemoUser}>Create demo user data</button>
      </div>
      {seedMessage ? <p className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-700">{seedMessage}</p> : null}
      {seedError ? <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{seedError}</p> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={UserRound} label="Users" value={data.totalUsers || 0} helper={`${data.totalRegularUsers || 0} regular users`} />
        <Metric icon={ListChecks} label="Tasks" value={data.totalTasks || 0} helper="All user tasks" color="text-green-700" bg="bg-green-50" />
        <Metric icon={Clock3} label="Time Logs" value={data.totalTimeLogs || 0} helper="All tracking entries" color="text-amber-700" bg="bg-amber-50" />
        <Metric icon={MessageSquare} label="Feedback" value={data.totalFeedback || 0} helper={`${data.openFeedback || 0} new`} color="text-sky-700" bg="bg-sky-50" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {usageWindows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Users and usage</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500"><tr><th className="py-2">User</th><th>Logins</th><th>Tasks</th><th>Done</th><th>Hours</th><th>Last Login</th></tr></thead>
              <tbody>
                {data.usageByUser?.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-2"><strong>{item.name || item.email}</strong><p className="text-xs text-slate-500">{item.email}</p></td>
                    <td>{item.loginCount || 0}</td>
                    <td>{item.tasksCount || 0}</td>
                    <td>{item.completedTasks || 0}</td>
                    <td>{hours(item.loggedMinutes)}h</td>
                    <td>{item.lastLoginAt ? formatDate(item.lastLoginAt) : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Recent feedback</h3>
          <div className="mt-4 space-y-3">
            {data.recentFeedback?.map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-bold text-slate-950">{item.userId?.email || "Unknown user"}</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{item.type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">{item.rating ? `${item.rating}/5 - ` : ""}{formatDate(item.createdAt)}</p>
              </div>
            ))}
            {data.recentFeedback?.length === 0 ? <p className="text-sm text-slate-500">No feedback yet.</p> : null}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Daily CRM usage, last 30 days</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {data.dailyUsage?.map((day) => (
            <div key={day._id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">{day._id}</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{hours(day.loggedMinutes)}h</p>
              <p className="text-xs text-slate-500">{day.logs} logs</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FloatingTimer({ timer }) {
  if (!timer.activeTimer) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-emerald-200 bg-white p-4 shadow-xl">
      <p className="text-xs font-bold uppercase text-emerald-700">Running task</p>
      <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-950">{timer.activeTimer.title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{formatElapsed(timer.elapsedSeconds)}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800" onClick={timer.stopTask}><Square className="h-4 w-4" />Stop</button>
      </div>
    </div>
  );
}

export default function DashboardClient({ user }) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") || "overview";
  const [state, setState] = useState({ tasks: [], categories: [], timeData: {}, scheduleData: {}, summary: {}, adminData: {}, loading: true, error: "" });
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const demoSeededRef = useRef(false);

  const load = useCallback(async (scheduleDate = todayString()) => {
    try {
      const [tasksRes, categoriesRes, timeRes, scheduleRes, summaryRes, adminRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/time-logs", { cache: "no-store" }),
        fetch(`/api/schedules?date=${scheduleDate}`, { cache: "no-store" }),
        fetch("/api/schedules?mode=summary", { cache: "no-store" }),
        user.role === "superadmin"
          ? fetch("/api/superadmin/analytics", { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const [tasks, categories, timeData, scheduleData, summary, admin] = await Promise.all([
        tasksRes.json(),
        categoriesRes.json(),
        timeRes.json(),
        scheduleRes.json(),
        summaryRes.json(),
        adminRes ? adminRes.json() : Promise.resolve({ data: {} }),
      ]);

      if (
        user.email === "codeashwani@gmail.com" &&
        !demoSeededRef.current &&
        ((tasks.data || []).length < 20 || (categories.data || []).length < 6)
      ) {
        demoSeededRef.current = true;
        const seedResponse = await fetch("/api/superadmin/seed-demo", { method: "POST" });
        const seedPayload = await seedResponse.json();

        if (!seedResponse.ok || !seedPayload.success) {
          setState(createCodeashwaniDemoState(scheduleDate));
          return;
        }

        await load(scheduleDate);
        return;
      }

      setState({ tasks: tasks.data || [], categories: categories.data || [], timeData: timeData.data || {}, scheduleData: scheduleData.data || {}, summary: summary.data || {}, adminData: admin.data || {}, loading: false, error: "" });
    } catch (error) {
      if (user.email === "codeashwani@gmail.com") {
        setState(createCodeashwaniDemoState(scheduleDate));
        return;
      }

      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [user.email, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeTimer) return undefined;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeTimer.startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const startTask = useCallback((task) => {
    if (!task || activeTimer) return;
    setActiveTimer({ taskId: task._id, title: task.title, startedAt: Date.now() });
    setElapsedSeconds(0);
  }, [activeTimer]);

  const stopTask = useCallback(async () => {
    if (!activeTimer) return;
    const endTime = new Date();
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - activeTimer.startedAt) / 60000));
    const response = await fetch("/api/time-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: activeTimer.taskId,
        startTime: new Date(activeTimer.startedAt),
        endTime,
        durationMinutes,
        notes: "Tracked with start/stop timer.",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      setState((current) => ({ ...current, error: payload.error || "Unable to save tracked time." }));
      return;
    }
    setActiveTimer(null);
    setElapsedSeconds(0);
    await load();
  }, [activeTimer, load]);

  const timer = useMemo(() => ({ activeTimer, elapsedSeconds, startTask, stopTask }), [activeTimer, elapsedSeconds, startTask, stopTask]);

  const content = useMemo(() => {
    if (state.loading) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">Loading workspace...</p>;
    if (state.error) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{state.error}</p>;
    if (activeView === "tasks") return <TasksView tasks={state.tasks} categories={state.categories} reload={load} timer={timer} />;
    if (activeView === "categories") return <CategoriesView categories={state.categories} tasks={state.tasks} reload={load} />;
    if (activeView === "timer") return <TimerView timeData={state.timeData} reload={load} timer={timer} />;
    if (activeView === "daily") return <DailyView key={state.scheduleData.date || "daily"} scheduleData={state.scheduleData} reload={load} />;
    if (activeView === "summary") return <SummaryView summary={state.summary} />;
    if (activeView === "profile") return <ProfileView user={user} />;
    if (activeView === "admin") return <AdminView data={state.adminData} reload={load} />;
    return <Overview user={user} tasks={state.tasks} timeData={state.timeData} />;
  }, [activeView, state, user, load, timer]);

  return <div className="mx-auto max-w-7xl">{content}<FloatingTimer timer={timer} /><TaskReminders tasks={state.tasks} onReload={load} onStartTask={startTask} /></div>;
}
