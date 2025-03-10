"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { CalendarIcon, SearchIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AppointmentData {
  id: string;
  name: string;
  date: string;
  time: string;
  type: string;
  patients: {
    id: string;
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
  status: string;
}

interface AppointmentsTableProps {
  initialData: {
    appointments: AppointmentData[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

export function AppointmentsTable({ initialData }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<AppointmentData[]>(initialData.appointments)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(initialData.page)
  const [totalCount, setTotalCount] = useState(initialData.totalCount)
  const [pageSize, setPageSize] = useState(initialData.pageSize)
  const [date, setDate] = useState<Date | null>(() => {
    // If the initialData was filtered by date, we should set that as the default date
    try {
      // Determine if there's a date filter based on having appointments and today's date
      if (initialData.appointments && initialData.appointments.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }
      return null;
    } catch (e) {
      console.error("Error setting initial date:", e);
      return null;
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0) // Reset to first page when search changes
    await fetchAppointments(0, pageSize, search, date ? format(date, "yyyy-MM-dd") : "")
  }

  const handleDateSelect = async (newDate: Date | null) => {
    setDate(newDate)
    setPage(0) // Reset to first page when date changes
    await fetchAppointments(0, pageSize, search, newDate ? format(newDate, "yyyy-MM-dd") : "")
  }

  const handlePageChange = async (newPage: number) => {
    await fetchAppointments(newPage, pageSize, search, date ? format(date, "yyyy-MM-dd") : "")
  }

  const handleClearFilters = async () => {
    setSearch("")
    setDate(null)
    setPage(0) // Reset to first page when filters are cleared
    await fetchAppointments(0, pageSize, "", "")
  }

  const fetchAppointments = async (pageNum: number, size: number, query: string, dateFilter: string) => {
    try {
      setIsLoading(true)
      console.log('Fetching appointments with params:', {
        page: pageNum,
        pageSize: size,
        searchQuery: query,
        dateFilter
      });
      
      // Use server action instead of fetch API to avoid cross-domain/CORS issues
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add cache control to prevent caching issues
          "Cache-Control": "no-cache, no-store"
        },
        body: JSON.stringify({
          page: pageNum,
          pageSize: size,
          searchQuery: query,
          dateFilter
        }),
        // Add these options to prevent caching issues
        cache: "no-store",
        next: { revalidate: 0 }
      });

      // Get response details for debugging
      console.log('Response status:', response.status);
      
      // If not OK, try to get error details
      if (!response.ok) {
        let errorDetail = "Failed to fetch appointments";
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorDetail;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorDetail);
      }

      // Parse response data
      let data;
      try {
        data = await response.json();
        console.log('Received appointments data:', {
          appointmentsCount: data.appointments?.length || 0,
          totalCount: data.totalCount,
          page: data.page
        });
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        throw new Error('Invalid response format');
      }
      
      // Update state with received data
      setAppointments(data.appointments || []);
      setTotalCount(data.totalCount || 0);
      setPage(data.page || 0);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Set empty data on error
      setAppointments([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    ongoing: "bg-yellow-100 text-yellow-800", 
    completed: "bg-green-100 text-green-800",
    reviewed: "bg-purple-100 text-purple-800",
    exported: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    noshow: "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export</Button>
          <Button onClick={() => window.location.href = "/app/dashboard/current-case"}>New Appointment</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {totalCount} {totalCount === 1 ? 'Appointment' : 'Appointments'} {date && `for ${format(date, "MMMM d, yyyy")}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search appointments..."
                    className="w-[250px] pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button type="submit" size="icon" className="shrink-0">
                  <SearchIcon className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
                {(search || date) && (
                  <Button type="button" variant="ghost" onClick={handleClearFilters}>
                    Clear
                  </Button>
                )}
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={`loading-${i}`}>
                    <TableCell><div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-16 bg-gray-200 animate-pulse rounded ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : !appointments || appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => {
                  if (!appointment) return null;
                  
                  try {
                    return (
                      <TableRow key={appointment.id || 'unknown'}>
                        <TableCell>
                          {appointment.date ? 
                            (() => {
                              try {
                                return format(new Date(appointment.date), "MMM d, yyyy")
                              } catch (error) {
                                return appointment.date
                              }
                            })() : 
                            "N/A"}
                        </TableCell>
                        <TableCell>{appointment.time || "N/A"}</TableCell>
                        <TableCell>
                          {appointment.patients?.name || 
                           (appointment.patients?.first_name && appointment.patients?.last_name ? 
                             `${appointment.patients.first_name} ${appointment.patients.last_name}` : 
                             "Unknown Patient")}
                        </TableCell>
                        <TableCell>
                          {appointment.users?.name || 
                           (appointment.users?.first_name && appointment.users?.last_name ? 
                             `${appointment.users.first_name} ${appointment.users.last_name}` : 
                             "Unassigned")}
                        </TableCell>
                        <TableCell>{appointment.type || "General"}</TableCell>
                        <TableCell>
                          {appointment.status ? (
                            <Badge className={cn(statusColors[(appointment.status || "").toLowerCase()] || "bg-gray-100")}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.location.href = `/app/dashboard/current-case?id=${appointment.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  } catch (error) {
                    console.error('Error rendering appointment row:', error, appointment);
                    return null;
                  }
                }).filter(Boolean)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </div>
          <Pagination>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0 || isLoading}
            >
              Previous
            </Button>
            <div className="flex items-center mx-2">
              Page {page + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1 || isLoading}
            >
              Next
            </Button>
          </Pagination>
        </div>
      )}
    </div>
  )
}