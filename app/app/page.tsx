import { redirect } from "next/navigation";

export default function AppPage() {
  // Redirect to appointments page
  redirect("/app/dashboard/appointments");
}
