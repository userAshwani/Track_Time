import { redirect } from "next/navigation";

import { getCurrentUser } from "../../../lib/auth.js";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient user={user} />;
}
