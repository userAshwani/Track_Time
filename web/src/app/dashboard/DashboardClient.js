"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import TaskCard from "../../components/TaskCard";

const HORIZONS = [
  { key: "1_Day", title: "Today", subtitle: "Immediate execution" },
  { key: "1_Week", title: "This Week", subtitle: "Weekly commitments" },
  { key: "1_Month", title: "This Month", subtitle: "Monthly delivery" },
  { key: "1_Year", title: "This Year", subtitle: "Annual priorities" },
];

const VIEW_TO_HORIZON = {
  today: "1_Day",
  week: "1_Week",
};

function getDisplayName(email) {
  return email?.split("@")[0]?.replace(/[._-]+/g, " ") || "User";
}

function formatHours(minutes) {
  return `${Math.round(((Number(minutes) || 0) / 60) * 10) / 10}h`;
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
        alarms: summary.alarms + (task.isAlarmSet ? 1 : 0),
      };
    },
    { allocated: 0, spent: 0, completed: 0, alarms: 0 }
  );
}

function HealthMetric({ label, value, colorClass, widthClass }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-bold text-slate-500">{value}</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${colorClass} ${widthClass}`} />
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function HorizonColumn({ horizon, tasks, isLoading, error }) {
  const summary = useMemo(() => calculateSummary(tasks), [tasks]);
  const progress =
    summary.allocated > 0
      ? Math.min(100, Math.round((summary.spent / summary.allocated) * 100))
      : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{horizon.title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {horizon.subtitle}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
            {tasks.length}
          </span>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-slate-600">Progress</span>
            <span className="font-bold text-slate-900">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Loading tasks...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">No tasks assigned</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              This horizon is clear and ready for planning.
            </p>
          </div>
        ) : null}

        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardClient({ user }) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") || "overview";
  const [tasksByHorizon, setTasksByHorizon] = useState(
    Object.fromEntries(HORIZONS.map((horizon) => [horizon.key, []]))
  );
  const [errorsByHorizon, setErrorsByHorizon] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeHorizon: "1_Day",
    timeAllocated: 60,
    alarmTime: "",
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

      setForm({
        title: "",
        description: "",
        timeHorizon: "1_Day",
        timeAllocated: 60,
        alarmTime: "",
      });
      await loadTasks();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  const allTasks = Object.values(tasksByHorizon).flat();
  const portfolioSummary = calculateSummary(allTasks);
  const totalProgress =
    portfolioSummary.allocated > 0
      ? Math.min(100, Math.round((portfolioSummary.spent / portfolioSummary.allocated) * 100))
      : 0;
  const healthScore = Math.max(52, Math.min(96, 70 + totalProgress / 3));
  const visibleHorizons = VIEW_TO_HORIZON[activeView]
    ? HORIZONS.filter((horizon) => horizon.key === VIEW_TO_HORIZON[activeView])
    : HORIZONS;
  const completedTasks = allTasks.filter((task) => task.status === "completed");
  const showHealth = activeView === "overview" || activeView === "health";
  const showTaskIntake = activeView === "overview" || activeView === "today" || activeView === "week";
  const showHorizons = activeView !== "health" && activeView !== "completed";
  const showCompleted = activeView === "completed";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-6 shadow-md shadow-emerald-100/50 md:p-8">
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full bg-emerald-200/40 blur-2xl lg:block" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
              Daily operating rhythm
            </p>
            <h2 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Late evening, {getDisplayName(user.email)} — your story starts today.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
              Convert execution intent into visible task horizons, measured time,
              and scheduled reminders.
            </p>
            <a
              href="#create-task"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Create task
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Tasks" value={allTasks.length} helper="Across horizons" />
            <StatCard label="Progress" value={`${totalProgress}%`} helper="Time utilized" />
            <StatCard label="Spent" value={formatHours(portfolioSummary.spent)} helper="Tracked time" />
            <StatCard label="Alarms" value={portfolioSummary.alarms} helper="Scheduled reminders" />
          </div>
        </div>
      </section>

      {showHealth || showTaskIntake ? (
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {showHealth ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/70">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-slate-50">
              <svg viewBox="0 0 120 120" className="h-40 w-40 rotate-[-90deg]">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore * 3.01} 301`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-4xl font-bold text-slate-900">
                  {Math.round(healthScore)}
                </p>
                <p className="text-xs font-bold uppercase text-slate-500">out of 100</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Account Health
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Good standing, room to grow
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your workspace health improves as you add tasks, track time, and
                keep alarms current across each horizon.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <HealthMetric label="Lead Engagement" value="Medium" colorClass="bg-orange-400" widthClass="w-[62%]" />
                <HealthMetric label="Reliability" value="High" colorClass="bg-emerald-500" widthClass="w-[86%]" />
                <HealthMetric label="Activity Pattern" value="Low" colorClass="bg-red-400" widthClass="w-[24%]" />
                <HealthMetric label="Response Quality" value="High" colorClass="bg-emerald-500" widthClass="w-[90%]" />
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {showTaskIntake ? (
        <form
          id="create-task"
          onSubmit={handleCreateTask}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/70"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Task Intake
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Add a tracked task
            </h3>
          </div>
          <div className="mt-5 grid gap-4">
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Task title"
              required
            />
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Short description"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={form.timeHorizon}
                onChange={(event) => setForm({ ...form, timeHorizon: event.target.value })}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {HORIZONS.map((horizon) => (
                  <option key={horizon.key} value={horizon.key}>
                    {horizon.title}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={form.timeAllocated}
                onChange={(event) => setForm({ ...form, timeAllocated: event.target.value })}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Minutes"
              />
              <input
                type="datetime-local"
                value={form.alarmTime}
                onChange={(event) => setForm({ ...form, alarmTime: event.target.value })}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
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
            className="mt-5 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {isCreating ? "Saving task" : "Create task"}
          </button>
        </form>
        ) : null}
      </section>
      ) : null}

      {showCompleted ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Completed Work
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">
                Finished tasks across all horizons
              </h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              {completedTasks.length} completed
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-900">
                  No completed tasks yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Completed tasks will appear here once you start closing work.
                </p>
              </div>
            ) : null}
            {completedTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </section>
      ) : null}

      {showHorizons ? (
      <section className="grid gap-5 xl:grid-cols-4">
        {visibleHorizons.map((horizon) => (
          <HorizonColumn
            key={horizon.key}
            horizon={horizon}
            tasks={tasksByHorizon[horizon.key] ?? []}
            isLoading={isLoading}
            error={errorsByHorizon[horizon.key]}
          />
        ))}
      </section>
      ) : null}
    </div>
  );
}
