"use client";

import { useState, useEffect } from "react";
import { AppointmentsTable } from "./appointments-table";
import { AppointmentSidebar } from "./appointment-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { AppointmentData } from "@/store/use-case-store";
import { DatePickerDemo } from "@/components/ui/date-picker";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Fetch appointments
  useEffect(() => {
    let isMounted = true; // For preventing state updates after unmount
    
    async function fetchAppointments() {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        console.log("Main Page: Fetching appointments with params:", {
          page,
          pageSize,
          searchQuery,
          dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
          statusFilter
        });
        
        // Log state for debugging
        console.log("Current appointments state:", {
          currentAppointments: appointments.length,
          loadingState: loading
        });
        
        // Create a unique timestamp for cache busting
        const fetchTimestamp = Date.now();
        
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page,
            pageSize,
            searchQuery: searchQuery ? searchQuery.trim() : "",
            dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
            statusFilter: statusFilter ? statusFilter.trim() : "",
            timestamp: fetchTimestamp,
          }),
        });

        if (!response.ok) {
          try {
            const errorText = await response.text();
            console.error("API error response:", errorText);
            
            // Try parsing the error text as JSON (if it's a structured error)
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error) {
                console.error("Structured error from API:", errorJson.error);
                
                // Check for specific error types and handle them
                if (errorJson.error.includes("enum case_status")) {
                  console.error("Status enum error - the status filter value is not valid in the database");
                  // Reset status filter since it's causing errors
                  if (isMounted) {
                    setStatusFilter("");
                  }
                }
                
                if (errorJson.error.includes("dateTime")) {
                  console.error("Date filter error - there might be an issue with the dateTime column");
                  // Reset date filter since it's causing errors
                  if (isMounted) {
                    setDateFilter(null);
                  }
                }
              }
            } catch (jsonError) {
              // If error text is not JSON, just log the raw text
              console.error("Raw API error (not JSON):", errorText);
            }
          } catch (parseError) {
            // If we can't even get the error text
            console.error("Failed to parse error response:", parseError);
          }
          
          // Set empty appointments instead of throwing
          if (isMounted) {
            setAppointments([]);
            setTotalCount(0);
          }
          return;
        }

        const data = await response.json();
        console.log("Received appointments data:", data);
        
        if (data.debug) {
          console.log("API debug info:", data.debug);
        }
        
        if (!isMounted) return;
        
        if (data.error) {
          console.error("API returned error:", data.error);
          setAppointments([]);
          setTotalCount(0);
        } else if (Array.isArray(data.appointments)) {
          console.log(`Setting ${data.appointments.length} appointments with totalCount=${data.totalCount}`);
          
          // Check if we have any appointments with actual data
          if (data.appointments.length > 0) {
            console.log("First appointment sample:", data.appointments[0]);
          } else {
            console.log("No appointments were returned from the API");
          }
          
          setAppointments(data.appointments);
          setTotalCount(data.totalCount || 0);
        } else {
          console.error("API did not return appointments array:", data);
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
  }, [page, searchQuery, dateFilter, statusFilter]);

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
    
    // Fetch with current filters
    fetchAppointmentsDirectly();
  };
  
  // A direct fetch function that bypasses child components
  const fetchAppointmentsDirectly = async () => {
    console.log("Direct fetch with filters:", {
      searchQuery,
      dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
      statusFilter
    });
    
    setLoading(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          pageSize,
          searchQuery: searchQuery ? searchQuery.trim() : "",
          dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
          statusFilter: statusFilter ? statusFilter.trim() : "",
          timestamp: Date.now(),
        }),
      });
      
      const data = await response.json();
      if (Array.isArray(data.appointments)) {
        console.log(`Direct fetch returned ${data.appointments.length} appointments`);
        setAppointments(data.appointments);
        setTotalCount(data.totalCount || 0);
      } else {
        console.error("Direct fetch did not return appointments array:", data);
      }
    } catch (error) {
      console.error("Error in direct fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date filter change
  const handleDateChange = (date: Date | null) => {
    setDateFilter(date);
    setPage(0); // Reset to first page when changing date filter
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-50">Appointments</h1>
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
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const parsedDate = new Date(year, month - 1, day);
                    
                    // Check if it's a valid date
                    if (!isNaN(parsedDate.getTime())) {
                      console.log("Setting date filter to:", {
                        rawDate: parsedDate,
                        formattedISO: parsedDate.toISOString(),
                        original: dateStr
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
            <Card className="bg-gradient-to-br from-blue-950 to-indigo-950 border-blue-800/30">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-lg text-blue-100 mb-4">
                    No appointments found
                  </p>
                  <p className="text-sm text-blue-300 max-w-md">
                    {searchQuery || dateFilter || statusFilter
                      ? "Try adjusting your search filters or click Refresh to see all appointments"
                      : "No appointments are available. Try again later or create a new appointment."}
                  </p>
                  <Button 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      console.log("Clearing all filters from No Appointments card");
                      
                      // Clear all filters with a more direct approach
                      setSearchQuery("");
                      setDateFilter(null);
                      setStatusFilter("");
                      setPage(0);
                      
                      // Directly fetch without any filters
                      // Don't wait for React state to update - use direct values
                      setLoading(true);
                      fetch("/api/appointments", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          page: 0,
                          pageSize,
                          searchQuery: "",
                          dateFilter: "",
                          statusFilter: "",
                          timestamp: Date.now(),
                        }),
                      })
                      .then(response => response.json())
                      .then(data => {
                        console.log("Direct clear filters response:", data);
                        if (Array.isArray(data.appointments)) {
                          setAppointments(data.appointments);
                          setTotalCount(data.totalCount || 0);
                        }
                        setLoading(false);
                      })
                      .catch(error => {
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
          onClose={handleCloseSidebar}
        />
      )}
    </div>
  );
}
