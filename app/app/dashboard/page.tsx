import { redirect } from "next/navigation";

// Dashboard page is removed - redirect to appointments instead
export default function Dashboard() {
  redirect("/app/dashboard/appointments");
}
