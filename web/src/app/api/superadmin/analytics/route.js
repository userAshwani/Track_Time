import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../../../lib/auth.js";
import Session from "../../../../../models/Session.js";
import Task from "../../../../../models/Task.js";
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

    const [
      totalUsers,
      totalSuperadmins,
      totalTasks,
      activeSessions,
      loginsLast24Hours,
      loginsLast7Days,
      recentUsers,
      tasksByHorizon,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "superadmin" }),
      Task.countDocuments(),
      Session.countDocuments({ expiresAt: { $gt: now }, revokedAt: null }),
      User.countDocuments({ lastLoginAt: { $gte: last24Hours } }),
      User.countDocuments({ lastLoginAt: { $gte: last7Days } }),
      User.find()
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .limit(20)
        .select("email role status loginCount lastLoginAt createdAt")
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
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSuperadmins,
        totalRegularUsers: totalUsers - totalSuperadmins,
        totalTasks,
        activeSessions,
        loginsLast24Hours,
        loginsLast7Days,
        recentUsers,
        tasksByHorizon,
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
