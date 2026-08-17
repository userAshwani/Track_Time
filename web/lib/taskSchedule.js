export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
];

export const DEFAULT_WEEKLY_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const REMINDER_OFFSETS_MINUTES = [30, 10];
export const OVERDUE_REMINDER_INTERVAL_MS = 5 * 60 * 1000;

export function dateKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function normalizeWeeklyDays(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [...DEFAULT_WEEKLY_DAYS];
  }

  const days = [...new Set(value.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  return days.length > 0 ? days.sort((a, b) => a - b) : [...DEFAULT_WEEKLY_DAYS];
}

export function normalizeTimeString(value, fallback = "09:00") {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseTimeToMinutes(value) {
  const normalized = normalizeTimeString(value, "00:00");
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function combineDateAndTime(dateValue, timeValue, fallbackTime = "09:00") {
  const key = dateKey(dateValue);
  if (!key) return null;
  const time = normalizeTimeString(timeValue, fallbackTime);
  const date = new Date(`${key}T${time}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getTaskDateRange(task) {
  const start = dateKey(task?.startDate) || dateKey(task?.dueDate);
  const end = dateKey(task?.dueDate) || dateKey(task?.startDate);
  return { start, end };
}

export function isTaskScheduledOnDate(task, isoDate) {
  if (!task || !isoDate) return false;
  if (["completed", "cancelled", "archived"].includes(task.status)) return false;

  const { start, end } = getTaskDateRange(task);
  if (!start && !end) return false;
  if (isoDate < (start || end) || isoDate > (end || start)) return false;

  const day = new Date(`${isoDate}T12:00:00`).getDay();
  const weeklyDays = normalizeWeeklyDays(task.weeklyDays);
  return weeklyDays.includes(day);
}

export function getTaskSlotBounds(task, isoDate = dateKey(new Date())) {
  if (!isTaskScheduledOnDate(task, isoDate)) return null;

  const fallbackStart = task.startDate || task.dueDate || task.alarmTime;
  const fallbackEnd = task.dueDate || task.startDate;
  const derivedStart = fallbackStart
    ? `${String(new Date(fallbackStart).getHours()).padStart(2, "0")}:${String(new Date(fallbackStart).getMinutes()).padStart(2, "0")}`
    : "09:00";
  const derivedEnd = fallbackEnd
    ? `${String(new Date(fallbackEnd).getHours()).padStart(2, "0")}:${String(new Date(fallbackEnd).getMinutes()).padStart(2, "0")}`
    : "10:00";

  let slotStart = normalizeTimeString(task.slotStart || task.workStartTime, derivedStart);
  let slotEnd = normalizeTimeString(task.slotEnd || task.workEndTime, derivedEnd);

  if (parseTimeToMinutes(slotEnd) <= parseTimeToMinutes(slotStart)) {
    const endMinutes = Math.min(23 * 60 + 59, parseTimeToMinutes(slotStart) + 60);
    slotEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  }

  const startAt = combineDateAndTime(isoDate, slotStart, slotStart);
  const endAt = combineDateAndTime(isoDate, slotEnd, slotEnd);
  if (!startAt || !endAt) return null;
  return { startAt, endAt, slotStart, slotEnd };
}

export function taskCoversHour(task, isoDate, hour) {
  const bounds = getTaskSlotBounds(task, isoDate);
  if (!bounds) return false;
  const hourStart = hour * 60;
  const hourEnd = hourStart + 60;
  const slotStart = parseTimeToMinutes(bounds.slotStart);
  const slotEnd = Math.max(slotStart + 1, parseTimeToMinutes(bounds.slotEnd));
  return slotStart < hourEnd && slotEnd > hourStart;
}

export function formatClock(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}
