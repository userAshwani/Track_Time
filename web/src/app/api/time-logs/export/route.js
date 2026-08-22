import dbConnect from "../../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../../lib/auth.js";
import Category from "../../../../../models/Category.js";
import Task from "../../../../../models/Task.js";
import TimeLog from "../../../../../models/TimeLog.js";

export const runtime = "nodejs";

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(cells) {
  return cells.map(csvCell).join(",") + "\r\n";
}

export async function GET(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response("Authentication required.", { status: 401 });
  }

  await dbConnect();

  const params = new URL(request.url).searchParams;
  const startParam = params.get("start");
  const endParam = params.get("end");

  const range = {};
  if (startParam) {
    range.$gte = new Date(`${startParam}T00:00:00.000`);
  }
  if (endParam) {
    range.$lte = new Date(`${endParam}T23:59:59.999`);
  }

  const query = { userId: currentUser._id };
  if (range.$gte || range.$lte) {
    query.startTime = range;
  }

  const logs = await TimeLog.find(query).sort({ startTime: 1 }).lean();
  const taskIds = [...new Set(logs.map((log) => String(log.taskId)))];
  const tasks = await Task.find({ _id: { $in: taskIds } }).lean();
  const categoryIds = [...new Set(tasks.map((task) => String(task.categoryId || "")).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));
  const taskById = new Map(tasks.map((task) => [String(task._id), task]));

  let csv = csvRow(["Date", "Task", "Category", "Start", "End", "Duration (hrs)", "Notes"]);
  let totalMinutes = 0;

  for (const log of logs) {
    const task = taskById.get(String(log.taskId));
    const category = task?.categoryId ? categoryById.get(String(task.categoryId)) : null;
    const start = new Date(log.startTime);
    const end = log.endTime ? new Date(log.endTime) : null;
    totalMinutes += log.durationMinutes;

    csv += csvRow([
      start.toISOString().slice(0, 10),
      task?.title || "Deleted task",
      category?.name || "Uncategorized",
      start.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
      end ? end.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "",
      (log.durationMinutes / 60).toFixed(2),
      log.notes || "",
    ]);
  }

  csv += csvRow(["", "", "", "", "Total", (totalMinutes / 60).toFixed(2), ""]);

  const rangeLabel = startParam || endParam ? `${startParam || "start"}_to_${endParam || "end"}` : "all-time";
  const fileName = `track-time-logs_${rangeLabel}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
