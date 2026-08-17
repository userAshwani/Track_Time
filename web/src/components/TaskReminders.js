"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Play } from "lucide-react";
import {
  OVERDUE_REMINDER_INTERVAL_MS,
  REMINDER_OFFSETS_MINUTES,
  dateKey,
  formatClock,
  getTaskSlotBounds,
  normalizeTimeString,
} from "../../lib/taskSchedule.js";
import {
  formatCountdown,
  playNotificationChime,
  playTaskRing,
  unlockNotificationAudio,
} from "../../lib/notificationSound.js";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300";
const subtleButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50";

function todayString() {
  return dateKey(new Date());
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

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default function TaskReminders({ tasks, onReload, onStartTask }) {
  const [permission, setPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [now, setNow] = useState(() => Date.now());
  const [activeReminder, setActiveReminder] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    startDate: todayString(),
    dueDate: todayString(),
    slotStart: "09:00",
    slotEnd: "10:00",
  });
  const shownRef = useRef(new Set());
  const lastOverdueRef = useRef(new Map());
  const ringingTaskRef = useRef("");
  const lastCountdownNotifyRef = useRef(0);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    async function ensurePermission() {
      if (typeof Notification === "undefined") {
        setPermission("unsupported");
        return;
      }
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        try {
          const result = await Notification.requestPermission();
          setPermission(result);
        } catch {
          setPermission(Notification.permission);
        }
      }
      await unlockNotificationAudio();
    }

    ensurePermission();
    const onGesture = () => {
      ensurePermission();
      unlockNotificationAudio();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    await unlockNotificationAudio();
  }

  async function patchTask(taskId, body) {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Unable to update task reminder.");
    }
    await onReload();
  }

  async function confirmTask(task) {
    await patchTask(task._id, { scheduleConfirmed: true, lastReminderAt: new Date().toISOString() });
    setActiveReminder(null);
  }

  async function startFromReminder(task) {
    ringingTaskRef.current = "";
    await patchTask(task._id, {
      status: "in_progress",
      scheduleConfirmed: true,
      lastReminderAt: new Date().toISOString(),
    });
    onStartTask?.(task);
    setActiveReminder(null);
  }

  function openReschedule(task) {
    setRescheduleForm({
      startDate: toDateInput(task.startDate) || todayString(),
      dueDate: toDateInput(task.dueDate) || todayString(),
      slotStart: normalizeTimeString(task.slotStart || toTimeInput(task.startDate || task.dueDate), "09:00"),
      slotEnd: normalizeTimeString(task.slotEnd || toTimeInput(task.dueDate), "10:00"),
    });
    setActiveReminder({ task, kind: "reschedule", label: "Reschedule task" });
  }

  async function submitReschedule(event) {
    event.preventDefault();
    if (!activeReminder?.task) return;
    await patchTask(activeReminder.task._id, {
      startDate: rescheduleForm.startDate,
      dueDate: rescheduleForm.dueDate,
      slotStart: rescheduleForm.slotStart,
      slotEnd: rescheduleForm.slotEnd,
      scheduleConfirmed: false,
      lastReminderAt: new Date().toISOString(),
    });
    shownRef.current = new Set(
      [...shownRef.current].filter((key) => !key.startsWith(`${activeReminder.task._id}:`))
    );
    lastOverdueRef.current.delete(activeReminder.task._id);
    ringingTaskRef.current = "";
    setActiveReminder(null);
  }

  function showBrowserNotification(task, title, body, tag, { urgent = false } = {}) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const options = {
      body,
      tag,
      renotify: true,
      requireInteraction: true,
      silent: false,
      badge: "/icon.svg",
      icon: "/icon.svg",
      data: { taskId: task._id, url: "/dashboard?view=daily" },
      actions: [
        { action: "confirm", title: "Confirm" },
        { action: "reschedule", title: "Reschedule" },
        { action: "start", title: "Start" },
      ],
      ...(urgent ? { vibrate: [220, 120, 220, 120, 320] } : {}),
    };
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options).catch(() => {
          try {
            new Notification(title, options);
          } catch {
            // Ignore browsers that reject Notification constructor options.
          }
        });
      });
      return;
    }
    try {
      new Notification(title, options);
    } catch {
      // Ignore unsupported Notification options.
    }
  }

  useEffect(() => {
    function onMessage(event) {
      if (event.data?.type !== "TRACK_TIME_REMINDER_ACTION") return;
      const task = tasks.find((item) => item._id === event.data.taskId);
      if (!task) return;
      if (event.data.action === "confirm") confirmTask(task);
      if (event.data.action === "reschedule") openReschedule(task);
      if (event.data.action === "start") startFromReminder(task);
    }
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  });

  const countdownItems = useMemo(() => {
    const today = todayString();
    return tasks
      .map((task) => {
        if (task.status === "in_progress" || task.status === "completed" || task.status === "cancelled") {
          return null;
        }
        const bounds = getTaskSlotBounds(task, today);
        if (!bounds) return null;
        const secondsUntilStart = Math.ceil((bounds.startAt.getTime() - now) / 1000);
        if (secondsUntilStart > 30 * 60) return null;
        return {
          task,
          bounds,
          secondsUntilStart,
          isDue: secondsUntilStart <= 0,
          slotLabel: `${formatClock(bounds.startAt)}–${formatClock(bounds.endAt)}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.secondsUntilStart - b.secondsUntilStart);
  }, [tasks, now]);

  const primaryCountdown = countdownItems[0] || null;

  useEffect(() => {
    if (!primaryCountdown) return;
    const { task, secondsUntilStart, isDue, slotLabel } = primaryCountdown;
    const tag = `countdown:${task._id}:${todayString()}`;
    const shouldRefresh =
      isDue ||
      secondsUntilStart === 30 * 60 ||
      secondsUntilStart === 10 * 60 ||
      now - lastCountdownNotifyRef.current >= 15000;

    if (!shouldRefresh) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    lastCountdownNotifyRef.current = now;
    const title = isDue ? `Ringing: ${task.title}` : `Upcoming in ${formatCountdown(secondsUntilStart)}`;
    const body = isDue
      ? `Task slot started (${slotLabel}). Start it now.`
      : `${task.title} starts at ${slotLabel}. Live countdown ${formatCountdown(secondsUntilStart)}.`;
    showBrowserNotification(task, title, body, tag, { urgent: isDue });
  }, [primaryCountdown, now]);

  useEffect(() => {
    if (!primaryCountdown?.isDue) return undefined;
    const ringKey = `${primaryCountdown.task._id}:${todayString()}:due-ring`;
    if (ringingTaskRef.current !== ringKey) {
      ringingTaskRef.current = ringKey;
      playTaskRing({ loops: 5 });
    }
    const keepRinging = window.setInterval(() => {
      playTaskRing({ loops: 3 });
    }, OVERDUE_REMINDER_INTERVAL_MS);
    return () => window.clearInterval(keepRinging);
  }, [primaryCountdown?.isDue, primaryCountdown?.task?._id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      const today = todayString();

      tasks.forEach((task) => {
        if (task.status === "in_progress" || task.status === "completed" || task.status === "cancelled") {
          return;
        }
        const bounds = getTaskSlotBounds(task, today);
        if (!bounds) return;

        const minutesUntilStart = Math.round((bounds.startAt.getTime() - current.getTime()) / 60000);
        const slotLabel = `${formatClock(bounds.startAt)}–${formatClock(bounds.endAt)}`;

        if (minutesUntilStart <= 30 && minutesUntilStart > 29) {
          const enterKey = `${task._id}:${today}:enter-30`;
          if (!shownRef.current.has(enterKey)) {
            shownRef.current.add(enterKey);
            setActiveReminder({
              task,
              kind: "upcoming",
              label: "Under 30 minutes — countdown started",
              slotLabel,
            });
            playNotificationChime();
            showBrowserNotification(
              task,
              `Countdown: ${task.title}`,
              `Under 30 minutes · ${slotLabel}`,
              enterKey
            );
          }
        }

        REMINDER_OFFSETS_MINUTES.forEach((offset) => {
          if (minutesUntilStart > offset || minutesUntilStart < offset - 1) return;
          const key = `${task._id}:${today}:${offset}`;
          if (shownRef.current.has(key)) return;
          shownRef.current.add(key);
          const label = `${offset} minutes before`;
          setActiveReminder({ task, kind: "upcoming", label, slotLabel });
          playNotificationChime();
          showBrowserNotification(
            task,
            `Upcoming: ${task.title}`,
            `${label} · ${slotLabel} · countdown active`,
            key
          );
          patchTask(task._id, { lastReminderAt: current.toISOString() }).catch(() => {});
        });

        if (current >= bounds.startAt) {
          const lastShown = lastOverdueRef.current.get(task._id) || 0;
          if (current.getTime() - lastShown < OVERDUE_REMINDER_INTERVAL_MS) return;
          lastOverdueRef.current.set(task._id, current.getTime());
          const key = `${task._id}:${today}:overdue:${Math.floor(current.getTime() / OVERDUE_REMINDER_INTERVAL_MS)}`;
          if (shownRef.current.has(key)) return;
          shownRef.current.add(key);
          setActiveReminder({ task, kind: "overdue", label: "Task time — ringing now", slotLabel });
          playTaskRing({ loops: 5 });
          showBrowserNotification(
            task,
            `Start now: ${task.title}`,
            `Your ${slotLabel} slot started. Ringing until you start the task.`,
            key,
            { urgent: true }
          );
          patchTask(task._id, { lastReminderAt: current.toISOString() }).catch(() => {});
        }
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [tasks]);

  return (
    <>
      {permission === "default" ? (
        <div className="fixed bottom-5 left-5 z-50 max-w-sm rounded-lg border border-emerald-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-bold text-slate-950">Enable task reminders</p>
          <p className="mt-1 text-xs text-slate-500">
            Allow notifications for countdown alerts, start-time rings, and PWA reminders.
          </p>
          <button className={`${primaryButton} mt-3`} type="button" onClick={requestPermission}>
            <Bell className="h-4 w-4" />
            Allow notifications
          </button>
        </div>
      ) : null}

      {primaryCountdown ? (
        <div
          className={`fixed inset-x-3 top-3 z-[70] mx-auto max-w-2xl rounded-xl border p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:left-auto ${
            primaryCountdown.isDue ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`text-xs font-bold uppercase tracking-wide ${
                  primaryCountdown.isDue ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {primaryCountdown.isDue ? "Task time — ringing" : "Upcoming task countdown"}
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-slate-950">
                {primaryCountdown.task.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{primaryCountdown.slotLabel}</p>
            </div>
            <div className="text-right">
              <p
                className={`font-mono text-3xl font-black tabular-nums ${
                  primaryCountdown.isDue ? "text-red-700" : "text-emerald-800"
                }`}
              >
                {primaryCountdown.isDue ? "00:00" : formatCountdown(primaryCountdown.secondsUntilStart)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {primaryCountdown.isDue ? "Start this task now" : "until start"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButton}
              onClick={() => startFromReminder(primaryCountdown.task)}
            >
              <Play className="h-4 w-4" />
              Start
            </button>
            <button
              type="button"
              className={subtleButton}
              onClick={() => confirmTask(primaryCountdown.task)}
            >
              Confirm
            </button>
            <button
              type="button"
              className={subtleButton}
              onClick={() => openReschedule(primaryCountdown.task)}
            >
              Reschedule
            </button>
          </div>
          {countdownItems.length > 1 ? (
            <div className="mt-3 space-y-1 border-t border-emerald-200/70 pt-3">
              {countdownItems.slice(1, 4).map((item) => (
                <div
                  key={item.task._id}
                  className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600"
                >
                  <span className="truncate">{item.task.title}</span>
                  <span className="font-mono tabular-nums">
                    {item.isDue ? "DUE" : formatCountdown(item.secondsUntilStart)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeReminder ? (
        <div className="fixed inset-x-4 bottom-5 z-[60] mx-auto max-w-lg rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-5 sm:left-auto">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                {activeReminder.label}
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-950">{activeReminder.task.title}</h3>
              {activeReminder.slotLabel ? (
                <p className="mt-1 text-sm text-slate-500">{activeReminder.slotLabel}</p>
              ) : null}
              {activeReminder.kind === "reschedule" ? (
                <form onSubmit={submitReschedule} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Start date">
                    <input
                      type="date"
                      className={inputClass}
                      value={rescheduleForm.startDate}
                      onChange={(event) =>
                        setRescheduleForm({ ...rescheduleForm, startDate: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Due date">
                    <input
                      type="date"
                      className={inputClass}
                      value={rescheduleForm.dueDate}
                      onChange={(event) =>
                        setRescheduleForm({ ...rescheduleForm, dueDate: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Slot start">
                    <input
                      type="time"
                      className={inputClass}
                      value={rescheduleForm.slotStart}
                      onChange={(event) =>
                        setRescheduleForm({ ...rescheduleForm, slotStart: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Slot end">
                    <input
                      type="time"
                      className={inputClass}
                      value={rescheduleForm.slotEnd}
                      onChange={(event) =>
                        setRescheduleForm({ ...rescheduleForm, slotEnd: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <div className="sm:col-span-2 flex flex-wrap gap-2">
                    <button type="submit" className={primaryButton}>
                      Save new schedule
                    </button>
                    <button type="button" className={subtleButton} onClick={() => setActiveReminder(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButton}
                    onClick={() => confirmTask(activeReminder.task)}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className={subtleButton}
                    onClick={() => openReschedule(activeReminder.task)}
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className={subtleButton}
                    onClick={() => startFromReminder(activeReminder.task)}
                  >
                    <Play className="h-4 w-4" />
                    Start task
                  </button>
                  <button type="button" className={subtleButton} onClick={() => setActiveReminder(null)}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
