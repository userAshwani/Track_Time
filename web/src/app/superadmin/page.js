import { redirect } from "next/navigation";

import dbConnect from "../../../lib/dbConnect.js";
import { getCurrentUser } from "../../../lib/auth.js";
import Session from "../../../models/Session.js";
import Task from "../../../models/Task.js";
import User from "../../../models/User.js";

export const dynamic = "force-dynamic";

function StatCard({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-blue-950">{value}</p>
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function SuperadminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "superadmin") {
    redirect("/dashboard");
  }

  await dbConnect();

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalTasks,
    activeSessions,
    loginsLast24Hours,
    loginsLast7Days,
    recentUsers,
    tasksByHorizon,
  ] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Session.countDocuments({ expiresAt: { $gt: now }, revokedAt: null }),
    User.countDocuments({ lastLoginAt: { $gte: last24Hours } }),
    User.countDocuments({ lastLoginAt: { $gte: last7Days } }),
    User.find()
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .limit(25)
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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-blue-900 bg-blue-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-[1600px]">
          <p className="text-sm font-black uppercase text-blue-200">
            Track Time Superadmin
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight">
            Platform Analytics and User Access
          </h1>
          <p className="mt-3 text-base font-semibold text-blue-100">
            Signed in as {currentUser.email}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Total Tasks" value={totalTasks} />
          <StatCard label="Active Sessions" value={activeSessions} />
          <StatCard label="Logins 24h" value={loginsLast24Hours} />
          <StatCard label="Logins 7d" value={loginsLast7Days} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black text-slate-950">
              Task Horizon Distribution
            </h2>
            <div className="mt-4 space-y-3">
              {tasksByHorizon.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">
                  No tasks created yet.
                </p>
              ) : null}
              {tasksByHorizon.map((item) => (
                <div key={item._id} className="border border-slate-200 p-3">
                  <div className="flex justify-between gap-3">
                    <p className="font-black text-blue-950">{item._id}</p>
                    <p className="font-black">{item.count} tasks</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.timeSpent} minutes spent of {item.timeAllocated} allocated
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-black text-slate-950">
                Recent Users and Login Details
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Logins</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentUsers.map((user) => (
                    <tr key={String(user._id)}>
                      <td className="px-4 py-3 font-bold text-slate-950">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 font-semibold">{user.role}</td>
                      <td className="px-4 py-3 font-semibold">{user.status}</td>
                      <td className="px-4 py-3 font-semibold">{user.loginCount}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
