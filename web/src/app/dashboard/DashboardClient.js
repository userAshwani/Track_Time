"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  ListChecks,
  MessageSquare,
  Plus,
  Save,
  Timer,
  Trash2,
  UserRound,
} from "lucide-react";

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
  return new Date().toISOString().slice(0, 10);
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function hours(minutes) {
  return Math.round(((Number(minutes) || 0) / 60) * 10) / 10;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "No date";
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

function TaskForm({ categories, task, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    categoryId: task?.categoryId || "",
    priority: task?.priority || "medium",
    status: task?.status || "pending",
    dueDate: toLocalInput(task?.dueDate),
    estimatedHours: task?.estimatedHours ?? "",
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...task,
          ...form,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours === "" ? null : Number(form.estimatedHours),
          timeAllocated: Math.max(1, Math.round((Number(form.estimatedHours) || 1) * 60)),
          timeHorizon: "1_Day",
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
        <Field label="Due date">
          <input type="datetime-local" className={inputClass} value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
        </Field>
        <Field label="Estimated hours">
          <input type="number" min="0" step="0.5" className={inputClass} value={form.estimatedHours} onChange={(event) => update("estimatedHours", event.target.value)} />
        </Field>
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

function TasksView({ tasks, categories, reload }) {
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
      (filters.date_filter === "today" && dueDate?.toISOString().slice(0, 10) === today) ||
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTasks.map((task) => {
          const logged = hours(task.timeLogs?.reduce((sum, log) => sum + log.durationMinutes, 0) || task.timeSpent);
          const estimate = Number(task.estimatedHours) || hours(task.timeAllocated);
          const progress = estimate > 0 ? Math.min(100, Math.round((logged / estimate) * 100)) : 0;
          return (
            <article key={task._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              {editing?._id === task._id ? (
                <TaskForm categories={categories} task={editing} onSubmit={saveTask} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-lg font-bold text-slate-950">{task.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{task.priority}</span>
                  </div>
                  {task.category ? <p className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${task.category.color}20`, color: task.category.color }}>{task.category.name}</p> : null}
                  {task.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p> : null}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-lg bg-slate-50 p-2 font-semibold text-slate-600">{task.status.replace("_", " ")}</span>
                    <span className="rounded-lg bg-slate-50 p-2 font-semibold text-slate-600">{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>{logged}h / {estimate}h</span><span>{progress}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.status !== "completed" ? <button className={subtleButton} onClick={() => saveTask({ ...task, status: "completed" })}><CheckCircle2 className="h-4 w-4" />Complete</button> : null}
                    <button className={subtleButton} onClick={() => setEditing(task)}>Edit</button>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700" onClick={() => deleteTask(task)}><Trash2 className="h-4 w-4" />Delete</button>
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

function CategoriesView({ categories, reload }) {
  const [form, setForm] = useState({ name: "", color: COLORS[3], icon: "folder" });
  const [editing, setEditing] = useState(null);
  const activeForm = editing || form;
  const setActiveForm = editing ? setEditing : setForm;

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
              <div className="mt-4 flex gap-2">
                <button className={subtleButton} onClick={() => setEditing(category)}>Edit</button>
                <button className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700" onClick={() => deleteCategory(category)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TimerView({ timeData, reload }) {
  const [form, setForm] = useState({ taskId: "", startTime: toLocalInput(new Date()), endTime: "", notes: "" });
  const totalToday = hours(timeData.todayLogs?.reduce((sum, log) => sum + log.durationMinutes, 0));

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
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
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
    </section>
  );
}

function DailyView({ scheduleData, reload }) {
  const [date, setDate] = useState(scheduleData.date || todayString());
  const [plannedHours, setPlannedHours] = useState(scheduleData.schedule?.plannedHours ?? 8);
  const [taskId, setTaskId] = useState("");

  async function loadDate(nextDate) {
    setDate(nextDate);
    await reload(nextDate);
  }

  async function postSchedule(body) {
    await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={Clock3} label="Planned" value={`${scheduleData.schedule?.plannedHours ?? 0}h`} helper="Target hours" />
            <Metric icon={CheckCircle2} label="Actual" value={`${scheduleData.schedule?.actualHours ?? 0}h`} helper="Logged hours" color="text-green-700" bg="bg-green-50" />
            <Metric icon={BarChart3} label="Complete" value={`${scheduleData.schedule?.plannedHours ? Math.round((scheduleData.schedule.actualHours / scheduleData.schedule.plannedHours) * 100) : 0}%`} helper="Actual vs planned" color="text-amber-700" bg="bg-amber-50" />
          </div>
          <div className="mt-5 flex gap-2">
            <select className={inputClass} value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="">Add task to schedule</option>
              {scheduleData.allTasks?.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
            </select>
            <button className={primaryButton} onClick={() => taskId && postSchedule({ action: "add-task", date, taskId })}><Plus className="h-4 w-4" />Add</button>
          </div>
          <div className="mt-5 space-y-3">
            {scheduleData.tasks?.map((task) => <div key={task._id} className="rounded-lg border-l-4 bg-slate-50 p-3" style={{ borderLeftColor: task.category?.color || "#6B7280" }}><p className="font-bold">{task.title}</p><p className="text-sm text-slate-500">{task.priority} priority - {task.status.replace("_", " ")}</p></div>)}
            {scheduleData.tasks?.length === 0 ? <p className="text-sm text-slate-500">No tasks scheduled for this day.</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Hourly Breakdown</h2>
          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">
            {scheduleData.hourlyBreakdown?.map((hour) => <div key={hour.hour} className="rounded-lg bg-slate-50 p-2"><p className="text-sm font-bold text-slate-700">{hour.hour}</p>{hour.logs.map((log) => <p key={log._id} className="text-xs text-slate-500">{log.task?.title} - {hours(log.durationMinutes)}h</p>)}{hour.isEmpty ? <p className="text-xs text-slate-400">No activity</p> : null}</div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryView({ summary }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Clock3} label="Planned" value={`${summary.totalPlanned || 0}h`} helper="Last 30 days" />
        <Metric icon={CheckCircle2} label="Actual" value={`${summary.totalActual || 0}h`} helper="Logged" color="text-green-700" bg="bg-green-50" />
        <Metric icon={BarChart3} label="Completion" value={`${summary.completionRate || 0}%`} helper="Actual vs planned" color="text-amber-700" bg="bg-amber-50" />
        <Metric icon={ListChecks} label="Tasks Done" value={summary.tasksCompleted || 0} helper="Completed" color="text-sky-700" bg="bg-sky-50" />
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
  const totalTasksToday = tasks.filter((task) => task.dueDate?.slice(0, 10) === today).length;
  const completedTasksToday = tasks.filter((task) => task.dueDate?.slice(0, 10) === today && task.status === "completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const timeSpentToday = hours(timeData.todayLogs?.reduce((sum, log) => sum + log.durationMinutes, 0));
  const productivityScore = Math.round((totalTasksToday ? (completedTasksToday / totalTasksToday) * 50 : 0) + Math.min(timeSpentToday * 5, 50));
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

export default function DashboardClient({ user }) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") || "overview";
  const [state, setState] = useState({ tasks: [], categories: [], timeData: {}, scheduleData: {}, summary: {}, adminData: {}, loading: true, error: "" });
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
        ((tasks.data || []).length < 10 || (categories.data || []).length < 6)
      ) {
        demoSeededRef.current = true;
        const seedResponse = await fetch("/api/superadmin/seed-demo", { method: "POST" });
        const seedPayload = await seedResponse.json();

        if (!seedResponse.ok || !seedPayload.success) {
          throw new Error(seedPayload.error || "Unable to seed demo CRM data.");
        }

        await load(scheduleDate);
        return;
      }

      setState({ tasks: tasks.data || [], categories: categories.data || [], timeData: timeData.data || {}, scheduleData: scheduleData.data || {}, summary: summary.data || {}, adminData: admin.data || {}, loading: false, error: "" });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [user.email, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  const content = useMemo(() => {
    if (state.loading) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">Loading workspace...</p>;
    if (state.error) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{state.error}</p>;
    if (activeView === "tasks") return <TasksView tasks={state.tasks} categories={state.categories} reload={load} />;
    if (activeView === "categories") return <CategoriesView categories={state.categories} reload={load} />;
    if (activeView === "timer") return <TimerView timeData={state.timeData} reload={load} />;
    if (activeView === "daily") return <DailyView scheduleData={state.scheduleData} reload={load} />;
    if (activeView === "summary") return <SummaryView summary={state.summary} />;
    if (activeView === "profile") return <ProfileView user={user} />;
    if (activeView === "admin") return <AdminView data={state.adminData} reload={load} />;
    return <Overview user={user} tasks={state.tasks} timeData={state.timeData} />;
  }, [activeView, state, user, load]);

  return <div className="mx-auto max-w-7xl">{content}</div>;
}
