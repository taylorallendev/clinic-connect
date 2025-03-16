"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Upload,
  Plus,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUpcomingAppointments } from "./actions";

// Add User interface
interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

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
  icon: string;
}

interface Appointment {
  id: string;
  patient: string;
  owner: string;
  date: string;
  time: string;
  type: string;
}

interface ModernDashboardContentProps {
  cases: Case[];
  stats: Stat[];
  appointments: Appointment[];
  user: User | null;
}

export function ModernDashboardContent({
  cases: initialCases,
  stats,
  appointments: initialAppointments,
  user,
}: ModernDashboardContentProps) {
  const [isWelcomeSectionExpanded, setIsWelcomeSectionExpanded] =
    useState(true);
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Use the server-provided cases as initial state
  const [cases, setCases] = useState(
    initialCases.map((caseItem) => ({
      ...caseItem,
      // Add time if it doesn't exist
      time: caseItem.time || "10:00 AM",
    }))
  );

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Doctor";

    // Try to get the name from user metadata in this order:
    // 1. first_name (if available)
    // 2. full_name (if available)
    // 3. Email (fallback)
    const firstName = user.user_metadata?.first_name;
    const fullName = user.user_metadata?.full_name;

    if (firstName) return `Dr. ${firstName}`;
    if (fullName) return `Dr. ${fullName.split(" ")[0]}`;

    // If no name is available, use the email (without domain)
    return `Dr. ${user.email.split("@")[0]}`;
  };

  // Fetch upcoming appointments
  const fetchAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      const appointmentsData = await getUpcomingAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter cases by status
  const scheduledCases = cases.filter(
    (caseItem) =>
      caseItem.status === "Scheduled" || caseItem.status === "scheduled"
  );
  const ongoingCases = cases.filter(
    (caseItem) =>
      caseItem.status === "Ongoing" ||
      caseItem.status === "ongoing" ||
      caseItem.status === "in_progress"
  );
  const completedCases = cases.filter(
    (caseItem) =>
      caseItem.status === "Completed" || caseItem.status === "completed"
  );
  const reviewedCases = cases.filter(
    (caseItem) =>
      caseItem.status === "Reviewed" || caseItem.status === "reviewed"
  );
  const exportedCases = cases.filter(
    (caseItem) =>
      caseItem.status === "Exported" || caseItem.status === "exported"
  );

  // Function to create a new case
  const handleCreateCase = (caseId: string) => {
    // Navigate to current case page with the case ID
    window.location.href = `/app/dashboard/current-case?id=${caseId}`;

    // Update the case status to "Ongoing" in the UI
    const updatedCases = cases.map((caseItem) =>
      caseItem.id === caseId ? { ...caseItem, status: "Ongoing" } : caseItem
    );
    setCases(updatedCases);
  };

  // Function to resume a case
  const handleResumeCase = (caseId: string) => {
    // Navigate to current case page with the case ID
    window.location.href = `/app/dashboard/current-case?id=${caseId}`;
  };

  // Function to create a new appointment
  const handleCreateAppointment = () => {
    // Navigate to current case page to create a new appointment/case
    window.location.href = "/app/dashboard/current-case";
  };

  // Function to render the appropriate icon
  const renderIcon = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      FileText: <FileText className="h-5 w-5 text-blue-200" />,
      Clock: <Clock className="h-5 w-5 text-blue-200" />,
      CheckCircle2: <CheckCircle2 className="h-5 w-5 text-blue-200" />,
      ClipboardCheck: <ClipboardCheck className="h-5 w-5 text-blue-200" />,
      Upload: <Upload className="h-5 w-5 text-blue-200" />,
      Calendar: <Calendar className="h-5 w-5 text-blue-200" />,
    };

    return iconMap[iconName] || <FileText className="h-5 w-5 text-blue-200" />;
  };

  return (
    <div className="flex flex-col space-y-6 bg-gradient-to-br from-blue-950 to-indigo-950 min-h-screen">
      <div className="flex justify-between items-center text-blue-100 px-6 py-4">
        <h1 className="text-2xl font-semibold">Veterinary Dashboard</h1>
        <div className="flex items-center">
          <Button variant="ghost" className="text-blue-100 hover:bg-white/10">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>
                {user?.user_metadata?.first_name?.[0] ||
                  user?.email?.[0] ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 pb-6">
        {/* Collapsible Welcome Section */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <div
            className="flex justify-between items-center px-6 py-4 cursor-pointer"
            onClick={() =>
              setIsWelcomeSectionExpanded(!isWelcomeSectionExpanded)
            }
          >
            <h2 className="text-2xl font-semibold text-blue-50">
              Hey, {getUserDisplayName()}! Glad to have you back 👋
            </h2>
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-100 mr-2" />
              {isWelcomeSectionExpanded ? (
                <ChevronUp className="h-6 w-6 text-blue-100" />
              ) : (
                <ChevronDown className="h-6 w-6 text-blue-100" />
              )}
            </div>
          </div>

          {isWelcomeSectionExpanded && (
            <CardContent className="px-6 pb-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="bg-blue-900/30 backdrop-blur-sm border-blue-800/20 rounded-xl p-4 shadow-md shadow-blue-950/20"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-700/30 p-2 mr-2">
                          {renderIcon(stat.icon)}
                        </div>
                        <span className="text-xs text-blue-300/90">
                          {stat.title}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-blue-50">
                            {stat.value}
                          </span>
                          <Badge
                            className={`ml-2 ${
                              stat.change.includes("+")
                                ? "bg-green-800/40 text-green-300"
                                : "bg-red-800/40 text-red-300"
                            } border-0`}
                          >
                            {stat.change.split(" ")[0]}
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-300/90 mt-1">
                          {stat.change.split("from")[1]
                            ? `from${stat.change.split("from")[1]}`
                            : ""}
                        </p>
                      </div>
                      <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              parseInt(stat.value) / 2,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Appointments Table with Tabs */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-blue-50">
                  Appointments
                </h3>
                <TabsList className="bg-blue-900/30">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming" className="mt-0">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={handleCreateAppointment}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    New Appointment
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No upcoming appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduledCases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {caseItem.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {caseItem.time}
                            </div>
                          </TableCell>
                          <TableCell>{caseItem.patient}</TableCell>
                          <TableCell>{caseItem.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">
                              Scheduled
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleCreateCase(caseItem.id)}
                              size="sm"
                              variant="outline"
                            >
                              Create Case
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="ongoing" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ongoingCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No ongoing appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ongoingCases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {caseItem.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {caseItem.time}
                            </div>
                          </TableCell>
                          <TableCell>{caseItem.patient}</TableCell>
                          <TableCell>{caseItem.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Ongoing
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleResumeCase(caseItem.id)}
                              size="sm"
                              variant="outline"
                            >
                              Resume Case
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="recent" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No recent appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      appointments.slice(0, 5).map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {appointment.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {appointment.time}
                            </div>
                          </TableCell>
                          <TableCell>{appointment.patient}</TableCell>
                          <TableCell>{appointment.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-800">
                              Recent
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                (window.location.href = `/app/dashboard/current-case?id=${appointment.id}`)
                              }
                              size="sm"
                              variant="outline"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Case Status Table with Tabs */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <Tabs defaultValue="completed" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-blue-50">
                  Today's Cases
                </h3>
                <TabsList className="bg-blue-900/30">
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                  <TabsTrigger value="exported">Exported</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="completed" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No completed cases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedCases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {caseItem.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {caseItem.time}
                            </div>
                          </TableCell>
                          <TableCell>{caseItem.patient}</TableCell>
                          <TableCell>{caseItem.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                (window.location.href = `/app/dashboard/current-case?id=${caseItem.id}`)
                              }
                              size="sm"
                              variant="outline"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="reviewed" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewedCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No reviewed cases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviewedCases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {caseItem.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {caseItem.time}
                            </div>
                          </TableCell>
                          <TableCell>{caseItem.patient}</TableCell>
                          <TableCell>{caseItem.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">
                              Reviewed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                (window.location.href = `/app/dashboard/current-case?id=${caseItem.id}`)
                              }
                              size="sm"
                              variant="outline"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="exported" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportedCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-blue-300/90 py-8"
                        >
                          No exported cases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      exportedCases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <div className="font-medium text-blue-50">
                              {caseItem.date}
                            </div>
                            <div className="text-sm text-blue-300/90">
                              {caseItem.time}
                            </div>
                          </TableCell>
                          <TableCell>{caseItem.patient}</TableCell>
                          <TableCell>{caseItem.type}</TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-800">
                              Exported
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                (window.location.href = `/app/dashboard/current-case?id=${caseItem.id}`)
                              }
                              size="sm"
                              variant="outline"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
