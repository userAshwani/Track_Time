import { redirect } from "next/navigation";

import { getCurrentUser } from "../../../lib/auth.js";
import DashboardShell from "../../components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
