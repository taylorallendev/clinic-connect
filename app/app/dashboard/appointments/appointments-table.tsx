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
  onStatusChange?: (status: string) => void;
  onSearchChange?: (search: string) => void; 
  onDateChange?: (date: string) => void;
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
}: AppointmentsTableProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  // Don't set a default date - this caused confusion with filtering
  const [date, setDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "case-management">("all");
  const [activeTab, setActiveTab] = useState("all");

  // Sidebar state
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Initial load effect - load all appointments without filters
  useEffect(() => {
    // If we have appointments already, no need to fetch
    if (appointments.length === 0) {
      console.log("Initial load - fetching all appointments without filters");
      // Use empty strings for all filters to get all appointments
      fetchAppointments(0, pageSize, "", "", "");
    }
  }, [appointments.length]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted with:", search);
    
    // Always use the fetchAppointments function to ensure everything stays in sync
    await fetchAppointments(
      0, // Reset to first page
      pageSize,
      search,
      date ? format(date, "yyyy-MM-dd") : "",
      activeTab === "all" ? "" : activeTab
    );
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    console.log("handleDateSelect called with date:", newDate);
    
    // Format date as YYYY-MM-DD to match API expectations
    let formattedDate = "";
    
    if (newDate) {
      try {
        // Ensure correct timezone handling - use UTC for consistency
        formattedDate = format(newDate, "yyyy-MM-dd");
        console.log("Formatted date for API:", formattedDate);
        
        // IMPORTANT: Force update the displayed date in button
        setDate(newDate);
      } catch (e) {
        console.error("Error formatting date:", e);
        formattedDate = "";
        setDate(null);
      }
    } else {
      console.log("Clearing date filter");
      setDate(null);
    }
    
    // Get current status filter
    const statusFilter = activeTab === "all" ? "" : activeTab;
    console.log("Using status filter with date:", statusFilter);
    
    // Call the parent's onDateChange directly for immediate update
    if (onDateChange) {
      console.log("Calling parent's onDateChange with:", formattedDate);
      onDateChange(formattedDate);
    }
    
    // Always use fetchAppointments to keep everything in sync
    fetchAppointments(
      0, // Reset to first page
      pageSize,
      search,
      formattedDate,
      statusFilter
    );
  };

  const handlePageChange = async (newPage: number) => {
    await fetchAppointments(
      newPage,
      pageSize,
      search,
      date ? format(date, "yyyy-MM-dd") : ""
    );
  };

  const handleClearFilters = async () => {
    console.log("Clearing all filters in AppointmentsTable");
    
    // Clear local state
    setSearch("");
    setDate(null);
    setActiveTab("all");
    
    // Important: Only after clearing local state, update parent state through fetchAppointments
    await fetchAppointments(0, pageSize, "", "", ""); // Pass empty strings for all filters
    
    // Show visual confirmation
    toast({
      title: "Filters cleared",
      description: "Showing all appointments",
    });
  };

  // Synchronizes the local and parent state for filters and pagination
  const fetchAppointments = async (
    pageNum: number,
    size: number,
    query: string,
    dateFilter: string,
    statusFilter: string = ""
  ) => {
    setIsLoading(true);
    try {
      // Verify that the status filter is valid
      let apiStatusFilter = statusFilter;
      // Make sure we only use valid status values
      if (statusFilter && !["ongoing", "completed", "reviewed", "exported"].includes(statusFilter.toLowerCase())) {
        console.log("Ignoring invalid status filter:", statusFilter);
        apiStatusFilter = ""; // Use empty string for invalid statuses
      }
      
      console.log("AppointmentsTable.fetchAppointments called with:", { 
        pageNum, size, query, dateFilter, 
        statusFilter, // Original value
        apiStatusFilter // Value that will be sent to API
      });
      
      // Update local state first
      setSearch(query || "");
      
      // Update date state if provided
      if (dateFilter) {
        try {
          const parsedDate = new Date(dateFilter);
          console.log("Setting date state to:", parsedDate);
          setDate(parsedDate);
        } catch (e) {
          console.error("Error parsing date:", e);
          setDate(null);
        }
      } else {
        setDate(null);
      }
      
      // Update status tab state based on status filter
      if (statusFilter === "") {
        // Empty status filter means "all"
        console.log("Setting activeTab to 'all'");
        setActiveTab("all");
      } else {
        // First create a reverse mapping from status value to tab name
        const statusToTab: Record<string, string> = {
          "": "all",
          "ongoing": "ongoing",
          "completed": "completed",
          "exported": "exported",
          "reviewed": "reviewed"
        };
        
        const tabValue = statusToTab[statusFilter] || "all";
        console.log(`Setting activeTab to '${tabValue}' based on statusFilter '${statusFilter}'`);
        setActiveTab(tabValue);
      }
      
      // Then use the provided callbacks to update parent state
      if (onSearchChange) onSearchChange(query);
      if (onDateChange) onDateChange(dateFilter);
      if (onStatusChange) onStatusChange(apiStatusFilter); // Use the API-compatible value
      onPageChange(pageNum + 1); // Page is 1-indexed in parent but 0-indexed here
      
      // Show toast for user feedback
      toast({
        title: "Filters applied",
        description: "The appointments list has been updated",
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      toast({
        title: "Error",
        description: "Failed to apply filters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/80 hover:bg-green-500";
      case "ongoing":
        return "bg-blue-500/80 hover:bg-blue-500";
      case "exported":
        return "bg-purple-500/80 hover:bg-purple-500";
      case "reviewed":
        return "bg-yellow-500/80 hover:bg-yellow-500";
      case "scheduled":
        return "bg-gray-500/80 hover:bg-gray-500";
      default:
        return "bg-gray-500/80 hover:bg-gray-500";
    }
  };

  // Filter appointments by status for the case management view
  const filterAppointmentsByStatus = (status: string) => {
    return appointments.filter(
      (apt) => apt.status.toLowerCase() === status.toLowerCase()
    );
  };

  // Only use valid status values
  const ongoingAppointments = filterAppointmentsByStatus("ongoing");
  const completedAppointments = filterAppointmentsByStatus("completed");
  const exportedAppointments = filterAppointmentsByStatus("exported");
  const reviewedAppointments = filterAppointmentsByStatus("reviewed");

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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-950 to-indigo-950 border-blue-800/30">
        <CardContent className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              {/* Search Form */}
              <form
                onSubmit={handleSearch}
                className="flex items-center space-x-2 w-full sm:w-1/2"
              >
                <Input
                  placeholder="Search appointments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-blue-900/20 border-blue-700/30 text-blue-50 placeholder:text-blue-400/50"
                />
                <Button 
                  type="submit" 
                  variant="outline" 
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                >
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex gap-2">
                  {/* Status Filter */}
                  <Select
                    value={activeTab || "all"}
                    onValueChange={(value) => {
                      setActiveTab(value);
                      // IMPORTANT: Only use valid enum values (ongoing, completed, reviewed, exported)
                      // There is no "scheduled" status in the database
                      const statusMap: Record<string, string> = {
                        "all": "",
                        "ongoing": "ongoing",
                        "completed": "completed", 
                        "exported": "exported",
                        "reviewed": "reviewed"
                      };
                      
                      const mappedStatus = statusMap[value] || "";
                      console.log("Status changed to:", value, "mapped to:", mappedStatus);
                      
                      // Always use fetchAppointments to keep everything in sync
                      fetchAppointments(
                        0, // Reset to first page
                        pageSize,
                        search,
                        date ? format(date, "yyyy-MM-dd") : "",
                        mappedStatus
                      );
                    }}
                  >
                    <SelectTrigger className="bg-blue-900/20 border-blue-700/30 text-blue-50 w-[140px]">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="exported">Exported</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "bg-blue-900/20 border-blue-700/30 text-blue-50 w-[140px]",
                          !date && "text-blue-300"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MMM d, yyyy") : "Date Filter"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={date || undefined}
                        onSelect={(newDate) => {
                          console.log("Calendar date selected:", newDate);
                          // Call handleDateSelect which will update the UI and trigger the filter
                          handleDateSelect(newDate);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Clear Filters button clicked");
                    // First clear the UI state
                    setSearch("");
                    setDate(null);
                    setActiveTab("all");
                    
                    // Then call the handler
                    handleClearFilters();
                  }}
                  className="whitespace-nowrap bg-gray-600/50 hover:bg-gray-600 text-white border-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-blue-800/30">
                    <TableHead className="text-blue-200">Date</TableHead>
                    <TableHead className="text-blue-200">Time</TableHead>
                    <TableHead className="text-blue-200">Patient</TableHead>
                    <TableHead className="text-blue-200">Provider</TableHead>
                    <TableHead className="text-blue-200">Type</TableHead>
                    <TableHead className="text-blue-200">Status</TableHead>
                    <TableHead className="text-blue-200 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        className="border-blue-800/30 hover:bg-blue-900/20"
                      >
                        <TableCell className="text-blue-100">
                          {appointment.date}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          {appointment.time}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          {appointment.patients
                            ? appointment.patients.name
                            : "Unknown Patient"}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          {appointment.users
                            ? appointment.users.name
                            : "Unassigned"}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          <Badge variant="outline" className="capitalize text-blue-100 border-blue-700/50">
                            {appointment.type?.replace("_", " ") || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-100">
                          <Badge
                            className={`${getStatusColor(appointment.status)} text-white capitalize`}
                          >
                            {appointment.status?.replace("_", " ") ||
                              "Scheduled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-100 text-right">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600/80 hover:bg-blue-600 text-white"
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
                        className="text-center py-6 text-blue-200"
                      >
                        No appointments found for the selected criteria. Try adjusting filters or creating a new appointment.
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
                    className="mr-2"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center mx-2">
                    Page {page + 1} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages - 1, page + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="ml-2"
                  >
                    Next
                  </Button>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

      {selectedAppointment && (
        <AppointmentSidebar
          appointment={selectedAppointment}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />
      )}
    </div>
  );
}
