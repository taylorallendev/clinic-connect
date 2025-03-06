"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DropResult } from "react-beautiful-dnd";
import CasesKanbanBoard from "./cases-kanban";
import { getUpcomingAppointments, Appointment } from "./actions";
import { CasesTable } from "./cases-table";

interface Case {
  id: string;
  name: string;
  patient: string;
  type: string;
  date: string;
  assignedTo: string;
  status: string;
  time?: string;
}

interface Stat {
  title: string;
  value: string;
  change: string;
}

interface DashboardContentProps {
  cases: Case[];
  stats: Stat[];
}

export function DashboardContent({
  cases: initialCases,
  stats,
}: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState("overview"); // "overview" or "management"
  const [activeTab, setActiveTab] = useState("appointments"); // For the combined card
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Use the server-provided cases as initial state
  const [cases, setCases] = useState(
    initialCases.map((caseItem) => ({
      ...caseItem,
      // Add time if it doesn't exist
      time: caseItem.time || "10:00 AM",
    }))
  );

  // Filter cases based on search query
  const filteredCases = cases.filter((caseItem) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      caseItem.name.toLowerCase().includes(searchLower) ||
      caseItem.patient.toLowerCase().includes(searchLower) ||
      caseItem.id.toLowerCase().includes(searchLower)
    );
  });

  // Fetch upcoming appointments
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setIsLoadingAppointments(true);
        const appointmentsData = await getUpcomingAppointments();
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoadingAppointments(false);
      }
    }

    fetchAppointments();
  }, []);

  // Get ongoing cases
  const ongoingCases = cases.filter(
    (caseItem) => caseItem.status === "Ongoing"
  );

  // Get cases by status for the kanban board
  const completedCases = cases.filter(
    (caseItem) => caseItem.status === "Completed"
  );
  const reviewedCases = cases.filter(
    (caseItem) => caseItem.status === "Reviewed"
  );
  const exportedCases = cases.filter(
    (caseItem) => caseItem.status === "Exported"
  );

  // Status colors
  const statusColors = {
    Ongoing: "bg-[#fff7ed] text-[#f97316]",
    Completed: "bg-[#f0fdf4] text-[#22c55e]",
    Reviewed: "bg-[#f0f9ff] text-[#0ea5e9]",
    Exported: "bg-[#faf5ff] text-[#a855f7]",
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Get the case that was dragged
    const draggedCase = cases.find((c) => c.id === result.draggableId);
    if (!draggedCase) return;

    // Determine the new status based on the destination droppable
    let newStatus;
    switch (destination.droppableId) {
      case "completed":
        newStatus = "Completed";
        break;
      case "reviewed":
        newStatus = "Reviewed";
        break;
      case "exported":
        newStatus = "Exported";
        break;
      default:
        return;
    }

    // Update the case status
    const updatedCases = cases.map((c) =>
      c.id === draggedCase.id ? { ...c, status: newStatus } : c
    );

    setCases(updatedCases);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#e2e8f0] bg-white flex items-center px-6 justify-between">
        <h2 className="text-xl font-medium text-[#0f172a]">Dashboard</h2>
        <div className="flex items-center gap-3">
          <Button className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg px-4">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden bg-white"
            >
              <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-[#64748b] text-sm">{stat.title}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-semibold text-[#0f172a]">
                      {stat.value}
                    </p>
                    <p className="text-xs text-[#22c55e]">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Combined Appointments and Cases Card */}
        <Card className="border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b border-[#e2e8f0] pb-0 px-0">
            <Tabs
              defaultValue="appointments"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-transparent w-full justify-start rounded-none border-b border-[#e2e8f0]">
                <TabsTrigger
                  value="appointments"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0ea5e9] data-[state=active]:shadow-none py-3 px-6 data-[state=active]:text-[#0ea5e9]"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Appointments
                </TabsTrigger>
                <TabsTrigger
                  value="ongoing"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0ea5e9] data-[state=active]:shadow-none py-3 px-6 data-[state=active]:text-[#0ea5e9]"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Ongoing Cases
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0ea5e9] data-[state=active]:shadow-none py-3 px-6 data-[state=active]:text-[#0ea5e9]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Completed
                </TabsTrigger>
                <TabsTrigger
                  value="reviewed"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0ea5e9] data-[state=active]:shadow-none py-3 px-6 data-[state=active]:text-[#0ea5e9]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reviewed
                </TabsTrigger>
                <TabsTrigger
                  value="exported"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0ea5e9] data-[state=active]:shadow-none py-3 px-6 data-[state=active]:text-[#0ea5e9]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exported
                </TabsTrigger>
              </TabsList>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="m-0">
                <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#0f172a] text-lg">
                      Upcoming Appointments
                    </CardTitle>
                    <CardDescription className="text-[#64748b]">
                      Scheduled appointments for today and tomorrow
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="text-[#64748b] border-[#e2e8f0] rounded-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Appointment
                    </Button>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                          <TableHead className="text-[#64748b] font-medium">
                            ID
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium">
                            Patient
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium">
                            Owner
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium">
                            Date
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium">
                            Time
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium">
                            Type
                          </TableHead>
                          <TableHead className="text-[#64748b] font-medium w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAppointments ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]"></div>
                                <p className="mt-2 text-[#64748b]">
                                  Loading appointments...
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : appointments.length > 0 ? (
                          appointments.map((appointment) => (
                            <TableRow
                              key={appointment.id}
                              className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]"
                            >
                              <TableCell className="font-medium text-[#334155]">
                                {appointment.id}
                              </TableCell>
                              <TableCell className="text-[#334155]">
                                {appointment.patient}
                              </TableCell>
                              <TableCell className="text-[#334155]">
                                {appointment.owner}
                              </TableCell>
                              <TableCell className="text-[#334155]">
                                {appointment.date}
                              </TableCell>
                              <TableCell className="text-[#334155]">
                                {appointment.time}
                              </TableCell>
                              <TableCell className="text-[#334155]">
                                {appointment.type}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4 text-[#64748b]" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-white border-[#e2e8f0] rounded-lg"
                                  >
                                    <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                      Create Case
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                      Reschedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center">
                                <div className="bg-[#f1f5f9] p-4 rounded-full mb-4">
                                  <Calendar className="h-8 w-8 text-[#64748b]" />
                                </div>
                                <h3 className="text-lg font-medium text-[#334155] mb-2">
                                  No upcoming appointments
                                </h3>
                                <p className="text-[#64748b] max-w-md mb-6">
                                  There are no appointments scheduled for the
                                  near future.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="bg-white border-t border-[#e2e8f0] p-4">
                  <Button
                    variant="outline"
                    className="text-[#0ea5e9] border-[#e2e8f0] rounded-lg ml-auto"
                  >
                    View All Appointments
                  </Button>
                </CardFooter>
              </TabsContent>

              {/* Ongoing Cases Tab */}
              <TabsContent value="ongoing" className="m-0">
                <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#0f172a] text-lg">
                      Ongoing Cases
                    </CardTitle>
                    <CardDescription className="text-[#64748b]">
                      Cases that are currently in progress
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="text-[#64748b] border-[#e2e8f0] rounded-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Case
                    </Button>
                  </div>
                </div>
                <CardContent className="p-0">
                  <CasesTable cases={cases} status="Ongoing" />
                </CardContent>
                <CardFooter className="bg-white border-t border-[#e2e8f0] p-4">
                  <Button
                    variant="outline"
                    className="text-[#0ea5e9] border-[#e2e8f0] rounded-lg ml-auto"
                  >
                    View All Ongoing Cases
                  </Button>
                </CardFooter>
              </TabsContent>

              {/* Completed Cases Tab */}
              <TabsContent value="completed" className="m-0">
                <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#0f172a] text-lg">
                      Completed Cases
                    </CardTitle>
                    <CardDescription className="text-[#64748b]">
                      Cases that have been completed and are ready for review
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="p-0">
                  <CasesTable cases={cases} status="Completed" />
                </CardContent>
                <CardFooter className="bg-white border-t border-[#e2e8f0] p-4">
                  <Button
                    variant="outline"
                    className="text-[#0ea5e9] border-[#e2e8f0] rounded-lg ml-auto"
                  >
                    View All Completed Cases
                  </Button>
                </CardFooter>
              </TabsContent>

              {/* Reviewed Cases Tab */}
              <TabsContent value="reviewed" className="m-0">
                <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#0f172a] text-lg">
                      Reviewed Cases
                    </CardTitle>
                    <CardDescription className="text-[#64748b]">
                      Cases that have been reviewed and are ready for export
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="p-0">
                  <CasesTable cases={cases} status="Reviewed" />
                </CardContent>
                <CardFooter className="bg-white border-t border-[#e2e8f0] p-4">
                  <Button
                    variant="outline"
                    className="text-[#0ea5e9] border-[#e2e8f0] rounded-lg ml-auto"
                  >
                    View All Reviewed Cases
                  </Button>
                </CardFooter>
              </TabsContent>

              {/* Exported Cases Tab */}
              <TabsContent value="exported" className="m-0">
                <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-[#0f172a] text-lg">
                      Exported Cases
                    </CardTitle>
                    <CardDescription className="text-[#64748b]">
                      Cases that have been exported to external systems
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="p-0">
                  <CasesTable cases={cases} status="Exported" />
                </CardContent>
                <CardFooter className="bg-white border-t border-[#e2e8f0] p-4">
                  <Button
                    variant="outline"
                    className="text-[#0ea5e9] border-[#e2e8f0] rounded-lg ml-auto"
                  >
                    View All Exported Cases
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
