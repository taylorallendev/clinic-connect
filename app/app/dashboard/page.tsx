import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardContent } from "./dashboard-content";
import { getCaseTypeStats, getAllCases } from "./actions";

async function getStatsData() {
  // Get real counts from Supabase
  const statusCounts = await getCaseTypeStats();

  // Stats for dashboard
  return [
    {
      title: "Total Cases",
      value: String(statusCounts.total),
      change: "+12% from last month",
    },
    {
      title: "Ongoing",
      value: String(statusCounts.ongoing),
      change: "-3% from last month",
    },
    {
      title: "Completed",
      value: String(statusCounts.completed),
      change: "+20% from last month",
    },
    {
      title: "Reviewed Cases",
      value: String(statusCounts.reviewed),
      change: "+15% from last month",
    },
    {
      title: "Exported Cases",
      value: String(statusCounts.exported),
      change: "+20% from last month",
    },
  ];
}

export default async function DashboardPage() {
  // Fetch data on the server
  const cases = await getAllCases();
  const stats = await getStatsData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent cases={cases} stats={stats} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-10 w-28 animate-pulse rounded bg-gray-200"></div>
      </header>

      <div className="flex-1 space-y-5 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="overflow-hidden rounded-xl border-[#e2e8f0] bg-white shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="flex items-end justify-between">
                    <div className="h-8 w-12 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="min-h-[400px] overflow-hidden rounded-xl border-[#e2e8f0] bg-white shadow-sm">
          <div className="animate-pulse p-6">
            <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
            <div className="h-4 w-64 rounded bg-gray-200"></div>
          </div>
          <div className="px-6 pb-6">
            <div className="h-[300px] w-full animate-pulse rounded bg-gray-200"></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
