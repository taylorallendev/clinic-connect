import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TemplatesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="h-6 w-32 animate-pulse rounded bg-muted/60" />
            <div className="h-6 w-20 animate-pulse rounded bg-muted/60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
              <div className="flex gap-2">
                <div className="h-8 w-8 animate-pulse rounded bg-muted/60" />
                <div className="h-8 w-8 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
