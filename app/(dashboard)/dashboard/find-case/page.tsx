"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Loader2,
  ChevronDown,
  FileText,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

// Case type definitions
type CaseStatus = "draft" | "in_progress" | "completed";
type CaseType = "checkup" | "emergency" | "surgery" | "follow_up";

interface Case {
  id: number;
  name: string;
  dateTime: string | Date;
  type: CaseType;
  status: CaseStatus;
  assignedToId?: string;
  assignedToName?: string;
  patientId?: number;
  patientName?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface FilterState {
  search: string;
  status: CaseStatus[];
  type: CaseType[];
  assignedToId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

// Status badge component with color coding
function StatusBadge({ status }: { status: CaseStatus }) {
  const statusMap = {
    draft: { color: "bg-gray-200 text-gray-700", label: "Draft" },
    in_progress: { color: "bg-blue-200 text-blue-700", label: "In Progress" },
    completed: { color: "bg-green-200 text-green-700", label: "Completed" },
  };

  const { color, label } = statusMap[status] || {
    color: "bg-gray-200 text-gray-700",
    label: status,
  };

  return <Badge className={`${color} hover:${color}`}>{label}</Badge>;
}

// Type badge component with color coding
function TypeBadge({ type }: { type: CaseType }) {
  const typeMap = {
    checkup: { color: "bg-green-100 text-green-700", label: "Checkup" },
    emergency: { color: "bg-red-100 text-red-700", label: "Emergency" },
    surgery: { color: "bg-purple-100 text-purple-700", label: "Surgery" },
    follow_up: { color: "bg-blue-100 text-blue-700", label: "Follow-up" },
  };

  const { color, label } = typeMap[type] || {
    color: "bg-gray-100 text-gray-700",
    label: type,
  };

  return (
    <Badge variant="outline" className={`${color} hover:${color}`}>
      {label}
    </Badge>
  );
}

export default function FindCase() {
  const router = useRouter();

  // State for cases and loading
  const [cases, setCases] = useState<Case[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    type: [],
    assignedToId: "",
    dateFrom: null,
    dateTo: null,
    sortBy: "dateTime",
    sortOrder: "desc",
    page: 1,
    pageSize: 10,
  });

  // Form state for search and filter UI
  const [searchInput, setSearchInput] = useState("");
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    draft: false,
    in_progress: false,
    completed: false,
  });
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    checkup: false,
    emergency: false,
    surgery: false,
    follow_up: false,
  });
  const [dateFromValue, setDateFromValue] = useState<Date | null>(null);
  const [dateToValue, setDateToValue] = useState<Date | null>(null);
  const [sortValue, setSortValue] = useState("dateDesc");
  const [pageSizeValue, setPageSizeValue] = useState("10");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load cases from API
  const fetchCases = async () => {
    setIsLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      filters.status.forEach((status) => params.append("status", status));
      filters.type.forEach((type) => params.append("type", type));
      if (filters.assignedToId)
        params.append("assignedToId", filters.assignedToId);
      if (filters.dateFrom)
        params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
      params.append("page", filters.page.toString());
      params.append("pageSize", filters.pageSize.toString());

      // Special handling for tabs
      if (activeTab === "my") {
        // For "My Cases" tab - filter by current user
        params.append("assignedToId", "currentUser");
      } else if (activeTab === "draft") {
        // For "Draft" tab - show only draft status
        params.delete("status"); // Clear any existing status filters
        params.append("status", "draft");
      } else if (activeTab === "recent") {
        // For "Recent" tab - show recently modified cases
        params.delete("sortBy");
        params.delete("sortOrder");
        params.append("sortBy", "updatedAt");
        params.append("sortOrder", "desc");
        params.append("limit", "10");
      }

      const response = await fetch(`/api/cases?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch cases");
      }

      const data = await response.json();
      setCases(data.data || []);
      setMeta(
        data.meta || {
          total: data.data?.length || 0,
          page: filters.page,
          pageSize: filters.pageSize,
          pageCount: Math.ceil((data.data?.length || 0) / filters.pageSize),
        }
      );
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast.error("Failed to load cases. Please try again.");

      // No placeholder data, show empty state
      setCases([]);
      setMeta({
        total: 0,
        page: 1,
        pageSize: 10,
        pageCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and fetch cases
  const applyFilters = () => {
    // Convert checkbox state to arrays
    const statusArray = Object.entries(statusFilters)
      .filter(([_, isChecked]) => isChecked)
      .map(([status]) => status) as CaseStatus[];

    const typeArray = Object.entries(typeFilters)
      .filter(([_, isChecked]) => isChecked)
      .map(([type]) => type) as CaseType[];

    // Parse sort value
    let sortBy = "dateTime";
    let sortOrder = "desc" as "asc" | "desc";

    if (sortValue === "dateAsc") {
      sortBy = "dateTime";
      sortOrder = "asc";
    } else if (sortValue === "nameAsc") {
      sortBy = "name";
      sortOrder = "asc";
    } else if (sortValue === "nameDesc") {
      sortBy = "name";
      sortOrder = "desc";
    }

    // Update filters
    setFilters({
      ...filters,
      search: searchInput,
      status: statusArray,
      type: typeArray,
      dateFrom: dateFromValue,
      dateTo: dateToValue,
      sortBy,
      sortOrder,
      pageSize: parseInt(pageSizeValue),
      page: 1, // Reset to first page when filters change
    });

    setIsFilterOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setStatusFilters({
      draft: false,
      in_progress: false,
      completed: false,
    });
    setTypeFilters({
      checkup: false,
      emergency: false,
      surgery: false,
      follow_up: false,
    });
    setDateFromValue(null);
    setDateToValue(null);
    setSortValue("dateDesc");
    setPageSizeValue("10");

    setFilters({
      search: "",
      status: [],
      type: [],
      assignedToId: "",
      dateFrom: null,
      dateTo: null,
      sortBy: "dateTime",
      sortOrder: "desc",
      page: 1,
      pageSize: 10,
    });
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > meta.pageCount) return;
    setFilters({ ...filters, page });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Reset filters when changing tabs
    clearFilters();
  };

  // Run search when filters change
  useEffect(() => {
    fetchCases();
  }, [filters, activeTab]);

  // Empty array for when API fetch fails
  const placeholderCases: Case[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Find Case</h1>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button>New Case</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Cases</TabsTrigger>
            <TabsTrigger value="my">My Cases</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by case or patient name..."
                    className="pl-8"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyFilters();
                      }
                    }}
                  />
                </div>

                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {(filters.status.length > 0 ||
                          filters.type.length > 0 ||
                          filters.dateFrom ||
                          filters.dateTo) && (
                          <Badge variant="secondary" className="ml-1">
                            Active
                          </Badge>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Case Status</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {(["draft", "in_progress", "completed"] as const).map(
                            (status) => (
                              <div
                                key={status}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`status-${status}`}
                                  checked={statusFilters[status]}
                                  onCheckedChange={(checked) =>
                                    setStatusFilters({
                                      ...statusFilters,
                                      [status]: !!checked,
                                    })
                                  }
                                />
                                <label
                                  htmlFor={`status-${status}`}
                                  className="text-sm font-medium capitalize"
                                >
                                  {status.replace("_", " ")}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Case Type</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {(
                            [
                              "checkup",
                              "emergency",
                              "surgery",
                              "follow_up",
                            ] as const
                          ).map((type) => (
                            <div
                              key={type}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`type-${type}`}
                                checked={typeFilters[type]}
                                onCheckedChange={(checked) =>
                                  setTypeFilters({
                                    ...typeFilters,
                                    [type]: !!checked,
                                  })
                                }
                              />
                              <label
                                htmlFor={`type-${type}`}
                                className="text-sm font-medium capitalize"
                              >
                                {type.replace("_", " ")}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Date Range</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="w-full space-y-1">
                            <p className="text-xs text-gray-500">From</p>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  <span>
                                    {dateFromValue
                                      ? format(dateFromValue, "PP")
                                      : "Pick date"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateFromValue || undefined}
                                  onSelect={(date: Date | undefined) =>
                                    setDateFromValue(date || null)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="w-full space-y-1">
                            <p className="text-xs text-gray-500">To</p>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  <span>
                                    {dateToValue
                                      ? format(dateToValue, "PP")
                                      : "Pick date"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={dateToValue || undefined}
                                  onSelect={(date: Date | undefined) =>
                                    setDateToValue(date || null)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                      <Button size="sm" onClick={applyFilters}>
                        Apply Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <Select value={sortValue} onValueChange={setSortValue}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dateDesc">Newest first</SelectItem>
                      <SelectItem value="dateAsc">Oldest first</SelectItem>
                      <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                      <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={pageSizeValue}
                    onValueChange={setPageSizeValue}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="10 per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Case Name</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                            <span className="ml-2">Loading cases...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : cases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64">
                          <EmptyState
                            title="No cases found"
                            description="Try adjusting your search criteria or create a new case to get started."
                            icons={[FileText, ClipboardList, UserRound]}
                            action={{
                              label: "Create New Case",
                              onClick: () => router.push("/app/dashboard/case/new"),
                            }}
                            className="mx-auto"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      cases.map((caseItem) => (
                        <TableRow
                          key={caseItem.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/app/dashboard/case/${caseItem.id}`)
                          }
                        >
                          <TableCell>{caseItem.id}</TableCell>
                          <TableCell>{caseItem.name}</TableCell>
                          <TableCell>
                            {caseItem.patientName || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={caseItem.type} />
                          </TableCell>
                          <TableCell>
                            {caseItem.dateTime instanceof Date
                              ? format(caseItem.dateTime, "MMM d, yyyy")
                              : format(
                                  new Date(caseItem.dateTime),
                                  "MMM d, yyyy"
                                )}
                          </TableCell>
                          <TableCell>
                            {caseItem.assignedToName || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={caseItem.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-medium">
                        {meta.total === 0
                          ? 0
                          : (meta.page - 1) * meta.pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(meta.page * meta.pageSize, meta.total)}
                      </span>{" "}
                      of <span className="font-medium">{meta.total}</span>{" "}
                      results
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1 || isLoading}
                    onClick={() => goToPage(meta.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.pageCount || isLoading}
                    onClick={() => goToPage(meta.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  <span className="ml-2">Loading your cases...</span>
                </div>
              ) : cases.length === 0 ? (
                <div className="flex justify-center py-8">
                  <EmptyState
                    title="No assigned cases"
                    description="You don't have any cases assigned to you yet."
                    icons={[UserRound]}
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Name</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow
                          key={caseItem.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/app/dashboard/case/${caseItem.id}`)
                          }
                        >
                          <TableCell>{caseItem.name}</TableCell>
                          <TableCell>
                            {caseItem.patientName || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={caseItem.type} />
                          </TableCell>
                          <TableCell>
                            {caseItem.dateTime instanceof Date
                              ? format(caseItem.dateTime, "MMM d, yyyy")
                              : format(
                                  new Date(caseItem.dateTime),
                                  "MMM d, yyyy"
                                )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={caseItem.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  <span className="ml-2">Loading recent cases...</span>
                </div>
              ) : cases.length === 0 ? (
                <div className="flex justify-center py-8">
                  <EmptyState
                    title="No recent cases"
                    description="Cases you've recently viewed will appear here."
                    icons={[ClipboardList]}
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Name</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow
                          key={caseItem.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/app/dashboard/case/${caseItem.id}`)
                          }
                        >
                          <TableCell>{caseItem.name}</TableCell>
                          <TableCell>
                            {caseItem.patientName || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={caseItem.type} />
                          </TableCell>
                          <TableCell>
                            {caseItem.updatedAt
                              ? caseItem.updatedAt instanceof Date
                                ? format(caseItem.updatedAt, "MMM d, yyyy")
                                : format(
                                    new Date(caseItem.updatedAt),
                                    "MMM d, yyyy"
                                  )
                              : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={caseItem.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  <span className="ml-2">Loading draft cases...</span>
                </div>
              ) : cases.length === 0 ? (
                <div className="flex justify-center py-8">
                  <EmptyState
                    title="No draft cases"
                    description="Draft cases you're working on will appear here."
                    icons={[FileText]}
                    action={{
                      label: "Create New Case",
                      onClick: () => router.push("/dashboard/case/new"),
                    }}
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Name</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow
                          key={caseItem.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/app/dashboard/case/${caseItem.id}`)
                          }
                        >
                          <TableCell>{caseItem.name}</TableCell>
                          <TableCell>
                            {caseItem.patientName || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={caseItem.type} />
                          </TableCell>
                          <TableCell>
                            {caseItem.createdAt instanceof Date
                              ? format(caseItem.createdAt, "MMM d, yyyy")
                              : caseItem.createdAt
                                ? format(
                                    new Date(caseItem.createdAt),
                                    "MMM d, yyyy"
                                  )
                                : "Unknown"}
                          </TableCell>
                          <TableCell>
                            {caseItem.assignedToName || "Unassigned"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
