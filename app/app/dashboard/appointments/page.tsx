"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerDemo } from "@/components/ui/date-picker";
import { AppointmentsTable } from "./appointments-table";
import { AppointmentSidebar } from "./appointment-sidebar";
import { getAppointments, debugListAllCases } from "@/app/actions";

// Define the appointment data interface
interface AppointmentData {
  id: string;
  name: string;
  date: string;
  time: string;
  type: string;
  status: string;
  patients: {
    id: string | null;
    name: string;
    first_name: string;
    last_name: string;
  };
  users: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
  };
  metadata: {
    hasTranscriptions: boolean;
    hasSoapNotes: boolean;
    hasGenerations: boolean;
  };
}

export default function AppointmentsPage() {
  // State for appointments data
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch appointments when filters or pagination changes
  useEffect(() => {
    let isMounted = true;

    async function fetchAppointments() {
      try {
        setLoading(true);
        console.log("Fetching appointments with filters:", {
          page,
          searchQuery,
          dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
          statusFilter,
        });

        // Use the server action directly instead of the API route
        const result = await getAppointments({
          page,
          pageSize,
          searchQuery: searchQuery ? searchQuery.trim() : "",
          dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
          timestamp: Date.now(), // Add timestamp to bust cache
        });

        if (!isMounted) return;

        if (result.appointments) {
          console.log(
            `Setting ${result.appointments.length} appointments with totalCount=${result.totalCount}`
          );

          // Check if we have any appointments with actual data
          if (result.appointments.length > 0) {
            console.log("First appointment sample:", result.appointments[0]);
          } else {
            console.log("No appointments were returned from the server action");
          }

          setAppointments(result.appointments);
          setTotalCount(result.totalCount || 0);
        } else {
          console.error(
            "Server action did not return appointments array:",
            result
          );
          setAppointments([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        if (isMounted) {
          setAppointments([]);
          setTotalCount(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAppointments();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [page, searchQuery, dateFilter, statusFilter, pageSize]);

  // Handle appointment selection
  const handleSelectAppointment = (appointment: AppointmentData) => {
    if (appointment) {
      console.log("Selected appointment:", appointment.id);
      setSelectedAppointment(appointment);
    }
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    console.log("Closing sidebar");
    setSelectedAppointment(null);
  };

  // Manual search function if needed
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Manual search triggered with:", searchQuery);
    setPage(0); // Reset to first page when searching
  };

  // A direct fetch function that uses server actions
  const fetchAppointmentsDirectly = async () => {
    console.log("Direct fetch with filters:", {
      searchQuery,
      dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
      statusFilter,
    });

    setLoading(true);
    try {
      // Use the server action directly
      const result = await getAppointments({
        page,
        pageSize,
        searchQuery: searchQuery ? searchQuery.trim() : "",
        dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
        timestamp: Date.now(), // Add timestamp to bust cache
        forceRefresh: true, // Force a fresh fetch
      });

      if (result.appointments) {
        console.log(
          `Direct fetch returned ${result.appointments.length} appointments`
        );
        setAppointments(result.appointments);
        setTotalCount(result.totalCount || 0);
      } else {
        console.error(
          "Direct fetch did not return appointments array:",
          result
        );
      }
    } catch (error) {
      console.error("Error in direct fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check database state
  const debugDatabase = async () => {
    console.log("Debugging database state...");
    try {
      const cases = await debugListAllCases();
      console.log("Database debug results:", cases);
    } catch (error) {
      console.error("Error debugging database:", error);
    }
  };

  // Handle date filter change
  const handleDateChange = (date: Date | null | string) => {
    // Ensure the date is properly set in the state
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      console.log("Setting parent date filter to:", date);
      setDateFilter(date);
    } else if (typeof date === "string" && date) {
      try {
        const [year, month, day] = date.split("-").map(Number);
        const newDate = new Date(year, month - 1, day);
        console.log("Parsed string date to:", newDate);
        setDateFilter(newDate);
      } catch (e) {
        console.error("Error parsing date string:", e, date);
        setDateFilter(null);
      }
    } else {
      console.log("Clearing parent date filter");
      setDateFilter(null);
    }
    setPage(0); // Reset to first page when changing date filter
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <Button
          onClick={debugDatabase}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Debug DB
        </Button>
      </div>

      {/* Add filter controls section */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search appointments..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Search
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          <DatePickerDemo
            date={dateFilter}
            setDate={handleDateChange}
            placeholder="Filter by date"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(null)}
              className="h-8 px-2"
            >
              ✕
            </Button>
          )}
        </div>

        {/* Add status filter dropdown */}
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setPage(0); // Reset to first page when changing status
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("")}
              className="h-8 px-2"
            >
              ✕
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            console.log("Refresh button clicked");
            // Reset all filters and fetch fresh data
            setSearchQuery("");
            setDateFilter(null);
            setStatusFilter("");
            setPage(0);

            // Use our direct fetch function for immediate results
            setTimeout(() => {
              fetchAppointmentsDirectly();
            }, 100); // Slight delay to ensure state updates have processed
          }}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {appointments.length > 0 ? (
            <AppointmentsTable
              appointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={(newPage) => setPage(newPage - 1)}
              onStatusChange={(status) => setStatusFilter(status)}
              onSearchChange={(search) => setSearchQuery(search)}
              onDateChange={(dateStr) => {
                console.log("Parent received date change:", dateStr);
                if (dateStr) {
                  try {
                    // Convert YYYY-MM-DD to a Date object
                    // Ensure proper timezone handling by using this syntax
                    const [year, month, day] = dateStr.split("-").map(Number);
                    const parsedDate = new Date(year, month - 1, day);

                    // Check if it's a valid date
                    if (!isNaN(parsedDate.getTime())) {
                      console.log("Setting date filter to:", {
                        rawDate: parsedDate,
                        formattedISO: parsedDate.toISOString(),
                        original: dateStr,
                      });
                      setDateFilter(parsedDate);
                    } else {
                      console.error("Invalid date received:", dateStr);
                      setDateFilter(null);
                    }
                  } catch (e) {
                    console.error("Error parsing date:", e, dateStr);
                    setDateFilter(null);
                  }
                } else {
                  console.log("Clearing date filter");
                  setDateFilter(null);
                }
              }}
            />
          ) : (
            <Card className="bg-gradient-to-br from-[hsl(174,59%,25%)] to-[hsl(197,37%,24%)] border-[hsl(174,59%,39%)]/30">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-lg text-white mb-4">
                    No appointments found
                  </p>
                  <p className="text-sm text-[hsl(174,59%,80%)] max-w-md">
                    {searchQuery || dateFilter || statusFilter
                      ? "Try adjusting your search filters or click Refresh to see all appointments"
                      : "No appointments are available. Try again later or create a new appointment."}
                  </p>
                  <Button
                    className="mt-4 bg-[hsl(174,59%,39%)] hover:bg-[hsl(174,59%,34%)] text-white"
                    onClick={() => {
                      console.log(
                        "Clearing all filters from No Appointments card"
                      );

                      // Clear all filters with a more direct approach
                      setSearchQuery("");
                      setDateFilter(null);
                      setStatusFilter("");
                      setPage(0);

                      // Use server action directly
                      setLoading(true);
                      getAppointments({
                        page: 0,
                        pageSize,
                        searchQuery: "",
                        dateFilter: "",
                        timestamp: Date.now(),
                        forceRefresh: true,
                      })
                        .then((data) => {
                          console.log("Direct clear filters response:", data);
                          if (data.appointments) {
                            setAppointments(data.appointments);
                            setTotalCount(data.totalCount || 0);
                          }
                          setLoading(false);
                        })
                        .catch((error) => {
                          console.error("Error in direct clear:", error);
                          setLoading(false);
                        });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedAppointment && (
        <AppointmentSidebar
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={handleCloseSidebar}
        />
      )}
    </div>
  );
}
