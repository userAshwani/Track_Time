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
