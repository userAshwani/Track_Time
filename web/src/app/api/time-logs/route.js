import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import Category from "../../../../models/Category.js";
import Task from "../../../../models/Task.js";
import TimeLog from "../../../../models/TimeLog.js";

export const runtime = "nodejs";

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function dayBounds(date) {
  const day = date || new Date().toISOString().slice(0, 10);
  return [new Date(`${day}T00:00:00.000`), new Date(`${day}T23:59:59.999`), day];
}

function normalizeLog(body) {
  const startTime = body.startTime || body.start_time ? new Date(body.startTime || body.start_time) : null;
  const endTime = body.endTime || body.end_time ? new Date(body.endTime || body.end_time) : null;
  const durationMinutes = Number(body.durationMinutes ?? body.duration_minutes);

  return {
    taskId: body.taskId || body.task_id,
    startTime,
    endTime,
    durationMinutes: Number.isInteger(durationMinutes) ? durationMinutes : Number.NaN,
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
  };
}

async function attachTasks(logs) {
  const taskIds = [...new Set(logs.map((log) => String(log.taskId)))];
  const tasks = await Task.find({ _id: { $in: taskIds } }).lean();
  const categoryIds = [...new Set(tasks.map((task) => String(task.categoryId || "")).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));
  const taskById = new Map(tasks.map((task) => [
    String(task._id),
    { ...task, category: task.categoryId ? categoryById.get(String(task.categoryId)) || null : null },
  ]));

  return logs.map((log) => ({ ...log, task: taskById.get(String(log.taskId)) || null }));
}

export async function GET(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }

  await dbConnect();
  const params = new URL(request.url).searchParams;
  const [start, end, date] = dayBounds(params.get("date"));
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() - start.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [tasks, todayLogs, weeklyLogs] = await Promise.all([
    Task.find({ userId: currentUser._id, status: { $in: ["pending", "in_progress"] } }).sort({ title: 1 }).lean(),
    TimeLog.find({ userId: currentUser._id, startTime: { $gte: start, $lte: end } }).sort({ startTime: -1 }).lean(),
    TimeLog.find({ userId: currentUser._id, startTime: { $gte: weekStart, $lte: weekEnd } }).lean(),
  ]);

  const detailedTodayLogs = await attachTasks(todayLogs);
  const detailedWeeklyLogs = await attachTasks(weeklyLogs);
  const dailyHours = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);
    const day = current.toISOString().slice(0, 10);
    const minutes = weeklyLogs
      .filter((log) => new Date(log.startTime).toISOString().slice(0, 10) === day)
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    return {
      day: current.toLocaleDateString("en", { weekday: "short" }),
      date: current.toLocaleDateString("en", { month: "short", day: "numeric" }),
      hours: Math.round((minutes / 60) * 10) / 10,
    };
  });
  const categoryBreakdown = {};
  detailedWeeklyLogs.forEach((log) => {
    const category = log.task?.category;
    const name = category?.name || "Uncategorized";
    categoryBreakdown[name] ||= { name, color: category?.color || "#6B7280", hours: 0 };
    categoryBreakdown[name].hours += Math.round((log.durationMinutes / 60) * 10) / 10;
  });

  return jsonResponse({
    success: true,
    data: {
      date,
      tasks,
      todayLogs: detailedTodayLogs,
      dailyHours,
      categoryBreakdown: Object.values(categoryBreakdown),
      totalWeeklyHours: Math.round((weeklyLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60) * 10) / 10,
    },
  });
}

export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const payload = normalizeLog(await request.json());
  if (!payload.taskId || !payload.startTime || Number.isNaN(payload.startTime.getTime()) || !Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 1) {
    return jsonResponse({ success: false, error: "Task, start time, and duration are required." }, 400);
  }
  if (payload.endTime && payload.endTime <= payload.startTime) {
    return jsonResponse({ success: false, error: "End time must be after start time." }, 400);
  }
  await dbConnect();
  const task = await Task.exists({ _id: payload.taskId, userId: currentUser._id });
  if (!task) {
    return jsonResponse({ success: false, error: "Task not found." }, 404);
  }
  const log = await TimeLog.create({ ...payload, userId: currentUser._id });
  await Task.updateOne({ _id: payload.taskId }, { $inc: { timeSpent: payload.durationMinutes }, $set: { status: "in_progress" } });
  return jsonResponse({ success: true, data: log }, 201);
}

export async function PATCH(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const body = await request.json();
  const id = String(body.id || body._id || "").trim();
  const payload = normalizeLog(body);
  await dbConnect();
  const existing = await TimeLog.findOne({ _id: id, userId: currentUser._id }).lean();
  if (!existing) {
    return jsonResponse({ success: false, error: "Time log not found." }, 404);
  }
  const log = await TimeLog.findOneAndUpdate({ _id: id, userId: currentUser._id }, { $set: payload }, { new: true, runValidators: true }).lean();
  if (String(existing.taskId) === String(payload.taskId)) {
    await Task.updateOne({ _id: payload.taskId, userId: currentUser._id }, { $inc: { timeSpent: payload.durationMinutes - existing.durationMinutes } });
  }
  return jsonResponse({ success: true, data: log });
}

export async function DELETE(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const id = new URL(request.url).searchParams.get("id");
  await dbConnect();
  const log = await TimeLog.findOneAndDelete({ _id: id, userId: currentUser._id }).lean();
  if (!log) {
    return jsonResponse({ success: false, error: "Time log not found." }, 404);
  }
  await Task.updateOne({ _id: log.taskId, userId: currentUser._id }, { $inc: { timeSpent: -log.durationMinutes } });
  return jsonResponse({ success: true, data: log });
}
