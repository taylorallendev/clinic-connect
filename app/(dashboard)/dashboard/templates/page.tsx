import { Suspense } from "react";

import { TemplatesListSkeleton } from "@/src/features/templates/components/templates-list-skeleton";
import { TemplatesList } from "@/src/features/templates/components/templates-list";

export default function TemplatesPage() {
  return (
    <div className="flex flex-col space-y-6 py-6 bg-background">
      {/* Templates Grid */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
