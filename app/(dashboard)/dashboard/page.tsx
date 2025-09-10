import { Suspense } from "react";
import { ModernDashboardContent } from "./modern-dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ModernDashboardContent />
    </Suspense>
  );
}
