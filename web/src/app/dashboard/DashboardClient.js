"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlarmClock,
  BarChart3,
  CheckCircle2,
  Clock3,
  Info,
  LayoutDashboard,
  Plus,
  Save,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";

import TaskCard from "../../components/TaskCard";

const HORIZONS = [
  { key: "1_Day", title: "Today", shortTitle: "Day", subtitle: "Immediate focus", view: "today" },
  { key: "1_Week", title: "This Week", shortTitle: "Week", subtitle: "Weekly commitments", view: "week" },
  { key: "1_Month", title: "This Month", shortTitle: "Month", subtitle: "Monthly targets", view: "month" },
  { key: "1_Year", title: "This Year", shortTitle: "Year", subtitle: "Annual goals", view: "year" },
];

const VIEW_TO_HORIZON = {
  today: "1_Day",
  week: "1_Week",
  month: "1_Month",
  year: "1_Year",
};

function getDisplayName(user) {
  return user?.name || user?.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "User";
}

function formatHours(minutes) {
  return `${Math.round(((Number(minutes) || 0) / 60) * 10) / 10}h`;
}

function formatDate(date) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function calculateSummary(tasks) {
  return tasks.reduce(
    (summary, task) => {
      const allocated = Number(task.timeAllocated) || 0;
      const spent = Number(task.timeSpent) || 0;

      return {
        allocated: summary.allocated + allocated,
        spent: summary.spent + spent,
        completed: summary.completed + (task.status === "completed" ? 1 : 0),
        active: summary.active + (task.status !== "completed" ? 1 : 0),
        alarms: summary.alarms + (task.isAlarmSet ? 1 : 0),
      };
    },
    { allocated: 0, spent: 0, completed: 0, active: 0, alarms: 0 }
  );
}

function percentage(part, total) {
  if (!total) {
    return 0;
  }

  return Math.min(100, Math.round((part / total) * 100));
}

function Hint({ text }) {
  return (
    <span className="group relative inline-flex">
      <Info className="h-4 w-4 cursor-help text-slate-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-xl transition duration-200 group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
      {children}
      {hint ? <Hint text={hint} /> : null}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

function ProgressLine({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        </div>
        <p className="text-lg font-bold text-slate-950">{value}%</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon: Icon = LayoutDashboard }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TaskComposer({
  form,
  setForm,
  onSubmit,
  isCreating,
  createError,
  activeHorizon,
}) {
  return (
    <form
      id="create-task"
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <Plus className="h-4 w-4" />
            Create task
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            One intake for every horizon
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Add a task once, then choose whether it belongs to the day, week,
            month, or year.
          </p>
        </div>
        {activeHorizon ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            Filtering {activeHorizon.title}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid min-w-0 gap-4">
        <label className="min-w-0">
          <FieldLabel hint="Use a short action title, not a long paragraph.">
            Task title
          </FieldLabel>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Example: Prepare weekly client update"
            required
          />
        </label>

        <label className="min-w-0">
          <FieldLabel hint="Optional context that explains the expected result.">
            Description
          </FieldLabel>
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Short note or outcome"
          />
        </label>

        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <label className="min-w-0">
            <FieldLabel hint="All work is a task. The horizon decides its planning window.">
              Horizon
            </FieldLabel>
            <select
              value={form.timeHorizon}
              onChange={(event) => setForm({ ...form, timeHorizon: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {HORIZONS.map((horizon) => (
                <option key={horizon.key} value={horizon.key}>
                  {horizon.title}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <FieldLabel hint="Planned effort in minutes. 60 means one hour.">
              Planned minutes
            </FieldLabel>
            <input
              type="number"
              min="1"
              value={form.timeAllocated}
              onChange={(event) => setForm({ ...form, timeAllocated: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="60"
            />
          </label>

          <label className="min-w-0">
            <FieldLabel hint="Optional reminder. Leave empty if this task does not need an alarm.">
              Alarm time
            </FieldLabel>
            <input
              type="datetime-local"
              value={form.alarmTime}
              onChange={(event) => setForm({ ...form, alarmTime: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>
      </div>

      {createError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {createError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isCreating}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-emerald-700 disabled:bg-slate-300 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        {isCreating ? "Creating" : "Create task"}
      </button>
    </form>
  );
}

function HorizonSummary({ horizon, tasks }) {
  const summary = calculateSummary(tasks);
  const progress = percentage(summary.spent, summary.allocated);

  return (
    <Link
      href={`/dashboard?view=${horizon.view}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{horizon.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{horizon.subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
          {tasks.length}
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">
        {formatHours(summary.spent)} spent of {formatHours(summary.allocated)} planned
      </p>
    </Link>
  );
}

function TaskList({ tasks, isLoading, error, title, emptyCopy, onPatch, onDelete, busyTaskId }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{tasks.length} task records</p>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <EmptyState
            title="No tasks here yet"
            description={emptyCopy}
          />
        ) : null}

        {!isLoading && !error && tasks.length > 0 ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onPatch={onPatch}
                onDelete={onDelete}
                isBusy={busyTaskId === task._id}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InsightsView({ allTasks, summary }) {
  const completionRate = percentage(summary.completed, allTasks.length);
  const alarmRate = percentage(summary.alarms, allTasks.length);
  const utilizationRate = percentage(summary.spent, summary.allocated);
  const activeRate = percentage(summary.active, allTasks.length);

  if (allTasks.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Insights start after your first task"
        description="Create tasks with planned time and horizons. Track Time will then calculate completion, alarm coverage, active workload, and time utilization from your real data."
      />
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-emerald-700">Real workspace insights</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Based on your current tasks
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This page does not use fake health scores. It reads task status,
          planned time, tracked time, and alarms from your workspace.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard icon={CheckCircle2} label="Completed" value={summary.completed} helper="Closed tasks" />
          <MetricCard icon={Clock3} label="Active" value={summary.active} helper="Open work" />
          <MetricCard icon={AlarmClock} label="Alarms" value={summary.alarms} helper="Scheduled reminders" />
          <MetricCard icon={BarChart3} label="Spent" value={formatHours(summary.spent)} helper="Tracked time" />
        </div>
      </div>
      <div className="space-y-3">
        <ProgressLine label="Completion rate" value={completionRate} helper="Completed tasks compared with total tasks." />
        <ProgressLine label="Time utilization" value={utilizationRate} helper="Tracked time compared with planned time." />
        <ProgressLine label="Alarm coverage" value={alarmRate} helper="Tasks with reminder time enabled." />
        <ProgressLine label="Active workload" value={activeRate} helper="Open tasks that still need action." />
      </div>
    </section>
  );
}

function CompletedView({ tasks, summary, onPatch, onDelete, busyTaskId }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={CheckCircle2} label="Completed tasks" value={tasks.length} helper="Finished across horizons" />
        <MetricCard icon={Clock3} label="Completed time" value={formatHours(summary.spent)} helper="Tracked or planned closed work" />
        <MetricCard icon={Target} label="Completion rate" value={`${percentage(tasks.length, tasks.length + summary.active)}%`} helper="Closed vs open workload" />
      </div>
      <TaskList
        title="Completed work"
        tasks={tasks}
        isLoading={false}
        emptyCopy="Tasks marked Done will appear here with their horizon and tracked time."
        onPatch={onPatch}
        onDelete={onDelete}
        busyTaskId={busyTaskId}
      />
    </section>
  );
}

function ProfileView({
  profileForm,
  setProfileForm,
  onSubmit,
  isSavingProfile,
  profileMessage,
  profileError,
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Profile settings</h2>
            <p className="mt-1 text-sm text-slate-500">Update your account details.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label>
            <FieldLabel hint="Shown in the dashboard header.">
              Full name
            </FieldLabel>
            <input
              value={profileForm.name}
              onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Your name"
            />
          </label>
          <label>
            <FieldLabel hint="Used for OTP messages and login.">
              Email address
            </FieldLabel>
            <input
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
            />
          </label>
          <label>
            <FieldLabel hint="Optional. Leave blank if you only want email OTP login.">
              New password
            </FieldLabel>
            <input
              type="password"
              value={profileForm.password}
              onChange={(event) => setProfileForm({ ...profileForm, password: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Minimum 8 characters"
            />
          </label>
        </div>

        {profileMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {profileMessage}
          </p>
        ) : null}
        {profileError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {profileError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSavingProfile}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
        >
          <Save className="h-4 w-4" />
          {isSavingProfile ? "Saving" : "Save profile"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-950">Access methods</h2>
        <div className="mt-4 grid gap-3">
          {[
            ["Email OTP", "Passwordless login and automatic registration."],
            ["Password login", "Available after setting a password or for the configured admin account."],
            ["Google login", "Button is prepared for Firebase credentials."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminView({ user }) {
  const [state, setState] = useState({
    isLoading: user.role === "superadmin",
    error: user.role === "superadmin" ? "" : "Superadmin access required.",
    data: null,
  });

  useEffect(() => {
    if (user.role !== "superadmin") {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/superadmin/analytics", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load analytics.");
        }

        setState({ isLoading: false, error: "", data: payload.data });
      } catch (error) {
        if (error.name !== "AbortError") {
          setState({ isLoading: false, error: error.message, data: null });
        }
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [user.role]);

  if (state.isLoading) {
    return <EmptyState icon={ShieldCheck} title="Loading admin analytics" description="Fetching user, session, and task data." />;
  }

  if (state.error) {
    return <EmptyState icon={ShieldCheck} title="Admin analytics unavailable" description={state.error} />;
  }

  const data = state.data;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={UserRound} label="Users" value={data.totalUsers} helper="All registered users" />
        <MetricCard icon={ShieldCheck} label="Admins" value={data.totalSuperadmins} helper="Superadmin accounts" />
        <MetricCard icon={LayoutDashboard} label="Tasks" value={data.totalTasks} helper="Platform-wide tasks" />
        <MetricCard icon={Activity} label="Sessions" value={data.activeSessions} helper="Active sessions" />
        <MetricCard icon={Clock3} label="7 day logins" value={data.loginsLast7Days} helper="Recent activity" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Horizon distribution</h2>
          <div className="mt-4 space-y-3">
            {data.tasksByHorizon.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks created yet.</p>
            ) : null}
            {data.tasksByHorizon.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{String(item._id).replace("1_", "1 ")}</p>
                  <p className="text-sm font-bold text-emerald-700">{item.count} tasks</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatHours(item.timeSpent)} spent of {formatHours(item.timeAllocated)} planned
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Recent users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Logins</th>
                  <th className="px-4 py-3">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.recentUsers.map((item) => (
                  <tr key={String(item._id)}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{item.email}</td>
                    <td className="px-4 py-3 text-slate-600">{item.role}</td>
                    <td className="px-4 py-3 text-slate-600">{item.loginCount}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DashboardClient({ user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") || "overview";
  const normalizedView = activeView === "health" ? "insights" : activeView;
  const activeHorizonKey = VIEW_TO_HORIZON[normalizedView];
  const activeHorizon = HORIZONS.find((horizon) => horizon.key === activeHorizonKey);
  const [tasksByHorizon, setTasksByHorizon] = useState(
    Object.fromEntries(HORIZONS.map((horizon) => [horizon.key, []]))
  );
  const [errorsByHorizon, setErrorsByHorizon] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [createError, setCreateError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeHorizon: activeHorizonKey || "1_Day",
    timeAllocated: 60,
    alarmTime: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    email: user.email || "",
    password: "",
  });

  async function loadTasks(signal) {
    setIsLoading(true);
    setErrorsByHorizon({});

    const results = await Promise.all(
      HORIZONS.map(async (horizon) => {
        try {
          const response = await fetch(`/api/tasks?timeHorizon=${horizon.key}`, {
            cache: "no-store",
            signal,
          });
          const payload = await response.json();

          if (!response.ok || !payload.success) {
            throw new Error(payload.error || "Unable to load tasks.");
          }

          return [horizon.key, payload.data ?? [], null];
        } catch (error) {
          if (error.name === "AbortError") {
            return [horizon.key, [], null];
          }

          return [horizon.key, [], error.message];
        }
      })
    );

    if (signal?.aborted) {
      return;
    }

    setTasksByHorizon(
      Object.fromEntries(results.map(([key, tasks]) => [key, tasks]))
    );
    setErrorsByHorizon(
      Object.fromEntries(
        results
          .filter(([, , error]) => Boolean(error))
          .map(([key, , error]) => [key, error])
      )
    );
    setIsLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadTasks(controller.signal);
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  async function handleCreateTask(event) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "pending",
          timeAllocated: Number(form.timeAllocated),
          timeSpent: 0,
          isAlarmSet: Boolean(form.alarmTime),
          alarmTime: form.alarmTime || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || payload.errors?.join(" ") || "Unable to create task.");
      }

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        alarmTime: "",
      }));
      await loadTasks();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleTaskPatch(task, updates) {
    setBusyTaskId(task._id);

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task._id, ...updates }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || payload.errors?.join(" ") || "Unable to update task.");
      }

      await loadTasks();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setBusyTaskId("");
    }
  }

  async function handleTaskDelete(task) {
    setBusyTaskId(task._id);

    try {
      const response = await fetch(`/api/tasks?id=${task._id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to delete task.");
      }

      await loadTasks();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setBusyTaskId("");
    }
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to update profile.");
      }

      setProfileForm((current) => ({
        ...current,
        name: payload.user.name || "",
        email: payload.user.email || "",
        password: "",
      }));
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  const allTasks = useMemo(() => Object.values(tasksByHorizon).flat(), [tasksByHorizon]);
  const portfolioSummary = calculateSummary(allTasks);
  const completedTasks = allTasks.filter((task) => task.status === "completed");
  const visibleTasks =
    normalizedView === "completed"
      ? completedTasks
      : activeHorizonKey
        ? tasksByHorizon[activeHorizonKey] ?? []
        : allTasks;
  const visibleError = activeHorizonKey ? errorsByHorizon[activeHorizonKey] : "";
  const totalProgress = percentage(portfolioSummary.spent, portfolioSummary.allocated);

  if (normalizedView === "profile") {
    return (
      <div className="mx-auto max-w-7xl">
        <ProfileView
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onSubmit={handleProfileUpdate}
          isSavingProfile={isSavingProfile}
          profileMessage={profileMessage}
          profileError={profileError}
        />
      </div>
    );
  }

  if (normalizedView === "insights") {
    return (
      <div className="mx-auto max-w-7xl">
        <InsightsView allTasks={allTasks} summary={portfolioSummary} />
      </div>
    );
  }

  if (normalizedView === "admin") {
    return (
      <div className="mx-auto max-w-7xl">
        <AdminView user={user} />
      </div>
    );
  }

  if (normalizedView === "completed") {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <CompletedView
          tasks={completedTasks}
          summary={portfolioSummary}
          onPatch={handleTaskPatch}
          onDelete={handleTaskDelete}
          busyTaskId={busyTaskId}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-700">
              Hello {getDisplayName(user)}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Manage tasks by time horizon.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Everything is a task. The horizon simply decides whether it belongs
              to today, this week, this month, or this year.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
            <MetricCard icon={LayoutDashboard} label="Tasks" value={allTasks.length} helper="Total" />
            <MetricCard icon={BarChart3} label="Progress" value={`${totalProgress}%`} helper="Time used" />
            <MetricCard icon={Clock3} label="Spent" value={formatHours(portfolioSummary.spent)} helper="Tracked" />
            <MetricCard icon={AlarmClock} label="Alarms" value={portfolioSummary.alarms} helper="Set" />
          </div>
        </div>
      </section>

      <TaskComposer
        form={form}
        setForm={setForm}
        onSubmit={handleCreateTask}
        isCreating={isCreating}
        createError={createError}
        activeHorizon={activeHorizon}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {HORIZONS.map((horizon) => (
          <HorizonSummary
            key={horizon.key}
            horizon={horizon}
            tasks={tasksByHorizon[horizon.key] ?? []}
          />
        ))}
      </section>

      <TaskList
        title={
          activeHorizon
            ? `${activeHorizon.title} tasks`
            : "All active tasks"
        }
        tasks={visibleTasks}
        isLoading={isLoading}
        error={visibleError}
        emptyCopy={
          activeHorizon
            ? `Create a task and select ${activeHorizon.title} as the horizon.`
            : "Create your first task from the single intake form above."
        }
        onPatch={handleTaskPatch}
        onDelete={handleTaskDelete}
        busyTaskId={busyTaskId}
      />
    </div>
  );
}
