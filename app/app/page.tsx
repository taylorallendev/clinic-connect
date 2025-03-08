import { redirect } from "next/navigation";

export default function AppPage() {
  // Redirect to dashboard
  redirect("/app/dashboard");
}
