import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import {
  combineDateAndTime,
  dateKey,
  isTaskScheduledOnDate,
  normalizeTimeString,
  taskCoversHour,
} from "../../../../lib/taskSchedule.js";
import Category from "../../../../models/Category.js";
import DailySchedule from "../../../../models/DailySchedule.js";
import Task from "../../../../models/Task.js";
import TimeLog from "../../../../models/TimeLog.js";

export const runtime = "nodejs";

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function dateBounds(date) {
  return [new Date(`${date}T00:00:00.000`), new Date(`${date}T23:59:59.999`)];
}

async function attachCategories(tasks) {
  const categoryIds = [...new Set(tasks.map((task) => String(task.categoryId || "")).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const byId = new Map(categories.map((category) => [String(category._id), category]));
  return tasks.map((task) => ({ ...task, category: task.categoryId ? byId.get(String(task.categoryId)) || null : null }));
}

export async function GET(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  await dbConnect();
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") || "daily";

  if (mode === "summary") {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    const schedules = await DailySchedule.find({
      userId: currentUser._id,
      date: { $gte: startDate.toISOString().slice(0, 10), $lte: endDate.toISOString().slice(0, 10) },
    }).sort({ date: 1 }).lean();
    const totalPlanned = schedules.reduce((sum, schedule) => sum + Number(schedule.plannedHours || 0), 0);
    const totalActual = schedules.reduce((sum, schedule) => sum + Number(schedule.actualHours || 0), 0);
    const tasksCompleted = await Task.countDocuments({ userId: currentUser._id, status: "completed", updatedAt: { $gte: startDate, $lte: endDate } });
    const dailyData = schedules.map((schedule) => ({
      date: new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" }),
      planned: schedule.plannedHours,
      actual: schedule.actualHours,
      completion: schedule.plannedHours > 0 ? Math.round((schedule.actualHours / schedule.plannedHours) * 1000) / 10 : 0,
    }));
    const productiveDays = [...schedules]
      .sort((a, b) => Number(b.actualHours || 0) - Number(a.actualHours || 0))
      .slice(0, 7)
      .map((schedule) => ({
        date: new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }),
        hours: schedule.actualHours,
        dayOfWeek: new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en", { weekday: "long" }),
      }));
    const dayOfWeekAverage = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
      const rows = schedules.filter((schedule) => new Date(`${schedule.date}T00:00:00`).toLocaleDateString("en", { weekday: "short" }) === day);
      return { day, average: rows.length ? Math.round((rows.reduce((sum, row) => sum + row.actualHours, 0) / rows.length) * 10) / 10 : 0 };
    });
    return jsonResponse({ success: true, data: { schedules, totalPlanned, totalActual, completionRate: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0, tasksCompleted, dailyData, productiveDays, dayOfWeekAverage } });
  }

  const date = params.get("date") || dateKey(new Date());
  const [start, end] = dateBounds(date);
  const [timeLogs, schedule] = await Promise.all([
    TimeLog.find({ userId: currentUser._id, startTime: { $gte: start, $lte: end } }).lean(),
    DailySchedule.findOneAndUpdate({ userId: currentUser._id, date }, { $setOnInsert: { plannedHours: 8, actualHours: 0 } }, { upsert: true, new: true }).lean(),
  ]);
  const actualHours = Math.round((timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60) * 10) / 10;
  await DailySchedule.updateOne({ _id: schedule._id }, { $set: { actualHours } });
  const [rangeTasks, allTasks, categories] = await Promise.all([
    Task.find({
      userId: currentUser._id,
      $or: [
        { startDate: { $lte: end }, dueDate: { $gte: start } },
        { startDate: null, dueDate: { $gte: start, $lte: end } },
        { dueDate: null, startDate: { $gte: start, $lte: end } },
      ],
    }).sort({ scheduleOrder: 1, startDate: 1, dueDate: 1 }).lean(),
    Task.find({ userId: currentUser._id }).sort({ startDate: 1, dueDate: 1, title: 1 }).lean(),
    Category.find({ userId: currentUser._id }).sort({ name: 1 }).lean(),
  ]);
  const tasks = rangeTasks.filter((task) => isTaskScheduledOnDate(task, date));
  const detailedTasks = await attachCategories(tasks);
  const detailedAllTasks = await attachCategories(allTasks);
  const detailedLogs = await Promise.all(timeLogs.map(async (log) => {
    const task = await Task.findOne({ _id: log.taskId, userId: currentUser._id }).lean();
    const [detailedTask] = task ? await attachCategories([task]) : [null];
    return { ...log, task: detailedTask };
  }));
  const hourlyBreakdown = Array.from({ length: 17 }, (_, index) => {
    const hour = index + 7;
    const logs = detailedLogs.filter((log) => new Date(log.startTime).getHours() === hour);
    const plannedTasks = detailedTasks.filter((task) => taskCoversHour(task, date, hour));
    return {
      hour: new Date(2000, 0, 1, hour).toLocaleTimeString("en", { hour: "numeric" }),
      logs,
      plannedTasks,
      isEmpty: logs.length === 0 && plannedTasks.length === 0,
    };
  });
  return jsonResponse({ success: true, data: { date, schedule: { ...schedule, actualHours }, tasks: detailedTasks, allTasks: detailedAllTasks, categories, hourlyBreakdown } });
}

export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const body = await request.json();
  await dbConnect();
  if (body.action === "planned-hours") {
    const schedule = await DailySchedule.findOneAndUpdate(
      { userId: currentUser._id, date: body.date },
      { $set: { plannedHours: Number(body.plannedHours ?? body.planned_hours) } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return jsonResponse({ success: true, data: schedule });
  }
  if (body.action === "add-task") {
    const date = body.date;
    const slotStart = normalizeTimeString(body.slotStart || "09:00", "09:00");
    const slotEnd = normalizeTimeString(body.slotEnd || "10:00", "10:00");
    const startDate = combineDateAndTime(date, slotStart, slotStart);
    const dueDate = combineDateAndTime(date, slotEnd, slotEnd);
    const task = await Task.findOneAndUpdate(
      { _id: body.taskId || body.task_id, userId: currentUser._id },
      {
        $set: {
          startDate,
          dueDate,
          slotStart,
          slotEnd,
          isAlarmSet: true,
          alarmTime: startDate,
        },
      },
      { new: true }
    ).lean();
    if (!task) {
      return jsonResponse({ success: false, error: "Task not found." }, 404);
    }
    return jsonResponse({ success: true, data: task });
  }
  if (body.action === "update-order") {
    await Promise.all((body.tasks || []).map((task) => Task.updateOne({ _id: task.id, userId: currentUser._id }, { $set: { scheduleOrder: task.order } })));
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false, error: "Unknown schedule action." }, 400);
}
