"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  SearchIcon,
  RefreshCw,
  Plus,
  CheckCircle,
  PlusCircle,
  PlayCircle,
  FileText,
  Mic,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AppointmentSidebar } from "./appointment-sidebar";
import { AppointmentData } from "@/store/use-case-store";

interface AppointmentsTableProps {
  appointments: AppointmentData[];
  onSelectAppointment: (appointment: AppointmentData) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function AppointmentsTable({
  appointments,
  onSelectAppointment,
  page,
  pageSize,
  totalCount,
  onPageChange,
  isLoading = false,
}: AppointmentsTableProps) {
  const { toast } = useToast();

  // Sidebar state
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-success hover:bg-success/90";
      case "ongoing":
        return "bg-info hover:bg-info/90";
      case "exported":
        return "bg-primary hover:bg-primary/90";
      case "reviewed":
        return "bg-warning hover:bg-warning/90";
      case "scheduled":
        return "bg-muted hover:bg-muted/90";
      default:
        return "bg-muted hover:bg-muted/90";
    }
  };

  // Handle appointment selection and sidebar open/close
  const handleViewAppointment = (appointment: AppointmentData) => {
    console.log("View appointment clicked for:", appointment.id);
    // Update both local state and parent state
    setSelectedAppointment(appointment);
    setIsSidebarOpen(true);
    onSelectAppointment(appointment); // Notify parent component
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage + 1); // Convert to 1-indexed for parent
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
                        {appointment.patients
                          ? appointment.patients.name
                          : "Unknown Patient"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {appointment.users
                          ? appointment.users.name
                          : "Unassigned"}
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
                  onClick={() => handlePageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="mr-2 border-input bg-muted/20 text-foreground hover:bg-muted/30"
                >
                  Previous
                </Button>
                <div className="flex items-center mx-2 text-foreground">
                  Page {page + 1} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages - 1, page + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="ml-2 border-input bg-muted/20 text-foreground hover:bg-muted/30"
                >
                  Next
                </Button>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sidebar moved to parent component */}
    </div>
  );
}
