import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-[250px] animate-pulse rounded bg-blue-800/40"></div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-[120px] animate-pulse rounded bg-blue-800/40"></div>
          <div className="h-10 w-[120px] animate-pulse rounded bg-blue-800/40"></div>
        </div>
      </div>

      <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-blue-800/30 bg-blue-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              <div className="h-6 w-[200px] animate-pulse rounded bg-blue-800/40"></div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-10 w-[250px] animate-pulse rounded bg-blue-800/40"></div>
              <div className="h-10 w-10 animate-pulse rounded bg-blue-800/40"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-900/20">
              <TableRow className="border-blue-800/30">
                <TableHead>
                  <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[150px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[120px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
                <TableHead>
                  <div className="h-4 w-[80px] animate-pulse rounded bg-blue-800/40"></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i} className="border-blue-800/30">
                    <TableCell>
                      <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[150px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[120px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[100px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[80px] animate-pulse rounded bg-blue-800/40"></div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="h-9 w-[200px] animate-pulse rounded bg-blue-800/40"></div>
        <div className="h-9 w-[200px] animate-pulse rounded bg-blue-800/40"></div>
      </div>
    </div>
  );
}
