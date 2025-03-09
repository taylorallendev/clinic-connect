import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FindCaseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-muted"></div>
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded bg-muted"></div>
          <div className="h-10 w-28 animate-pulse rounded bg-muted"></div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" disabled>
              All Cases
            </TabsTrigger>
            <TabsTrigger value="my" disabled>
              My Cases
            </TabsTrigger>
            <TabsTrigger value="recent" disabled>
              Recent
            </TabsTrigger>
            <TabsTrigger value="draft" disabled>
              Drafts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-muted"
                  ></div>
                ))}
              </div>

              <div className="rounded-md border">
                <div className="h-64 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  <span className="ml-2 text-muted-foreground">
                    Loading cases...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
