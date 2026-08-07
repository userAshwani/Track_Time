import { redirect } from "next/navigation";

import { getCurrentUser } from "../../../lib/auth.js";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
