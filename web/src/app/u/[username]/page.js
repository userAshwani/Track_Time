import { notFound } from "next/navigation";
import { Flame, Trophy, CalendarCheck, Clock3 } from "lucide-react";

import dbConnect from "../../../../lib/dbConnect.js";
import User from "../../../../models/User.js";
import Task from "../../../../models/Task.js";
import TimeLog from "../../../../models/TimeLog.js";
import { computeStreaks } from "../../../../lib/streak.js";

export const runtime = "nodejs";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `${username} · Track Time`,
    description: `${username}'s time-tracking streak and stats on Track Time.`,
  };
}

async function loadProfile(username) {
  await dbConnect();

  const user = await User.findOne({
    username: username.toLowerCase(),
    publicProfile: true,
    status: "active",
  }).lean();

  if (!user) {
    return null;
  }

  const [logs, tasksCompleted, tasksTotal] = await Promise.all([
    TimeLog.find({ userId: user._id }).select("startTime durationMinutes").lean(),
    Task.countDocuments({ userId: user._id, status: "completed" }),
    Task.countDocuments({ userId: user._id }),
  ]);

  const dateStrings = logs.map((log) => new Date(log.startTime).toISOString().slice(0, 10));
  const streaks = computeStreaks(dateStrings);
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

  const last12Weeks = Array.from({ length: 84 }, (_, index) => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - (83 - index));
    return day.toISOString().slice(0, 10);
  });
  const minutesByDay = logs.reduce((acc, log) => {
    const day = new Date(log.startTime).toISOString().slice(0, 10);
    acc[day] = (acc[day] || 0) + log.durationMinutes;
    return acc;
  }, {});

  return {
    name: user.name || username,
    username: user.username,
    memberSince: user.createdAt,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    activeDays: streaks.activeDays,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    tasksCompleted,
    tasksTotal,
    heatmap: last12Weeks.map((day) => ({ day, minutes: minutesByDay[day] || 0 })),
  };
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function heatColor(minutes) {
  if (minutes <= 0) return "bg-slate-100";
  if (minutes < 30) return "bg-emerald-200";
  if (minutes < 60) return "bg-emerald-400";
  if (minutes < 120) return "bg-emerald-600";
  return "bg-emerald-800";
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) {
    notFound();
  }

  const weeks = [];
  for (let index = 0; index < profile.heatmap.length; index += 7) {
    weeks.push(profile.heatmap.slice(index, index + 7));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
              {initials(profile.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{profile.name}</h1>
              <p className="text-sm font-semibold text-slate-500">@{profile.username}</p>
            </div>
            <div className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              Member since {new Date(profile.memberSince).toLocaleDateString("en", { month: "short", year: "numeric" })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Flame} label="Current streak" value={`${profile.currentStreak}d`} color="text-orange-600" bg="bg-orange-50" />
            <StatCard icon={Trophy} label="Longest streak" value={`${profile.longestStreak}d`} color="text-amber-600" bg="bg-amber-50" />
            <StatCard icon={Clock3} label="Hours logged" value={`${profile.totalHours}h`} color="text-emerald-700" bg="bg-emerald-50" />
            <StatCard icon={CalendarCheck} label="Tasks done" value={`${profile.tasksCompleted}/${profile.tasksTotal}`} color="text-sky-700" bg="bg-sky-50" />
          </div>

          <div className="mt-8">
            <p className="text-sm font-bold text-slate-500">Last 12 weeks</p>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <div
                      key={cell.day}
                      title={`${cell.day}: ${Math.round((cell.minutes / 60) * 10) / 10}h`}
                      className={`h-3 w-3 rounded-sm ${heatColor(cell.minutes)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs font-semibold text-slate-400">
            Tracked with Track Time — a free time and task workspace.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${bg}`}>
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="mt-3 text-xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
