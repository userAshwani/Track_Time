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
    const isDemoUser = currentUser?.email === "codeashwani@gmail.com";

    if (!currentUser || (currentUser.role !== "superadmin" && !isDemoUser)) {
      return NextResponse.json(
        { success: false, error: "Demo seeding access required." },
        { status: 403 }
      );
    }

    await dbConnect();

    const email = "codeashwani@gmail.com";
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: "Ashwani Tiwari",
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
      { userId: user._id, name: "JavaScript & Frontend", color: "#059669", icon: "code" },
      { userId: user._id, name: "Java & Backend", color: "#0F766E", icon: "server" },
      { userId: user._id, name: "Cybersecurity", color: "#16A34A", icon: "shield" },
      { userId: user._id, name: "Freelance Projects", color: "#10B981", icon: "briefcase" },
      { userId: user._id, name: "MNC Preparation", color: "#65A30D", icon: "target" },
      { userId: user._id, name: "AshwaniTiwari.com", color: "#0D9488", icon: "globe" },
    ]);
    const byName = Object.fromEntries(categories.map((category) => [category.name, category]));

    const tasks = await Task.insertMany([
      { userId: user._id, categoryId: byName["AshwaniTiwari.com"]._id, title: "Audit ashwanitiwari.com service pages", description: "Map website, app, CRM, ecommerce, SEO, and branding service paths into CRM follow-up tasks.", priority: "high", status: "completed", dueDate: atDayTime(-2, 10), estimatedHours: 2, timeAllocated: 120, timeSpent: 125 },
      { userId: user._id, categoryId: byName["JavaScript & Frontend"]._id, title: "Build JavaScript DOM mini-project", description: "Practice form validation, fetch calls, local state, and reusable UI components.", priority: "high", status: "completed", dueDate: atDayTime(-1, 12), estimatedHours: 2.5, timeAllocated: 150, timeSpent: 145 },
      { userId: user._id, categoryId: byName["JavaScript & Frontend"]._id, title: "Complete React and Next.js dashboard module", description: "Study App Router, API routes, Mongo integration, auth guards, and production deployment.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 11), estimatedHours: 3, timeAllocated: 180, timeSpent: 110 },
      { userId: user._id, categoryId: byName["Java & Backend"]._id, title: "Revise Java OOP and collections", description: "Cover inheritance, interfaces, generics, HashMap internals, streams, and exception handling.", priority: "medium", status: "in_progress", dueDate: atDayTime(1, 16), estimatedHours: 2.5, timeAllocated: 150, timeSpent: 75 },
      { userId: user._id, categoryId: byName["Java & Backend"]._id, title: "Design Spring Boot CRM API outline", description: "Plan entities, controllers, service layer, validation, security, and deployment notes.", priority: "medium", status: "pending", dueDate: atDayTime(3, 18), estimatedHours: 3, timeAllocated: 180, timeSpent: 0 },
      { userId: user._id, categoryId: byName["Cybersecurity"]._id, title: "Practice OWASP Top 10 checklist", description: "Review auth flaws, injection, XSS, CSRF, rate limits, secret handling, and secure headers.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 20), estimatedHours: 2, timeAllocated: 120, timeSpent: 70 },
      { userId: user._id, categoryId: byName["Cybersecurity"]._id, title: "Run basic security audit on portfolio forms", description: "Check validation, error messages, bot protection, and sensitive data exposure.", priority: "medium", status: "pending", dueDate: atDayTime(4, 17), estimatedHours: 2, timeAllocated: 120, timeSpent: 0 },
      { userId: user._id, categoryId: byName["Freelance Projects"]._id, title: "Send ecommerce website proposal", description: "Finalize scope, payment milestones, timeline, hosting plan, and maintenance package.", priority: "high", status: "pending", dueDate: atDayTime(1, 15), estimatedHours: 1.5, timeAllocated: 90, timeSpent: 35 },
      { userId: user._id, categoryId: byName["Freelance Projects"]._id, title: "Prepare CRM demo screenshots for client", description: "Capture dashboard, categories, task planner, admin analytics, and feedback screen.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 22), estimatedHours: 1.5, timeAllocated: 90, timeSpent: 40 },
      { userId: user._id, categoryId: byName["MNC Preparation"]._id, title: "Solve 8 DSA problems for product companies", description: "Focus on arrays, strings, hashing, sliding window, and recursion patterns.", priority: "high", status: "in_progress", dueDate: atDayTime(0, 21), estimatedHours: 2.5, timeAllocated: 150, timeSpent: 95 },
      { userId: user._id, categoryId: byName["MNC Preparation"]._id, title: "Revise DBMS and operating systems notes", description: "Transactions, indexing, normalization, processes, threads, deadlocks, and memory.", priority: "medium", status: "pending", dueDate: atDayTime(2, 20), estimatedHours: 2, timeAllocated: 120, timeSpent: 0 },
      { userId: user._id, categoryId: byName["MNC Preparation"]._id, title: "Mock interview answer practice", description: "Prepare crisp stories for freelancing, learning discipline, project ownership, and problem solving.", priority: "medium", status: "pending", dueDate: atDayTime(5, 19), estimatedHours: 1.5, timeAllocated: 90, timeSpent: 0 },
    ]);

    const taskByTitle = Object.fromEntries(tasks.map((task) => [task.title, task]));

    await TimeLog.insertMany([
      { userId: user._id, taskId: taskByTitle["Audit ashwanitiwari.com service pages"]._id, startTime: atDayTime(-2, 8), endTime: atDayTime(-2, 10, 5), durationMinutes: 125, notes: "Mapped website services into CRM planning categories." },
      { userId: user._id, taskId: taskByTitle["Build JavaScript DOM mini-project"]._id, startTime: atDayTime(-1, 9), endTime: atDayTime(-1, 11, 25), durationMinutes: 145, notes: "Finished validation and fetch practice." },
      { userId: user._id, taskId: taskByTitle["Complete React and Next.js dashboard module"]._id, startTime: atDayTime(0, 8), endTime: atDayTime(0, 9, 50), durationMinutes: 110, notes: "Studied routing, server APIs, and Mongo models." },
      { userId: user._id, taskId: taskByTitle["Revise Java OOP and collections"]._id, startTime: atDayTime(0, 10), endTime: atDayTime(0, 11, 15), durationMinutes: 75, notes: "Covered collections and exception notes." },
      { userId: user._id, taskId: taskByTitle["Practice OWASP Top 10 checklist"]._id, startTime: atDayTime(0, 17), endTime: atDayTime(0, 18, 10), durationMinutes: 70, notes: "Reviewed injection, XSS, and auth issues." },
      { userId: user._id, taskId: taskByTitle["Send ecommerce website proposal"]._id, startTime: atDayTime(-1, 14), endTime: atDayTime(-1, 14, 35), durationMinutes: 35, notes: "Prepared proposal sections." },
      { userId: user._id, taskId: taskByTitle["Prepare CRM demo screenshots for client"]._id, startTime: atDayTime(0, 15), endTime: atDayTime(0, 15, 40), durationMinutes: 40, notes: "Planned screenshots and feature order." },
      { userId: user._id, taskId: taskByTitle["Solve 8 DSA problems for product companies"]._id, startTime: atDayTime(0, 19), endTime: atDayTime(0, 20, 35), durationMinutes: 95, notes: "Solved arrays and hashing practice set." },
    ]);

    await DailySchedule.insertMany([
      { userId: user._id, date: isoDate(-2), plannedHours: 6, actualHours: 2.1 },
      { userId: user._id, date: isoDate(-1), plannedHours: 7, actualHours: 3 },
      { userId: user._id, date: isoDate(0), plannedHours: 8, actualHours: 6.5 },
      { userId: user._id, date: isoDate(1), plannedHours: 6, actualHours: 0 },
      { userId: user._id, date: isoDate(2), plannedHours: 7, actualHours: 0 },
      { userId: user._id, date: isoDate(3), plannedHours: 5, actualHours: 0 },
    ]);

    return NextResponse.json({
      success: true,
      message: "Demo user codeashwani@gmail.com created with sample CRM data.",
      login: { email, password: "Code@12345" },
    });
  } catch (error) {
    console.error("POST /api/superadmin/seed-demo failed.", error);
    return NextResponse.json(
      { success: false, error: `Unable to seed demo user: ${error.message}` },
      { status: 500 }
    );
  }
}
