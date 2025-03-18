import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplatesListSkeleton } from "@/app/dashboard/templates/templates-list-skeleton";
import { TemplatesList } from "@/app/dashboard/templates/templates-list";

export default function TemplatesPage() {
  return (
    <div className="flex flex-col space-y-6 p-6 bg-gradient-to-br from-blue-950 to-indigo-950">

      {/* Templates Grid */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
