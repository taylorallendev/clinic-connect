import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CurrentCaseSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-blue-800/30 bg-blue-950/40 backdrop-blur-xl px-6">
        <div className="h-6 w-48 animate-pulse rounded bg-blue-800/40"></div>
        <div className="h-10 w-28 animate-pulse rounded bg-blue-800/40"></div>
      </header>

      <div className="flex-1 space-y-6 overflow-auto p-6 bg-gradient-to-br from-blue-950 to-indigo-950">
        {/* Case form skeleton */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <div className="h-6 w-32 animate-pulse rounded bg-blue-800/40"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-blue-800/40"></div>
                  <div className="h-10 w-full animate-pulse rounded bg-blue-800/40"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recording section skeleton */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <div className="h-6 w-40 animate-pulse rounded bg-blue-800/40"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-32 w-full animate-pulse rounded-xl bg-blue-800/40"></div>
            <div className="flex justify-center mt-4 space-x-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-blue-800/40"></div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-blue-800/40"></div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-blue-800/40"></div>
            </div>
          </CardContent>
        </Card>

        {/* SOAP notes skeleton */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <div className="h-6 w-36 animate-pulse rounded bg-blue-800/40"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-blue-800/40"></div>
                  <div className="h-20 w-full animate-pulse rounded bg-blue-800/40"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
