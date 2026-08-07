import { redirect } from "next/navigation";

export default function SuperadminPage() {
  redirect("/dashboard?view=admin");
}
