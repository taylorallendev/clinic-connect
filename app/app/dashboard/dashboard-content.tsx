"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarIcon,
  ChevronDown,
  Clock,
  FileText,
  Search,
  MoreHorizontal,
  Calendar,
  Heart,
  CheckCircle2,
  ClipboardCheck,
  Upload,
} from "lucide-react";
import { DropResult } from "react-beautiful-dnd";
import { getUpcomingAppointments } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

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

interface DashboardContentProps {
  cases: Case[];
  stats: Stat[];
  appointments: Appointment[];
  user: User | null; // Add user prop
}

export function DashboardContent({
  cases: initialCases,
  stats,
  appointments: initialAppointments,
  user, // Destructure user from props
}: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState("overview"); // "overview" or "management"
  const [activeTab, setActiveTab] = useState("patients");
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

  // Weekly calendar data
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Get dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(currentDay - currentDate.getDay() + i + 1);
    return date.getDate();
  });

  // Treatment plans data based on case types
  const treatmentPlans: {
    title: string;
    value: number;
    duration: string;
    icon: string;
  }[] = [
    {
      title: "Surgical procedures",
      value: Math.round((completedCases.length / (cases.length || 1)) * 100),
      duration: `${completedCases.length} cases`,
      icon: "FileText",
    },
    {
      title: "Follow-up appointments",
      value: Math.round((reviewedCases.length / (cases.length || 1)) * 100),
      duration: `${reviewedCases.length} cases`,
      icon: "Calendar",
    },
  ];

  // Veterinary team data
  const team: {
    name: string;
    role: string;
    avatar: string;
    isActive: boolean;
  }[] = [
    {
      name: "Dr. Sarah Reynolds",
      role: "Family Veterinarian",
      avatar: "/placeholder-user.jpg",
      isActive: true,
    },
    {
      name: "Dr. Michael Chen",
      role: "Veterinary Surgeon",
      avatar: "/placeholder.svg?height=40&width=40",
      isActive: false,
    },
    {
      name: "Dr. Emily Wilson",
      role: "Animal Behaviorist",
      avatar: "/placeholder.svg?height=40&width=40",
      isActive: false,
    },
    {
      name: "Dr. James Taylor",
      role: "Exotic Pet Specialist",
      avatar: "/placeholder.svg?height=40&width=40",
      isActive: false,
    },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-6">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome card */}
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-blue-50">
                    Hey, {getUserDisplayName()}! Glad to have you back 👋
                  </h2>
                </div>
                <Heart className="h-8 w-8 text-blue-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {stats.slice(0, 3).map((stat, index) => (
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
                            className={`ml-2 ${stat.change.includes("+") ? "bg-green-800/40 text-green-300" : "bg-red-800/40 text-red-300"} border-0`}
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
                            width: `${Math.min(parseInt(stat.value) / 2, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Case Status Chart */}
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-50">
                    Case Status
                  </h3>
                  <p className="text-sm text-blue-300/90">
                    Based on medical records and recent visits
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="text-blue-100 hover:bg-white/10 text-xs h-8 px-3 rounded-full"
                  >
                    Week
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-blue-100 hover:bg-white/10 text-xs h-8 px-3 rounded-full"
                  >
                    Month
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-blue-100 hover:bg-white/10 text-xs h-8 px-3 rounded-full"
                  >
                    Year
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex items-end h-48 gap-4">
                {/* Create a bar chart using case status data */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full bg-blue-700/40 rounded-lg"
                      style={{
                        height: `${(ongoingCases.length / (cases.length || 1)) * 100}%`,
                      }}
                    />
                    <span className="text-xs text-blue-300/90 mt-2">
                      Ongoing
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full bg-blue-500/60 rounded-lg"
                      style={{
                        height: `${(completedCases.length / (cases.length || 1)) * 100}%`,
                      }}
                    />
                    <span className="text-xs text-blue-300/90 mt-2">
                      Completed
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full bg-green-500/60 rounded-lg"
                      style={{
                        height: `${(reviewedCases.length / (cases.length || 1)) * 100}%`,
                      }}
                    />
                    <span className="text-xs text-blue-300/90 mt-2">
                      Reviewed
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full bg-purple-500/60 rounded-lg"
                      style={{
                        height: `${(exportedCases.length / (cases.length || 1)) * 100}%`,
                      }}
                    />
                    <span className="text-xs text-blue-300/90 mt-2">
                      Exported
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Plans */}
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-50">
                  Treatment Plans
                </h3>
                <p className="text-sm text-blue-300/90">
                  Personalized care plans for ongoing patients
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {treatmentPlans.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-700/30">
                          {item.icon === "FileText" ? (
                            <FileText className="h-4 w-4 text-blue-100" />
                          ) : (
                            <Calendar className="h-4 w-4 text-blue-100" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-blue-50">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-300/90">
                          {item.duration}
                        </span>
                        <span className="text-xs font-medium text-blue-50">
                          {item.value}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={item.value}
                      className="h-2 bg-blue-800/30"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar content - 1/3 width */}
        <div className="space-y-6">
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-50">
                  Weekly Calendar
                </h3>
                <Button
                  variant="ghost"
                  className="text-blue-100 hover:bg-white/10 h-8 px-3 rounded-full"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span className="text-xs">View Calendar</span>
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mt-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs text-blue-300/90 mb-2">{day}</span>
                    <Button
                      variant="ghost"
                      className={`w-8 h-8 p-0 rounded-full ${index === new Date().getDay() - 1 ? "bg-blue-500 text-white" : "text-blue-100 hover:bg-white/10"}`}
                    >
                      {weekDates[index]}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {appointments.slice(0, 4).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between bg-blue-800/30 rounded-xl p-3 border border-blue-700/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src="/placeholder.svg?height=40&width=40"
                          alt={appointment.patient}
                        />
                        <AvatarFallback>
                          {appointment.patient.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-medium text-blue-50">
                          {appointment.patient}
                        </h4>
                        <p className="text-xs text-blue-300/90">
                          {appointment.owner}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-50">
                        {appointment.time}
                      </p>
                      <p className="text-xs text-blue-300/90">
                        {appointment.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-50">
                  Veterinary Team
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-100 hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 mt-4">
                {team.map((doctor, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl ${doctor.isActive ? "bg-blue-700/50 border border-blue-600/30" : "bg-blue-800/30 border border-blue-800/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={doctor.avatar} alt={doctor.name} />
                          <AvatarFallback>
                            {doctor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {doctor.isActive && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-blue-900"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-50">
                          {doctor.name}
                        </h4>
                        <p className="text-xs text-blue-300/90">
                          {doctor.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-100 hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* <Card className="bg-gradient-to-br from-blue-700 to-blue-900 border-blue-600/20 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-50">
                  Emergency Support
                </h3>
                <p className="text-sm text-blue-200 mt-1">
                  Quick access to urgent care resources for pets in distress
                </p>
              </div>

              <div className="mt-12 flex justify-center">
                <img
                  src="/placeholder.svg?height=80&width=120"
                  alt="Support"
                  className="h-20 w-auto"
                />
              </div>

              <Button className="w-full mt-6 bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-900/30">
                Get help now
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
