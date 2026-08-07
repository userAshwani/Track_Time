import { NextResponse } from "next/server";

import dbConnect from "../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../lib/auth.js";
import { deleteCache, getCache, setCache } from "../../../../lib/cache.js";
import Task, { TASK_STATUSES, TIME_HORIZONS } from "../../../../models/Task.js";

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
    timeHorizon: body.timeHorizon,
    timeAllocated: normalizeInteger(body.timeAllocated),
    timeSpent: normalizeInteger(body.timeSpent, 0),
    isAlarmSet: Boolean(body.isAlarmSet),
    alarmTime: body.alarmTime ? new Date(body.alarmTime) : null,
    pushToken: typeof body.pushToken === "string" ? body.pushToken.trim() : "",
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

  if (!TIME_HORIZONS.includes(payload.timeHorizon)) {
    errors.push(`timeHorizon must be one of: ${TIME_HORIZONS.join(", ")}.`);
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

  return payload;
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

    if (timeHorizon && !TIME_HORIZONS.includes(timeHorizon)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid timeHorizon. Expected one of: ${TIME_HORIZONS.join(", ")}.`,
        },
        400
      );
    }

    const cacheKey = getTasksCacheKey(currentUser._id, timeHorizon);
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
    };
    const tasks = await Task.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    await setCachedTasks(cacheKey, tasks);

    return jsonResponse(
      {
        success: true,
        source: "database",
        count: tasks.length,
        data: tasks,
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

    const task = await Task.create({
      ...payload,
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

    if (validationErrors.length > 0) {
      return jsonResponse({ success: false, errors: validationErrors }, 400);
    }

    await dbConnect();

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
