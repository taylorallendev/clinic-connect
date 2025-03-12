import { redirect } from "next/navigation";

// Dashboard page is removed - redirect to current case instead
export default function Dashboard() {
  redirect("/app/dashboard/current-case");
}
