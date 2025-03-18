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
    <div className="container mx-auto py-6 space-y-6 light bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A202C]">Templates</h1>
      </div>

      {/* Templates Grid */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
