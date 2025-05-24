"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, MoreHorizontal, Download } from "lucide-react";
import { Case } from "@/app/actions";

interface CasesTableProps {
  cases: Case[];
  status?: string;
  isLoading?: boolean;
}

export function CasesTable({
  cases,
  status,
  isLoading = false,
}: CasesTableProps) {
  // Status colors
  const statusColors = {
    Ongoing: "bg-[#fff7ed] text-[#f97316]",
    Completed: "bg-[#f0fdf4] text-[#22c55e]",
    Reviewed: "bg-[#f0f9ff] text-[#0ea5e9]",
    Exported: "bg-[#faf5ff] text-[#a855f7]",
  };

  // Filter cases by status if provided
  const filteredCases = status
    ? cases.filter((caseItem) => caseItem.status === status)
    : cases;

  // Get icon based on status
  const getStatusIcon = () => {
    switch (status) {
      case "Completed":
        return <FileText className="h-8 w-8 text-[#22c55e]" />;
      case "Reviewed":
        return <FileText className="h-8 w-8 text-[#0ea5e9]" />;
      case "Exported":
        return <Download className="h-8 w-8 text-[#a855f7]" />;
      default:
        return <FileText className="h-8 w-8 text-[#64748b]" />;
    }
  };

  // Get empty state message based on status
  const getEmptyStateMessage = () => {
    switch (status) {
      case "Completed":
        return "No completed cases";
      case "Reviewed":
        return "No reviewed cases";
      case "Exported":
        return "No exported cases";
      default:
        return "No cases found";
    }
  };

  // Get empty state description based on status
  const getEmptyStateDescription = () => {
    switch (status) {
      case "Completed":
        return "There are no cases that have been completed yet.";
      case "Reviewed":
        return "There are no cases that have been reviewed and are ready for export.";
      case "Exported":
        return "There are no cases that have been exported to external systems.";
      default:
        return "There are no cases matching your criteria.";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
            <TableHead className="text-[#64748b] font-medium">ID</TableHead>
            <TableHead className="text-[#64748b] font-medium">
              Case Name
            </TableHead>
            <TableHead className="text-[#64748b] font-medium">
              Patient
            </TableHead>
            <TableHead className="text-[#64748b] font-medium">Type</TableHead>
            <TableHead className="text-[#64748b] font-medium">Date</TableHead>
            <TableHead className="text-[#64748b] font-medium">
              Assigned To
            </TableHead>
            <TableHead className="text-[#64748b] font-medium">Status</TableHead>
            <TableHead className="text-[#64748b] font-medium w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]"></div>
                  <p className="mt-2 text-[#64748b]">Loading cases...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredCases.length > 0 ? (
            filteredCases.map((caseItem) => (
              <TableRow
                key={caseItem.id}
                className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]"
              >
                <TableCell className="font-medium text-[#334155]">
                  {caseItem.id}
                </TableCell>
                <TableCell className="text-[#334155]">
                  {caseItem.name}
                </TableCell>
                <TableCell className="text-[#334155]">
                  {caseItem.patient}
                </TableCell>
                <TableCell className="text-[#334155]">
                  {caseItem.type}
                </TableCell>
                <TableCell className="text-[#334155]">
                  {caseItem.date}
                </TableCell>
                <TableCell className="text-[#334155]">
                  {caseItem.assignedTo}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      statusColors[caseItem.status as keyof typeof statusColors]
                    }
                  >
                    {caseItem.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4 text-[#64748b]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white border-[#e2e8f0] rounded-lg"
                    >
                      <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                        View Case
                      </DropdownMenuItem>
                      {caseItem.status === "Exported" ? (
                        <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                          Download Export
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                          Change Status
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                        {caseItem.status === "Exported"
                          ? "Archive Case"
                          : "Export Case"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-[#f1f5f9] p-4 rounded-full mb-4">
                    {getStatusIcon()}
                  </div>
                  <h3 className="text-lg font-medium text-[#334155] mb-2">
                    {getEmptyStateMessage()}
                  </h3>
                  <p className="text-[#64748b] max-w-md mb-6">
                    {getEmptyStateDescription()}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
