"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TaskCard from "../../components/TaskCard";

const HORIZONS = [
  {
    key: "1_Day",
    title: "Today",
    subtitle: "Immediate execution window",
  },
  {
    key: "1_Week",
    title: "This Week",
    subtitle: "Short-cycle operating plan",
  },
  {
    key: "1_Month",
    title: "This Month",
    subtitle: "Monthly delivery commitments",
  },
  {
    key: "1_Year",
    title: "This Year",
    subtitle: "Annual strategic initiatives",
  },
];

function calculateHorizonSummary(tasks) {
  return tasks.reduce(
    (summary, task) => {
      const allocated = Math.max(0, Number(task.timeAllocated) || 0);
      const spent = Math.max(0, Number(task.timeSpent) || 0);

      return {
        allocated: summary.allocated + allocated,
        spent: summary.spent + spent,
        completed:
          summary.completed + (task.status === "completed" ? 1 : 0),
        alarms:
          summary.alarms + (task.isAlarmSet ? 1 : 0),
      };
    },
    { allocated: 0, spent: 0, completed: 0, alarms: 0 }
  );
}

function formatHours(minutes) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h`;
}

function HorizonColumn({ horizon, tasks, isLoading, error }) {
  const summary = useMemo(() => calculateHorizonSummary(tasks), [tasks]);
  const progress =
    summary.allocated > 0
      ? Math.min(100, Math.round((summary.spent / summary.allocated) * 100))
      : 0;

  return (
    <section className="flex min-h-[560px] flex-col border border-slate-200 bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black leading-7 text-slate-950">
              {horizon.title}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              {horizon.subtitle}
            </p>
          </div>
          <span className="border border-blue-900 bg-blue-950 px-3 py-1 text-sm font-black text-white">
            {tasks.length}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Horizon Progress</span>
            <span className="font-black text-blue-950">{progress}%</span>
          </div>
          <div className="h-3 border border-slate-300 bg-slate-100">
            <div className="h-full bg-blue-950" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 border border-slate-200 bg-white text-center">
          <div className="border-r border-slate-200 px-2 py-2">
            <dt className="text-xs font-bold uppercase tracking-normal text-slate-500">
              Spent
            </dt>
            <dd className="mt-1 text-sm font-black text-slate-950">
              {formatHours(summary.spent)}
            </dd>
          </div>
          <div className="border-r border-slate-200 px-2 py-2">
            <dt className="text-xs font-bold uppercase tracking-normal text-slate-500">
              Done
            </dt>
            <dd className="mt-1 text-sm font-black text-slate-950">
              {summary.completed}
            </dd>
          </div>
          <div className="px-2 py-2">
            <dt className="text-xs font-bold uppercase tracking-normal text-slate-500">
              Alarms
            </dt>
            <dd className="mt-1 text-sm font-black text-slate-950">
              {summary.alarms}
            </dd>
          </div>
        </dl>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {isLoading ? (
          <div className="border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
            Loading tasks...
          </div>
        ) : null}

        {error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-950">No tasks assigned</p>
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
  const router = useRouter();
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
    timeSpent: 0,
    status: "pending",
    isAlarmSet: false,
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

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          timeAllocated: Number(form.timeAllocated),
          timeSpent: Number(form.timeSpent),
          alarmTime: form.isAlarmSet && form.alarmTime ? form.alarmTime : null,
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
        timeSpent: 0,
        status: "pending",
        isAlarmSet: false,
        alarmTime: "",
      });
      await loadTasks();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  const portfolioSummary = useMemo(() => {
    const allTasks = Object.values(tasksByHorizon).flat();
    const summary = calculateHorizonSummary(allTasks);
    const progress =
      summary.allocated > 0
        ? Math.min(100, Math.round((summary.spent / summary.allocated) * 100))
        : 0;

    return {
      ...summary,
      progress,
      totalTasks: allTasks.length,
    };
  }, [tasksByHorizon]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="border-b border-blue-900 bg-blue-950">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-blue-200">
              Track Time Command Center
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              Enterprise Time Horizon Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-blue-100">
              Govern daily execution, weekly commitments, monthly delivery, and
              annual priorities from one operational view.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold">
              <span className="border border-blue-700 bg-blue-900 px-3 py-2 text-blue-100">
                {user.email}
              </span>
              {user.role === "superadmin" ? (
                <Link
                  href="/superadmin"
                  className="border border-amber-300 bg-amber-400 px-3 py-2 text-blue-950"
                >
                  Superadmin Analytics
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="border border-blue-700 bg-blue-950 px-3 py-2 text-blue-100"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 border border-blue-800 bg-blue-900 text-white sm:w-auto sm:min-w-[520px] sm:grid-cols-4">
            <div className="border-b border-r border-blue-800 px-4 py-3 sm:border-b-0">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-200">
                Tasks
              </p>
              <p className="mt-1 text-2xl font-black">{portfolioSummary.totalTasks}</p>
            </div>
            <div className="border-b border-blue-800 px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-200">
                Progress
              </p>
              <p className="mt-1 text-2xl font-black">{portfolioSummary.progress}%</p>
            </div>
            <div className="border-r border-blue-800 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-200">
                Spent
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatHours(portfolioSummary.spent)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-200">
                Alarms
              </p>
              <p className="mt-1 text-2xl font-black">{portfolioSummary.alarms}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-5 py-6 sm:px-8">
        <form
          onSubmit={handleCreateTask}
          className="mb-6 border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
        >
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blue-900">
                Task Intake
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Create a tracked task
              </h2>
            </div>
            {createError ? (
              <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                {createError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <label className="lg:col-span-3">
              <span className="text-xs font-black uppercase text-slate-600">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-900"
                placeholder="Daily operations report"
                required
              />
            </label>
            <label className="lg:col-span-3">
              <span className="text-xs font-black uppercase text-slate-600">Description</span>
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-900"
                placeholder="Optional context"
              />
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-black uppercase text-slate-600">Horizon</span>
              <select
                value={form.timeHorizon}
                onChange={(event) => setForm({ ...form, timeHorizon: event.target.value })}
                className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-900"
              >
                {HORIZONS.map((horizon) => (
                  <option key={horizon.key} value={horizon.key}>
                    {horizon.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="lg:col-span-1">
              <span className="text-xs font-black uppercase text-slate-600">Minutes</span>
              <input
                type="number"
                min="1"
                value={form.timeAllocated}
                onChange={(event) => setForm({ ...form, timeAllocated: event.target.value })}
                className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-900"
              />
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-black uppercase text-slate-600">Alarm</span>
              <input
                type="datetime-local"
                value={form.alarmTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    alarmTime: event.target.value,
                    isAlarmSet: Boolean(event.target.value),
                  })
                }
                className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-900"
              />
            </label>
            <button
              type="submit"
              disabled={isCreating}
              className="bg-blue-950 px-4 py-2 text-sm font-black text-white disabled:bg-slate-400 lg:col-span-1 lg:self-end"
            >
              {isCreating ? "Saving" : "Add"}
            </button>
          </div>
        </form>

        <div className="grid gap-5 xl:grid-cols-4">
          {HORIZONS.map((horizon) => (
            <HorizonColumn
              key={horizon.key}
              horizon={horizon}
              tasks={tasksByHorizon[horizon.key] ?? []}
              isLoading={isLoading}
              error={errorsByHorizon[horizon.key]}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
