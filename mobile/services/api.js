const DEFAULT_API_BASE_URL = "http://localhost:3000";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

const VALID_TIME_HORIZONS = new Set(["1_Day", "1_Week", "1_Month", "1_Year"]);

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.error ||
      payload?.errors?.join(" ") ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload;
}

export async function fetchTasksByHorizon(horizon, options = {}) {
  if (!VALID_TIME_HORIZONS.has(horizon)) {
    throw new Error("Invalid time horizon.");
  }

  const payload = await request(
    `/api/tasks?timeHorizon=${encodeURIComponent(horizon)}`,
    {
      method: "GET",
      signal: options.signal,
    }
  );

  return payload?.data ?? [];
}

export async function createTask(taskData, options = {}) {
  const payload = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
    signal: options.signal,
  });

  return payload?.data;
}

export { API_BASE_URL };
