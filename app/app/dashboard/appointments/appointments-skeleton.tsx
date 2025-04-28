import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AppointmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter controls skeleton */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="h-10 w-[350px] animate-pulse rounded bg-slate-700/40"></div>
        <div className="h-10 w-[180px] animate-pulse rounded bg-slate-700/40"></div>
        <div className="h-10 w-[180px] animate-pulse rounded bg-slate-700/40"></div>
        <div className="h-10 w-[120px] animate-pulse rounded bg-slate-700/40"></div>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>
                  <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[120px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[120px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="h-4 w-[80px] ml-auto animate-pulse rounded bg-slate-700/40"></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[120px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[120px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-[60px] ml-auto animate-pulse rounded bg-slate-700/40"></div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Pagination skeleton */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
              <div className="h-8 w-[100px] animate-pulse rounded bg-slate-700/40"></div>
              <div className="h-8 w-[80px] animate-pulse rounded bg-slate-700/40"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
