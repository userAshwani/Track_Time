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

function normalizeCategory(body) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    color: typeof body.color === "string" ? body.color.trim() : "#6366F1",
    icon: typeof body.icon === "string" ? body.icon.trim() : "folder",
  };
}

async function categoriesWithStats(userId) {
  const [categories, tasks, timeLogs] = await Promise.all([
    Category.find({ userId }).sort({ name: 1 }).lean(),
    Task.find({ userId }).lean(),
    TimeLog.find({ userId }).lean(),
  ]);
  const logsByTask = new Map();
  timeLogs.forEach((log) => {
    const key = String(log.taskId);
    logsByTask.set(key, (logsByTask.get(key) || 0) + (Number(log.durationMinutes) || 0));
  });

  return categories.map((category) => {
    const categoryTasks = tasks.filter((task) => String(task.categoryId || "") === String(category._id));
    const totalMinutes = categoryTasks.reduce((sum, task) => sum + (logsByTask.get(String(task._id)) || 0), 0);
    return {
      ...category,
      tasksCount: categoryTasks.length,
      totalTimeHours: Math.round((totalMinutes / 60) * 10) / 10,
      completedTasks: categoryTasks.filter((task) => task.status === "completed").length,
      activeTasks: categoryTasks.filter((task) => ["pending", "in_progress"].includes(task.status)).length,
    };
  });
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  await dbConnect();
  return jsonResponse({ success: true, data: await categoriesWithStats(currentUser._id) });
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return jsonResponse({ success: false, error: "Authentication required." }, 401);
    }
    const payload = normalizeCategory(await request.json());
    if (!payload.name) {
      return jsonResponse({ success: false, error: "Category name is required." }, 400);
    }
    await dbConnect();
    const category = await Category.create({ ...payload, userId: currentUser._id });
    return jsonResponse({ success: true, data: category }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return jsonResponse({ success: false, error: "Category name already exists." }, 409);
    }
    console.error("POST /api/categories failed.", error);
    return jsonResponse({ success: false, error: "Unable to save category." }, 500);
  }
}

export async function PATCH(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const body = await request.json();
  const id = String(body.id || body._id || "").trim();
  if (!id) {
    return jsonResponse({ success: false, error: "Category id is required." }, 400);
  }
  const payload = normalizeCategory(body);
  await dbConnect();
  const category = await Category.findOneAndUpdate(
    { _id: id, userId: currentUser._id },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!category) {
    return jsonResponse({ success: false, error: "Category not found." }, 404);
  }
  return jsonResponse({ success: true, data: category });
}

export async function DELETE(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonResponse({ success: false, error: "Authentication required." }, 401);
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return jsonResponse({ success: false, error: "Category id is required." }, 400);
  }
  await dbConnect();
  const tasksCount = await Task.countDocuments({ userId: currentUser._id, categoryId: id });
  if (tasksCount > 0) {
    return jsonResponse({ success: false, error: `Cannot delete category. It has ${tasksCount} task(s).` }, 409);
  }
  const category = await Category.findOneAndDelete({ _id: id, userId: currentUser._id }).lean();
  if (!category) {
    return jsonResponse({ success: false, error: "Category not found." }, 404);
  }
  return jsonResponse({ success: true, data: category });
}
