"use client";

import {
  AlarmClock,
  Check,
  Clock3,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

const statusStyles = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-emerald-50 text-emerald-700",
  completed: "bg-teal-50 text-teal-700",
  archived: "bg-slate-100 text-slate-400",
};

const statusLabels = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  archived: "Archived",
};

function formatMinutes(minutes = 0) {
  const normalizedMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

function formatAlarm(alarmTime) {
  if (!alarmTime) {
    return "No alarm";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(alarmTime));
}

function ActionButton({ children, icon: Icon, onClick, tone = "default", disabled }) {
  const toneClass =
    tone === "danger"
      ? "border-red-100 text-red-600 hover:bg-red-50"
      : tone === "primary"
        ? "border-emerald-100 text-emerald-700 hover:bg-emerald-50"
        : "border-slate-200 text-slate-600 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export default function TaskCard({ task, onPatch, onDelete, isBusy }) {
  const timeAllocated = Math.max(1, Number(task.timeAllocated) || 1);
  const timeSpent = Math.max(0, Number(task.timeSpent) || 0);
  const progress = Math.min(100, Math.round((timeSpent / timeAllocated) * 100));
  const statusClass = statusStyles[task.status] ?? statusStyles.pending;
  const isComplete = task.status === "completed";

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold leading-6 text-slate-950">
            {task.title}
          </h4>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
              {task.description}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
        >
          {statusLabels[task.status] ?? "Pending"}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-500">Time progress</span>
          <span className="font-bold text-slate-950">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{formatMinutes(timeSpent)} spent</span>
          <span>{formatMinutes(timeAllocated)} planned</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <AlarmClock className="h-3.5 w-3.5" />
            Alarm
          </div>
          <p className="mt-1 truncate font-bold text-slate-800">
            {task.isAlarmSet ? formatAlarm(task.alarmTime) : "Not set"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Horizon
          </div>
          <p className="mt-1 font-bold text-slate-800">
            {String(task.timeHorizon).replace("1_", "1 ")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isComplete ? (
          <>
            <ActionButton
              icon={Play}
              tone="primary"
              disabled={isBusy}
              onClick={() => onPatch(task, { status: "in_progress" })}
            >
              Start
            </ActionButton>
            <ActionButton
              icon={Plus}
              disabled={isBusy}
              onClick={() =>
                onPatch(task, {
                  timeSpent: Math.min(timeAllocated, timeSpent + 15),
                  status: "in_progress",
                })
              }
            >
              +15m
            </ActionButton>
            <ActionButton
              icon={Check}
              tone="primary"
              disabled={isBusy}
              onClick={() =>
                onPatch(task, {
                  status: "completed",
                  timeSpent: Math.max(timeSpent, timeAllocated),
                })
              }
            >
              Done
            </ActionButton>
          </>
        ) : null}
        <ActionButton
          icon={Trash2}
          tone="danger"
          disabled={isBusy}
          onClick={() => onDelete(task)}
        >
          Delete
        </ActionButton>
      </div>
    </article>
  );
}
