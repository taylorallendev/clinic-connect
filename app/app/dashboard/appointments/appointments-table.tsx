"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, SearchIcon, RefreshCw, Plus, CheckCircle, PlusCircle, PlayCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentData[]>(initialData.appointments)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(initialData.page)
  const [totalCount, setTotalCount] = useState(initialData.totalCount)
  const [pageSize, setPageSize] = useState(initialData.pageSize)
  const [date, setDate] = useState<Date | null>(() => {
    // Always set today's date as default
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    } catch (e) {
      console.error("Error setting initial date:", e);
      return null;
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'case-management'>('all')
  const [activeTab, setActiveTab] = useState('upcoming')

  const totalPages = Math.ceil(totalCount / pageSize)
  
  // Effect to load appointments with today's date on component mount
  useEffect(() => {
    // If we have no appointments yet, fetch with today's date
    if (date && initialData.appointments.length === 0) {
      fetchAppointments(0, pageSize, "", format(date, "yyyy-MM-dd"));
    }
  }, []);

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
    setIsLoading(true)
    try {
      const url = '/api/appointments'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pageNum,
          pageSize: size,
          searchQuery: query,
          dateFilter: dateFilter,
          timestamp: Date.now(), // Add timestamp to bust cache
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await res.json()
      setAppointments(data.appointments)
      setTotalCount(data.totalCount)
      setPage(pageNum)
      
      // Show toast confirming data refresh
      if (query || dateFilter) {
        toast({
          title: "Appointments filtered",
          description: `Showing ${data.appointments.length} appointments`,
        })
      } else {
        toast({
          title: "Appointments refreshed",
          description: `Showing ${data.appointments.length} appointments`,
        })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/80 hover:bg-green-500'
      case 'ongoing':
        return 'bg-blue-500/80 hover:bg-blue-500'
      case 'exported':
        return 'bg-purple-500/80 hover:bg-purple-500'
      case 'reviewed':
        return 'bg-yellow-500/80 hover:bg-yellow-500'
      case 'scheduled':
        return 'bg-gray-500/80 hover:bg-gray-500'
      default:
        return 'bg-gray-500/80 hover:bg-gray-500'
    }
  }

  // Filter appointments by status for the case management view
  const filterAppointmentsByStatus = (status: string) => {
    return appointments.filter(apt => apt.status.toLowerCase() === status.toLowerCase());
  }

  const upcomingAppointments = filterAppointmentsByStatus('scheduled');
  const ongoingAppointments = filterAppointmentsByStatus('ongoing');
  const completedAppointments = filterAppointmentsByStatus('completed');
  const exportedAppointments = filterAppointmentsByStatus('exported');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'all' ? "default" : "outline"} 
            onClick={() => setViewMode('all')}
            className={viewMode === 'all' ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
          >
            All Appointments
          </Button>
          <Button 
            variant={viewMode === 'case-management' ? "default" : "outline"} 
            onClick={() => setViewMode('case-management')}
            className={viewMode === 'case-management' ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
          >
            Case Management
          </Button>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {viewMode === 'all' ? (
        <Card className="bg-gradient-to-br from-blue-950 to-indigo-950 border-blue-800/30">
          <CardHeader className="border-b border-blue-800/30">
            <CardTitle className="text-2xl font-bold text-blue-50">All Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
                <Input
                  placeholder="Search appointments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 bg-blue-900/20 border-blue-700/30 text-blue-50 placeholder:text-blue-400/50"
                />
                <Button type="submit" variant="outline" size="icon">
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </form>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-full sm:w-auto",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date || undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Refresh Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => fetchAppointments(page, pageSize, search, date ? format(date, "yyyy-MM-dd") : "")}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* Clear Filters */}
                <Button 
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="hidden sm:block"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            
            {/* Mobile Clear Filters Button */}
            <div className="sm:hidden mb-4">
              <Button 
                variant="secondary"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
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
                    <TableHead className="text-blue-200 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id} className="border-blue-800/30 hover:bg-blue-900/20">
                        <TableCell className="text-blue-100">{appointment.date}</TableCell>
                        <TableCell className="text-blue-100">{appointment.time}</TableCell>
                        <TableCell className="text-blue-100">
                          {appointment.patients ? appointment.patients.name : 'Unknown Patient'}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          {appointment.users ? appointment.users.name : 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-blue-100">
                          <Badge variant="outline" className="capitalize">
                            {appointment.type?.replace('_', ' ') || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-100">
                          <Badge className={`${getStatusColor(appointment.status)} text-white capitalize`}>
                            {appointment.status?.replace('_', ' ') || 'Scheduled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-100 text-right">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-blue-600/80 hover:bg-blue-600 text-white"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-blue-200">
                        No appointments found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-6 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0 || isLoading}
                >
                  Previous
                </Button>
                <span className="mx-4">
                  Page {page + 1} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  Next
                </Button>
              </Pagination>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-950 text-white">
            <CardTitle className="text-2xl font-bold">Case Management</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Date Navigation */}
            <div className="flex justify-between items-center mb-6">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  if (date) {
                    const prevDay = new Date(date);
                    prevDay.setDate(prevDay.getDate() - 1);
                    handleDateSelect(prevDay);
                  }
                }}>
                  Previous Day
                </Button>
                <Button variant="outline" onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  handleDateSelect(today);
                }}>
                  Today
                </Button>
                <Button variant="outline" onClick={() => {
                  if (date) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    handleDateSelect(nextDay);
                  }
                }}>
                  Next Day
                </Button>
              </div>
            </div>
            
            {/* Case Management Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="exported">Exported</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingAppointments.length > 0 ? (
                        upcomingAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              {appointment.patients ? appointment.patients.name : 'Unknown Patient'}
                            </TableCell>
                            <TableCell>
                              {appointment.users ? appointment.users.name : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {appointment.type?.replace('_', ' ') || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                asChild
                              >
                                <Link href={`/app/dashboard/current-case?id=${appointment.id}`}>
                                  <PlusCircle className="h-4 w-4 mr-1" />
                                  Create Case
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No upcoming appointments for this date.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="ongoing">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ongoingAppointments.length > 0 ? (
                        ongoingAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              {appointment.patients ? appointment.patients.name : 'Unknown Patient'}
                            </TableCell>
                            <TableCell>
                              {appointment.users ? appointment.users.name : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {appointment.type?.replace('_', ' ') || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                asChild
                              >
                                <Link href={`/app/dashboard/current-case?id=${appointment.id}`}>
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Resume Case
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No ongoing cases for this date.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedAppointments.length > 0 ? (
                        completedAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              {appointment.patients ? appointment.patients.name : 'Unknown Patient'}
                            </TableCell>
                            <TableCell>
                              {appointment.users ? appointment.users.name : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {appointment.type?.replace('_', ' ') || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                asChild
                              >
                                <Link href={`/app/dashboard/current-case?id=${appointment.id}`}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  View Case
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No completed cases for this date.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="exported">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exportedAppointments.length > 0 ? (
                        exportedAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              {appointment.patients ? appointment.patients.name : 'Unknown Patient'}
                            </TableCell>
                            <TableCell>
                              {appointment.users ? appointment.users.name : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {appointment.type?.replace('_', ' ') || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700"
                                asChild
                              >
                                <Link href={`/app/dashboard/current-case?id=${appointment.id}`}>
                                  View Records
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No exported cases for this date.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}