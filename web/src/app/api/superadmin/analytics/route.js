import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../../lib/auth.js";
import Category from "../../../../../models/Category.js";
import Feedback from "../../../../../models/Feedback.js";
import Session from "../../../../../models/Session.js";
import Task from "../../../../../models/Task.js";
import TimeLog from "../../../../../models/TimeLog.js";
import User from "../../../../../models/User.js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Superadmin access required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsers,
      totalSuperadmins,
      totalTasks,
      totalCategories,
      totalTimeLogs,
      totalFeedback,
      openFeedback,
      activeSessions,
      loginsLast24Hours,
      loginsLast7Days,
      loginsLast30Days,
      loginsThisYear,
      recentUsers,
      recentFeedback,
      tasksByHorizon,
      tasksByStatus,
      usageByUser,
      dailyUsage,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "superadmin" }),
      Task.countDocuments(),
      Category.countDocuments(),
      TimeLog.countDocuments(),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: "new" }),
      Session.countDocuments({ expiresAt: { $gt: now }, revokedAt: null }),
      User.countDocuments({ lastLoginAt: { $gte: last24Hours } }),
      User.countDocuments({ lastLoginAt: { $gte: last7Days } }),
      User.countDocuments({ lastLoginAt: { $gte: last30Days } }),
      User.countDocuments({ lastLoginAt: { $gte: yearStart } }),
      User.find()
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .limit(50)
        .select("name email role status loginCount lastLoginAt createdAt")
        .lean(),
      Feedback.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "name email")
        .lean(),
      Task.aggregate([
        {
          $group: {
            _id: "$timeHorizon",
            count: { $sum: 1 },
            timeAllocated: { $sum: "$timeAllocated" },
            timeSpent: { $sum: "$timeSpent" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "userId",
            as: "tasks",
          },
        },
        {
          $lookup: {
            from: "timelogs",
            localField: "_id",
            foreignField: "userId",
            as: "timeLogs",
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            loginCount: 1,
            lastLoginAt: 1,
            tasksCount: { $size: "$tasks" },
            completedTasks: {
              $size: {
                $filter: {
                  input: "$tasks",
                  as: "task",
                  cond: { $eq: ["$$task.status", "completed"] },
                },
              },
            },
            loggedMinutes: { $sum: "$timeLogs.durationMinutes" },
          },
        },
        { $sort: { lastLoginAt: -1, tasksCount: -1 } },
        { $limit: 50 },
      ]),
      TimeLog.aggregate([
        { $match: { startTime: { $gte: last30Days } } },
        {
          $group: {
            _id: {
              $dateToString: {
                date: "$startTime",
                format: "%Y-%m-%d",
              },
            },
            loggedMinutes: { $sum: "$durationMinutes" },
            logs: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSuperadmins,
        totalRegularUsers: totalUsers - totalSuperadmins,
        totalTasks,
        totalCategories,
        totalTimeLogs,
        totalFeedback,
        openFeedback,
        activeSessions,
        loginsLast24Hours,
        loginsLast7Days,
        loginsLast30Days,
        loginsThisYear,
        recentUsers,
        recentFeedback,
        tasksByHorizon,
        tasksByStatus,
        usageByUser,
        dailyUsage,
      },
    });
  } catch (error) {
    console.error("GET /api/superadmin/analytics failed.", error);

    return NextResponse.json(
      { success: false, error: "Unable to load analytics." },
      { status: 500 }
    );
  }
}
