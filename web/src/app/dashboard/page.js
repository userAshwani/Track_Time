"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function DashboardPage() {
  const [tasksByHorizon, setTasksByHorizon] = useState(
    Object.fromEntries(HORIZONS.map((horizon) => [horizon.key, []]))
  );
  const [errorsByHorizon, setErrorsByHorizon] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setIsLoading(true);
      setErrorsByHorizon({});

      const results = await Promise.all(
        HORIZONS.map(async (horizon) => {
          try {
            const response = await fetch(`/api/tasks?timeHorizon=${horizon.key}`, {
              cache: "no-store",
              signal: controller.signal,
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

      if (controller.signal.aborted) {
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

    loadTasks();

    return () => {
      controller.abort();
    };
  }, []);

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
