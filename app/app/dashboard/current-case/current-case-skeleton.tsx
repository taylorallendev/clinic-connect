import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CurrentCaseSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted"></div>
        <div className="h-10 w-28 animate-pulse rounded bg-muted"></div>
      </header>

      <div className="flex-1 space-y-6 overflow-auto p-6 bg-background">
        {/* Case form skeleton */}
        <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recording section skeleton */}
        <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <div className="h-6 w-40 animate-pulse rounded bg-muted"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-32 w-full animate-pulse rounded-lg bg-muted"></div>
            <div className="flex justify-center mt-4 space-x-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            </div>
          </CardContent>
        </Card>

        {/* SOAP notes skeleton */}
        <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <div className="h-6 w-36 animate-pulse rounded bg-muted"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                  <div className="h-20 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
