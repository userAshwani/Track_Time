import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/dbConnect.js";
import { getCurrentUser, hashPassword } from "../../../../../lib/auth.js";
import Category from "../../../../../models/Category.js";
import DailySchedule from "../../../../../models/DailySchedule.js";
import Task from "../../../../../models/Task.js";
import TimeLog from "../../../../../models/TimeLog.js";
import User from "../../../../../models/User.js";

export const runtime = "nodejs";

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function atDayTime(offsetDays, hour, minute = 0) {
  return new Date(`${isoDate(offsetDays)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000`);
}

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Superadmin access required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const email = "codeashwani@gmail.com";
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: "Code Ashwani",
          role: "user",
          status: "active",
          passwordHash: hashPassword("Code@12345"),
          passwordUpdatedAt: new Date(),
          authMethods: ["password"],
          loginCount: 12,
          lastLoginAt: new Date(),
          timezone: "Asia/Kolkata",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Promise.all([
      Category.deleteMany({ userId: user._id }),
      Task.deleteMany({ userId: user._id }),
      TimeLog.deleteMany({ userId: user._id }),
      DailySchedule.deleteMany({ userId: user._id }),
    ]);

    const categories = await Category.insertMany([
      { userId: user._id, name: "Software Learning", color: "#6366F1", icon: "book-open" },
      { userId: user._id, name: "Freelance Projects", color: "#10B981", icon: "briefcase" },
      { userId: user._id, name: "MNC Preparation", color: "#F59E0B", icon: "target" },
      { userId: user._id, name: "Personal Systems", color: "#EC4899", icon: "settings" },
    ]);
    const byName = Object.fromEntries(categories.map((category) => [category.name, category]));

    const tasks = await Task.insertMany([
      { userId: user._id, categoryId: byName["Software Learning"]._id, title: "Complete React advanced patterns module", description: "Practice hooks, context patterns, memoization, and component composition.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 11), estimatedHours: 2.5, timeAllocated: 150, timeSpent: 80 },
      { userId: user._id, categoryId: byName["Software Learning"]._id, title: "Build small Next.js API demo", description: "Create CRUD endpoints and connect them with MongoDB.", priority: "medium", status: "pending", dueDate: atDayTime(2, 18), estimatedHours: 3, timeAllocated: 180, timeSpent: 0 },
      { userId: user._id, categoryId: byName["Freelance Projects"]._id, title: "Send ecommerce proposal to client", description: "Finalize pricing, timeline, and deliverables.", priority: "high", status: "pending", dueDate: atDayTime(1, 15), estimatedHours: 1.5, timeAllocated: 90, timeSpent: 30 },
      { userId: user._id, categoryId: byName["Freelance Projects"]._id, title: "Fix CRM landing page responsive layout", description: "Check desktop, tablet, and mobile breakpoints before delivery.", priority: "medium", status: "completed", dueDate: atDayTime(-1, 17), estimatedHours: 2, timeAllocated: 120, timeSpent: 130 },
      { userId: user._id, categoryId: byName["MNC Preparation"]._id, title: "Solve 5 DSA array problems", description: "Focus on two-pointer and sliding-window patterns.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 20), estimatedHours: 2, timeAllocated: 120, timeSpent: 60 },
      { userId: user._id, categoryId: byName["MNC Preparation"]._id, title: "Revise operating systems interview notes", description: "Processes, threads, deadlocks, memory management.", priority: "medium", status: "pending", dueDate: atDayTime(3, 21), estimatedHours: 2, timeAllocated: 120, timeSpent: 0 },
      { userId: user._id, categoryId: byName["Personal Systems"]._id, title: "Weekly planning and finance review", description: "Review expenses, invoices, learning hours, and upcoming deadlines.", priority: "low", status: "pending", dueDate: atDayTime(5, 10), estimatedHours: 1, timeAllocated: 60, timeSpent: 0 },
    ]);

    const taskByTitle = Object.fromEntries(tasks.map((task) => [task.title, task]));

    await TimeLog.insertMany([
      { userId: user._id, taskId: taskByTitle["Complete React advanced patterns module"]._id, startTime: atDayTime(0, 8), endTime: atDayTime(0, 9, 20), durationMinutes: 80, notes: "Studied compound components and performance notes." },
      { userId: user._id, taskId: taskByTitle["Solve 5 DSA array problems"]._id, startTime: atDayTime(0, 19), endTime: atDayTime(0, 20), durationMinutes: 60, notes: "Solved 3 problems, two need revision." },
      { userId: user._id, taskId: taskByTitle["Send ecommerce proposal to client"]._id, startTime: atDayTime(-1, 14), endTime: atDayTime(-1, 14, 30), durationMinutes: 30, notes: "Prepared scope and payment milestones." },
      { userId: user._id, taskId: taskByTitle["Fix CRM landing page responsive layout"]._id, startTime: atDayTime(-1, 15), endTime: atDayTime(-1, 17, 10), durationMinutes: 130, notes: "Delivered responsive fixes." },
    ]);

    await DailySchedule.insertMany([
      { userId: user._id, date: isoDate(-1), plannedHours: 7, actualHours: 2.7 },
      { userId: user._id, date: isoDate(0), plannedHours: 8, actualHours: 2.3 },
      { userId: user._id, date: isoDate(1), plannedHours: 6, actualHours: 0 },
      { userId: user._id, date: isoDate(2), plannedHours: 5, actualHours: 0 },
    ]);

    return NextResponse.json({
      success: true,
      message: "Demo user codeashwani@gmail.com created with sample CRM data.",
      login: { email, password: "Code@12345" },
    });
  } catch (error) {
    console.error("POST /api/superadmin/seed-demo failed.", error);
    return NextResponse.json(
      { success: false, error: "Unable to seed demo user." },
      { status: 500 }
    );
  }
}
