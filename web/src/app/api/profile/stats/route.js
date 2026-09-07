import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../../lib/auth.js";
import Task from "../../../../../models/Task.js";
import TimeLog from "../../../../../models/TimeLog.js";
import { computeStreaks, buildActivityGrid } from "../../../../../lib/streak.js";

export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  await dbConnect();

  const [logs, tasksCompleted, tasksTotal] = await Promise.all([
    TimeLog.find({ userId: currentUser._id }).select("startTime durationMinutes").lean(),
    Task.countDocuments({ userId: currentUser._id, status: "completed" }),
    Task.countDocuments({ userId: currentUser._id }),
  ]);

  const minutesByDay = logs.reduce((acc, log) => {
    const day = new Date(log.startTime).toISOString().slice(0, 10);
    acc[day] = (acc[day] || 0) + log.durationMinutes;
    return acc;
  }, {});

  const streaks = computeStreaks(Object.keys(minutesByDay));
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

  return NextResponse.json({
    success: true,
    data: {
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      tasksCompleted,
      tasksTotal,
      ...buildActivityGrid(minutesByDay),
    },
  });
}
