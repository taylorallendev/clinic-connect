import { Suspense } from "react";

import { TemplatesListSkeleton } from "@/app/dashboard/templates/templates-list-skeleton";
import { TemplatesList } from "@/app/dashboard/templates/templates-list";

export default function TemplatesPage() {
  return (
    <div className="flex flex-col space-y-6 p-6 bg-background">
      {/* Templates Grid */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
