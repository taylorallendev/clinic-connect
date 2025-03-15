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
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            className="bg-blue-900/20 border-blue-700/30 text-blue-50 placeholder:text-blue-400/50"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px] bg-blue-900/20 border-blue-700/30 text-blue-50">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-blue-900 border-blue-700 text-blue-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="soap">SOAP Notes</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="report">Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
