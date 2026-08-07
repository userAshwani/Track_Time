const statusStyles = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-emerald-50 text-emerald-700",
  completed: "bg-teal-50 text-teal-700",
  archived: "bg-slate-100 text-slate-400",
};

const statusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
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

export default function TaskCard({ task }) {
  const timeAllocated = Math.max(1, Number(task.timeAllocated) || 1);
  const timeSpent = Math.max(0, Number(task.timeSpent) || 0);
  const progress = Math.min(100, Math.round((timeSpent / timeAllocated) * 100));
  const statusClass = statusStyles[task.status] ?? statusStyles.pending;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-bold leading-6 text-slate-900">
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
          <span className="font-semibold text-slate-500">Time utilization</span>
          <span className="font-bold text-slate-900">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{formatMinutes(timeSpent)} spent</span>
          <span>{formatMinutes(timeAllocated)} allocated</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Alarm</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {task.isAlarmSet ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Notify</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {task.isAlarmSet ? formatAlarm(task.alarmTime) : "Not scheduled"}
          </p>
        </div>
      </div>
    </article>
  );
}
