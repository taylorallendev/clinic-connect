import { Suspense } from "react";
import { DashboardContent } from "./dashboard-content";
import {
  getCaseTypeStats,
  getAllCases,
  getUpcomingAppointments,
  Case,
  Appointment,
} from "./actions";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { createClient } from "@/utils/supabase/server";

interface Stat {
  title: string;
  value: string;
  change: string;
  icon: string;
}

// Define a User interface that matches what DashboardContent expects
interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

async function getStatsData(): Promise<Stat[]> {
  // Get real counts from Supabase
  const statusCounts = await getCaseTypeStats();

  // Stats for dashboard
  return [
    {
      title: "Total Cases",
      value: String(statusCounts.total),
      change: "+12% from last month",
      icon: "FileText",
    },
    {
      title: "Ongoing",
      value: String(statusCounts.ongoing),
      change: "-3% from last month",
      icon: "Clock",
    },
    {
      title: "Completed",
      value: String(statusCounts.completed),
      change: "+20% from last month",
      icon: "CheckCircle2",
    },
    {
      title: "Reviewed Cases",
      value: String(statusCounts.reviewed),
      change: "+15% from last month",
      icon: "ClipboardCheck",
    },
    {
      title: "Exported Cases",
      value: String(statusCounts.exported),
      change: "+20% from last month",
      icon: "Upload",
    },
  ];
}

export default async function Dashboard() {
  // Fetch user data from Supabase
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // Adapt the user object to match the expected interface
  const user = supabaseUser
    ? {
        id: supabaseUser.id,
        email: supabaseUser.email || "", // Provide a default empty string
        user_metadata: supabaseUser.user_metadata || {},
      }
    : null;

  // Fetch dashboard data
  const cases = await getAllCases();
  const stats = await getStatsData();
  const appointments = await getUpcomingAppointments();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent
        cases={cases}
        stats={stats}
        appointments={appointments}
        user={user}
      />
    </Suspense>
  );
}
