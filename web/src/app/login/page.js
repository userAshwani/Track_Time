import { redirect } from "next/navigation";

import { getCurrentUser } from "../../../lib/auth.js";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
