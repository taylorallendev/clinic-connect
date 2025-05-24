"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import AppointmentData from the store to ensure consistency
import { AppointmentData } from "@/store/use-case-store";

interface AppointmentsTableProps {
  appointments: AppointmentData[];
  onSelectAppointment: (appointment: AppointmentData) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (status: string) => void;
  onSearchChange?: (search: string) => void;
  onDateChange?: (date: string) => void;
  isLoading?: boolean;
}

export function AppointmentsTable({
  appointments,
  onSelectAppointment,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onStatusChange,
  onSearchChange,
  onDateChange,
  isLoading = false,
}: AppointmentsTableProps) {
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Updated to match the CaseStatus enum from your database schema
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-600 hover:bg-green-700";
      case "ongoing":
        return "bg-blue-600 hover:bg-blue-700";
      case "reviewed":
        return "bg-amber-600 hover:bg-amber-700";
      default:
        return "bg-slate-600 hover:bg-slate-700";
    }
  };

  // Handle appointment selection
  const handleViewAppointment = (appointment: AppointmentData) => {
    console.log("View appointment clicked for:", appointment.id);
    setSelectedAppointment(appointment);
    onSelectAppointment(appointment);
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-md">
        <CardContent className="p-6">
          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">
                    Patient
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Provider
                  </TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      <div className="flex justify-center items-center py-4">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Loading appointments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      className="border-border hover:bg-muted/10"
                    >
                      <TableCell className="text-foreground">
                        {appointment.date}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {appointment.time}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {appointment.patientName || appointment.patients?.name || "Unknown Patient"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {appointment.ownerName || appointment.users?.name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <Badge
                          variant="outline"
                          className="capitalize text-foreground border-border"
                        >
                          {appointment.type?.replace("_", " ") || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <Badge
                          className={`${getStatusColor(appointment.status)} text-white capitalize`}
                        >
                          {appointment.status?.replace("_", " ") || "Scheduled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground text-right">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => handleViewAppointment(appointment)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No appointments found for the selected criteria. Try
                      adjusting filters or creating a new appointment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page))}
                  disabled={page <= 1}
                  className="mr-2 border-input bg-muted/20 text-foreground hover:bg-muted/30"
                >
                  Previous
                </Button>
                <div className="flex items-center mx-2 text-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={page >= totalPages}
                  className="ml-2 border-input bg-muted/20 text-foreground hover:bg-muted/30"
                >
                  Next
                </Button>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
