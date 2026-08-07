const statusStyles = {
  pending: "border-slate-300 bg-slate-50 text-slate-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-800",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-800",
  archived: "border-slate-200 bg-slate-100 text-slate-500",
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

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
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
  const isOverAllocated = timeSpent > timeAllocated;
  const statusClass = statusStyles[task.status] ?? statusStyles.pending;

  return (
    <article className="border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-bold leading-6 text-slate-950">
            {task.title}
          </h3>
          <span
            className={`shrink-0 border px-2.5 py-1 text-xs font-bold uppercase tracking-normal ${statusClass}`}
          >
            {statusLabels[task.status] ?? "Pending"}
          </span>
        </div>
        {task.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {task.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">Time Utilization</span>
            <span className="font-bold text-slate-950">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden border border-slate-200 bg-slate-100">
            <div
              className={`h-full ${isOverAllocated ? "bg-red-700" : "bg-blue-800"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <span>{formatMinutes(timeSpent)} spent</span>
            <span>{formatMinutes(timeAllocated)} allocated</span>
          </div>
        </div>

        <div className="grid grid-cols-2 border border-slate-200 text-sm">
          <div className="border-r border-slate-200 px-3 py-2">
            <p className="font-semibold uppercase tracking-normal text-slate-500">
              Alarm
            </p>
            <p className="mt-1 font-bold text-slate-950">
              {task.isAlarmSet ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div className="px-3 py-2">
            <p className="font-semibold uppercase tracking-normal text-slate-500">
              Notify At
            </p>
            <p className="mt-1 font-bold text-slate-950">
              {task.isAlarmSet ? formatAlarm(task.alarmTime) : "Not scheduled"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
