import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { deleteCache, getCache, setCache } from "../../../../lib/cache.js";
import Category from "../../../../models/Category.js";
import Task, { TASK_PRIORITIES, TASK_STATUSES, TIME_HORIZONS } from "../../../../models/Task.js";
import TimeLog from "../../../../models/TimeLog.js";

export const runtime = "nodejs";

const CACHE_TTL_SECONDS = 60;
const CACHE_NAMESPACE = "track-time:tasks:v1";

function jsonResponse(payload, status = 200, headers = {}) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function getTasksCacheKey(userId, timeHorizon) {
  return timeHorizon
    ? `${CACHE_NAMESPACE}:user:${userId}:horizon:${timeHorizon}`
    : `${CACHE_NAMESPACE}:user:${userId}:all`;
}

function getFilteredTasksCacheKey(userId, searchParams) {
  const parts = ["timeHorizon", "search", "status", "priority", "date_filter", "date"]
    .map((key) => `${key}:${searchParams.get(key) || ""}`)
    .join("|");

  return `${CACHE_NAMESPACE}:user:${userId}:filters:${parts}`;
}

function normalizeInteger(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : Number.NaN;
}

function normalizeTaskPayload(body) {
  return {
    title: typeof body.title === "string" ? body.title.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    status: body.status ?? "pending",
    priority: body.priority ?? "medium",
    timeHorizon: body.timeHorizon,
    timeAllocated: normalizeInteger(body.timeAllocated),
    timeSpent: normalizeInteger(body.timeSpent, 0),
    isAlarmSet: Boolean(body.isAlarmSet),
    alarmTime: body.alarmTime ? new Date(body.alarmTime) : null,
    pushToken: typeof body.pushToken === "string" ? body.pushToken.trim() : "",
    categoryId: body.categoryId || body.category_id || null,
    dueDate: body.dueDate || body.due_date ? new Date(body.dueDate || body.due_date) : null,
    estimatedHours:
      body.estimatedHours === "" || body.estimated_hours === ""
        ? null
        : body.estimatedHours ?? body.estimated_hours ?? null,
    scheduleOrder: normalizeInteger(body.scheduleOrder ?? body.schedule_order, 0),
  };
}

function validateTaskPayload(payload) {
  const errors = [];

  if (!payload.title) {
    errors.push("title is required.");
  }

  if (!TASK_STATUSES.includes(payload.status)) {
    errors.push(`status must be one of: ${TASK_STATUSES.join(", ")}.`);
  }

  if (payload.timeHorizon && !TIME_HORIZONS.includes(payload.timeHorizon)) {
    errors.push(`timeHorizon must be one of: ${TIME_HORIZONS.join(", ")}.`);
  }

  if (!TASK_PRIORITIES.includes(payload.priority)) {
    errors.push(`priority must be one of: ${TASK_PRIORITIES.join(", ")}.`);
  }

  if (!Number.isInteger(payload.timeAllocated) || payload.timeAllocated < 1) {
    errors.push("timeAllocated must be a positive integer in minutes.");
  }

  if (!Number.isInteger(payload.timeSpent) || payload.timeSpent < 0) {
    errors.push("timeSpent must be a non-negative integer in minutes.");
  }

  if (payload.isAlarmSet && !payload.alarmTime) {
    errors.push("alarmTime is required when isAlarmSet is true.");
  }

  if (payload.alarmTime && Number.isNaN(payload.alarmTime.getTime())) {
    errors.push("alarmTime must be a valid ISO date.");
  }

  if (payload.dueDate && Number.isNaN(payload.dueDate.getTime())) {
    errors.push("dueDate must be a valid ISO date.");
  }

  if (
    payload.estimatedHours !== null &&
    payload.estimatedHours !== undefined &&
    (Number.isNaN(Number(payload.estimatedHours)) || Number(payload.estimatedHours) < 0)
  ) {
    errors.push("estimatedHours must be a non-negative number.");
  }

  return errors;
}

async function getCachedTasks(cacheKey) {
  try {
    return await getCache(cacheKey);
  } catch (error) {
    console.error("Cache GET failed. Falling back to MongoDB.", error);
    return null;
  }
}

function normalizeTaskUpdatePayload(body) {
  const payload = {};

  if (typeof body.title === "string") {
    payload.title = body.title.trim();
  }

  if (typeof body.description === "string") {
    payload.description = body.description.trim();
  }

  if (body.status !== undefined) {
    payload.status = body.status;
  }

  if (body.priority !== undefined) {
    payload.priority = body.priority;
  }

  if (body.timeHorizon !== undefined) {
    payload.timeHorizon = body.timeHorizon;
  }

  if (body.timeAllocated !== undefined) {
    payload.timeAllocated = normalizeInteger(body.timeAllocated);
  }

  if (body.timeSpent !== undefined) {
    payload.timeSpent = normalizeInteger(body.timeSpent);
  }

  if (body.isAlarmSet !== undefined) {
    payload.isAlarmSet = Boolean(body.isAlarmSet);
  }

  if (body.alarmTime !== undefined) {
    payload.alarmTime = body.alarmTime ? new Date(body.alarmTime) : null;
  }

  if (body.categoryId !== undefined || body.category_id !== undefined) {
    payload.categoryId = body.categoryId || body.category_id || null;
  }

  if (body.dueDate !== undefined || body.due_date !== undefined) {
    const dueDate = body.dueDate ?? body.due_date;
    payload.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (body.estimatedHours !== undefined || body.estimated_hours !== undefined) {
    const estimatedHours = body.estimatedHours ?? body.estimated_hours;
    payload.estimatedHours = estimatedHours === "" || estimatedHours === null ? null : Number(estimatedHours);
  }

  if (body.scheduleOrder !== undefined || body.schedule_order !== undefined) {
    payload.scheduleOrder = normalizeInteger(body.scheduleOrder ?? body.schedule_order, 0);
  }

  return payload;
}

async function attachTaskDetails(tasks) {
  const taskIds = tasks.map((task) => task._id);
  const categoryIds = [...new Set(tasks.map((task) => String(task.categoryId || "")).filter(Boolean))];

  const [categories, timeLogs] = await Promise.all([
    Category.find({ _id: { $in: categoryIds } }).lean(),
    TimeLog.find({ taskId: { $in: taskIds } }).lean(),
  ]);

  const categoriesById = new Map(categories.map((category) => [String(category._id), category]));
  const logsByTask = new Map();

  timeLogs.forEach((log) => {
    const key = String(log.taskId);
    logsByTask.set(key, [...(logsByTask.get(key) || []), log]);
  });

  return tasks.map((task) => ({
    ...task,
    category: task.categoryId ? categoriesById.get(String(task.categoryId)) || null : null,
    timeLogs: logsByTask.get(String(task._id)) || [],
  }));
}

async function setCachedTasks(cacheKey, tasks) {
  try {
    await setCache(cacheKey, tasks, CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("Cache SET failed. Continuing without cache write.", error);
  }
}

async function invalidateTaskCaches(userId, timeHorizon) {
  const keys = [getTasksCacheKey(userId)];

  if (timeHorizon) {
    keys.push(getTasksCacheKey(userId, timeHorizon));
  }

  try {
    await deleteCache(...keys);
  } catch (error) {
    console.error("Cache DEL failed. Cache will expire by TTL.", error);
  }
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return jsonResponse(
        { success: false, error: "Authentication required." },
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const timeHorizon = searchParams.get("timeHorizon");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const dateFilter = searchParams.get("date_filter");
    const date = searchParams.get("date");

    if (timeHorizon && !TIME_HORIZONS.includes(timeHorizon)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid timeHorizon. Expected one of: ${TIME_HORIZONS.join(", ")}.`,
        },
        400
      );
    }

    const cacheKey = getFilteredTasksCacheKey(currentUser._id, searchParams);
    const cachedTasks = await getCachedTasks(cacheKey);

    if (cachedTasks) {
      return jsonResponse(
        {
          success: true,
          source: "cache",
          count: cachedTasks.length,
          data: cachedTasks,
        },
        200,
        { "X-Track-Time-Cache": "HIT" }
      );
    }

    await dbConnect();

    const query = {
      userId: currentUser._id,
      ...(timeHorizon ? { timeHorizon } : {}),
      ...(status && status !== "all" ? { status } : {}),
      ...(priority && priority !== "all" ? { priority } : {}),
    };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (date) {
      const start = new Date(`${date}T00:00:00.000`);
      const end = new Date(`${date}T23:59:59.999`);
      query.dueDate = { $gte: start, $lte: end };
    } else if (dateFilter === "today") {
      const now = new Date();
      const yyyyMmDd = now.toISOString().slice(0, 10);
      query.dueDate = { $gte: new Date(`${yyyyMmDd}T00:00:00.000`), $lte: new Date(`${yyyyMmDd}T23:59:59.999`) };
    } else if (dateFilter === "week") {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1, scheduleOrder: 1, updatedAt: -1 })
      .lean();
    const detailedTasks = await attachTaskDetails(tasks);

    await setCachedTasks(cacheKey, detailedTasks);

    return jsonResponse(
      {
        success: true,
        source: "database",
        count: detailedTasks.length,
        data: detailedTasks,
      },
      200,
      { "X-Track-Time-Cache": "MISS" }
    );
  } catch (error) {
    console.error("GET /api/tasks failed.", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to fetch tasks.",
      },
      500
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return jsonResponse(
        { success: false, error: "Authentication required." },
        401
      );
    }

    const body = await request.json();
    const payload = normalizeTaskPayload(body);
    const validationErrors = validateTaskPayload(payload);

    if (validationErrors.length > 0) {
      return jsonResponse(
        {
          success: false,
          errors: validationErrors,
        },
        400
      );
    }

    await dbConnect();

    if (payload.categoryId) {
      const category = await Category.exists({ _id: payload.categoryId, userId: currentUser._id });
      if (!category) {
        return jsonResponse({ success: false, error: "Category not found." }, 404);
      }
    }

    const task = await Task.create({
      ...payload,
      estimatedHours: payload.estimatedHours === null ? null : Number(payload.estimatedHours),
      userId: currentUser._id,
    });
    const serializedTask = task.toObject();
    delete serializedTask.pushToken;

    await invalidateTaskCaches(currentUser._id, serializedTask.timeHorizon);

    return jsonResponse(
      {
        success: true,
        data: serializedTask,
      },
      201
    );
  } catch (error) {
    console.error("POST /api/tasks failed.", error);

    if (error instanceof SyntaxError) {
      return jsonResponse(
        {
          success: false,
          error: "Request body must be valid JSON.",
        },
        400
      );
    }

    if (error.name === "ValidationError") {
      return jsonResponse(
        {
          success: false,
          errors: Object.values(error.errors).map((fieldError) => fieldError.message),
        },
        400
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Unable to create task.",
      },
      500
    );
  }
}

export async function PATCH(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return jsonResponse(
        { success: false, error: "Authentication required." },
        401
      );
    }

    const body = await request.json();
    const taskId = String(body.id || body._id || "").trim();

    if (!taskId) {
      return jsonResponse(
        { success: false, error: "Task id is required." },
        400
      );
    }

    const payload = normalizeTaskUpdatePayload(body);
    const validationErrors = [];

    if (payload.title !== undefined && !payload.title) {
      validationErrors.push("title cannot be empty.");
    }

    if (payload.status !== undefined && !TASK_STATUSES.includes(payload.status)) {
      validationErrors.push(`status must be one of: ${TASK_STATUSES.join(", ")}.`);
    }

    if (payload.priority !== undefined && !TASK_PRIORITIES.includes(payload.priority)) {
      validationErrors.push(`priority must be one of: ${TASK_PRIORITIES.join(", ")}.`);
    }

    if (payload.timeHorizon !== undefined && !TIME_HORIZONS.includes(payload.timeHorizon)) {
      validationErrors.push(`timeHorizon must be one of: ${TIME_HORIZONS.join(", ")}.`);
    }

    if (
      payload.timeAllocated !== undefined &&
      (!Number.isInteger(payload.timeAllocated) || payload.timeAllocated < 1)
    ) {
      validationErrors.push("timeAllocated must be a positive integer in minutes.");
    }

    if (
      payload.timeSpent !== undefined &&
      (!Number.isInteger(payload.timeSpent) || payload.timeSpent < 0)
    ) {
      validationErrors.push("timeSpent must be a non-negative integer in minutes.");
    }

    if (payload.alarmTime && Number.isNaN(payload.alarmTime.getTime())) {
      validationErrors.push("alarmTime must be a valid ISO date.");
    }

    if (payload.dueDate && Number.isNaN(payload.dueDate.getTime())) {
      validationErrors.push("dueDate must be a valid ISO date.");
    }

    if (payload.estimatedHours !== undefined && payload.estimatedHours !== null && payload.estimatedHours < 0) {
      validationErrors.push("estimatedHours must be a non-negative number.");
    }

    if (validationErrors.length > 0) {
      return jsonResponse({ success: false, errors: validationErrors }, 400);
    }

    await dbConnect();

    if (payload.categoryId) {
      const category = await Category.exists({ _id: payload.categoryId, userId: currentUser._id });
      if (!category) {
        return jsonResponse({ success: false, error: "Category not found." }, 404);
      }
    }

    const existingTask = await Task.findOne({
      _id: taskId,
      userId: currentUser._id,
    }).lean();

    if (!existingTask) {
      return jsonResponse(
        { success: false, error: "Task not found." },
        404
      );
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: currentUser._id },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    await invalidateTaskCaches(currentUser._id, existingTask.timeHorizon);

    if (task.timeHorizon !== existingTask.timeHorizon) {
      await invalidateTaskCaches(currentUser._id, task.timeHorizon);
    }

    return jsonResponse({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("PATCH /api/tasks failed.", error);

    return jsonResponse(
      { success: false, error: "Unable to update task." },
      500
    );
  }
}

export async function DELETE(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return jsonResponse(
        { success: false, error: "Authentication required." },
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return jsonResponse(
        { success: false, error: "Task id is required." },
        400
      );
    }

    await dbConnect();

    const task = await Task.findOneAndDelete({
      _id: taskId,
      userId: currentUser._id,
    }).lean();

    if (!task) {
      return jsonResponse(
        { success: false, error: "Task not found." },
        404
      );
    }

    await invalidateTaskCaches(currentUser._id, task.timeHorizon);

    return jsonResponse({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("DELETE /api/tasks failed.", error);

    return jsonResponse(
      { success: false, error: "Unable to delete task." },
      500
    );
  }
}
