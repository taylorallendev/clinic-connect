import { Card, CardContent } from "@/src/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-blue-800/30 bg-blue-950/40 backdrop-blur-xl px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-blue-800/40"></div>
        <div className="h-10 w-28 animate-pulse rounded bg-blue-800/40"></div>
      </header>

      <div className="flex-1 space-y-6 overflow-auto p-6 bg-gradient-to-br from-blue-950 to-indigo-950">
        {/* Welcome card skeleton */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="h-8 w-64 animate-pulse rounded bg-blue-800/40 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-blue-900/30 backdrop-blur-sm border-blue-800/20 rounded-xl p-4 shadow-md shadow-blue-950/20"
                >
                  <div className="h-6 w-24 animate-pulse rounded bg-blue-800/40 mb-4"></div>
                  <div className="h-8 w-16 animate-pulse rounded bg-blue-800/40 mb-2"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-blue-800/40 mb-3"></div>
                  <div className="h-2 w-full animate-pulse rounded bg-blue-800/40"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart skeleton */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="h-6 w-48 animate-pulse rounded bg-blue-800/40 mb-2"></div>
            <div className="h-4 w-64 animate-pulse rounded bg-blue-800/40 mb-6"></div>
            <div className="h-48 w-full animate-pulse rounded bg-blue-800/40"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
