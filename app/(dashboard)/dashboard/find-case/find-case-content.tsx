"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  fetchCases,
  Case,
  CaseStatus,
  CaseType,
  PaginationMeta,
} from "@/app/actions";

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

export function FindCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Replace nuqs with standard URL params management
  const getParam = useCallback(
    (key: string, defaultValue: string) => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  const getNumParam = useCallback(
    (key: string, defaultValue: number) => {
      const value = searchParams.get(key);
      return value ? parseInt(value) : defaultValue;
    },
    [searchParams]
  );

  // Local state for URL parameters
  const [tab, setTab] = useState(getParam("tab", "all"));
  const [search, setSearch] = useState(getParam("search", ""));
  const [page, setPage] = useState(getNumParam("page", 1));
  const [pageSize, setPageSize] = useState(getNumParam("pageSize", 10));
  const [sortBy, setSortBy] = useState(getParam("sortBy", "dateTime"));
  const [sortOrder, setSortOrder] = useState(getParam("sortOrder", "desc"));

  // Function to update URL with current state
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (tab !== "all") params.set("tab", tab);
    if (search) params.set("search", search);
    if (page !== 1) params.set("page", page.toString());
    if (pageSize !== 10) params.set("pageSize", pageSize.toString());
    if (sortBy !== "dateTime") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const queryString = params.toString();
    const url = `/dashboard/find-case${queryString ? `?${queryString}` : ""}`;

    router.push(url, { scroll: false });
  }, [tab, search, page, pageSize, sortBy, sortOrder, router]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [tab, search, page, pageSize, sortBy, sortOrder, updateUrl]);

  // Local state
  const [cases, setCases] = useState<Case[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Form state for search and filter UI
  const [searchInput, setSearchInput] = useState(search);
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
  const [pageSizeValue, setPageSizeValue] = useState(pageSize.toString());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load cases from API
  const loadCases = async () => {
    setIsLoading(true);

    try {
      // Convert status filters to array
      const statusArray = Object.entries(statusFilters)
        .filter(([_, isChecked]) => isChecked)
        .map(([status]) => status) as CaseStatus[];

      // Convert type filters to array
      const typeArray = Object.entries(typeFilters)
        .filter(([_, isChecked]) => isChecked)
        .map(([type]) => type) as CaseType[];

      // Fetch cases with current filters
      const result = await fetchCases({
        search: search,
        status: statusArray.length > 0 ? statusArray : undefined,
        type: typeArray.length > 0 ? typeArray : undefined,
        dateFrom: dateFromValue ? dateFromValue.toISOString() : undefined,
        dateTo: dateToValue ? dateToValue.toISOString() : undefined,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
        page,
        pageSize,
        tab: tab,
      });

      setCases(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Error loading cases:", error);
      toast.error("Failed to load cases. Please try again.");
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

  // Apply filters and update URL
  const applyFilters = () => {
    // Update search param
    setSearch(searchInput);

    // Convert checkbox state to arrays
    const statusArray = Object.entries(statusFilters)
      .filter(([_, isChecked]) => isChecked)
      .map(([status]) => status) as CaseStatus[];

    const typeArray = Object.entries(typeFilters)
      .filter(([_, isChecked]) => isChecked)
      .map(([type]) => type) as CaseType[];

    // Parse sort value
    let newSortBy = "dateTime";
    let newSortOrder = "desc" as "asc" | "desc";

    if (sortValue === "dateAsc") {
      newSortBy = "dateTime";
      newSortOrder = "asc";
    } else if (sortValue === "nameAsc") {
      newSortBy = "name";
      newSortOrder = "asc";
    } else if (sortValue === "nameDesc") {
      newSortBy = "name";
      newSortOrder = "desc";
    }

    // Update URL state
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPageSize(parseInt(pageSizeValue));
    setPage(1); // Reset to first page when filters change

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

    // Reset URL params
    setSearch("");
    setSortBy("dateTime");
    setSortOrder("desc");
    setPageSize(10);
    setPage(1);
  };

  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > meta.pageCount) return;
    setPage(newPage);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setTab(value);
    clearFilters();
  };

  // Initialize form values from URL params
  useEffect(() => {
    setSearchInput(search);

    // Set sort value based on sortBy and sortOrder
    if (sortBy === "name" && sortOrder === "asc") {
      setSortValue("nameAsc");
    } else if (sortBy === "name" && sortOrder === "desc") {
      setSortValue("nameDesc");
    } else if (sortBy === "dateTime" && sortOrder === "asc") {
      setSortValue("dateAsc");
    } else {
      setSortValue("dateDesc");
    }

    setPageSizeValue(pageSize.toString());
  }, [search, sortBy, sortOrder, pageSize]);

  // Load cases when URL params change
  useEffect(() => {
    loadCases();
  }, [tab, search, page, pageSize, sortBy, sortOrder, searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Find Case</h1>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button onClick={() => router.push("/dashboard/case/new")}>
            New Case
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
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
                        {(Object.values(statusFilters).some(Boolean) ||
                          Object.values(typeFilters).some(Boolean) ||
                          dateFromValue ||
                          dateToValue) && (
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
                              onClick: () => router.push("/dashboard/case/new"),
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
                            router.push(`/dashboard/case/${caseItem.id}`)
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
                            {format(new Date(caseItem.dateTime), "MMM d, yyyy")}
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
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, meta.pageCount) },
                      (_, i) => {
                        // Show pages around current page
                        let pageNum = page;
                        if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= meta.pageCount - 2) {
                          pageNum = meta.pageCount - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        // Ensure page number is valid
                        if (pageNum <= 0 || pageNum > meta.pageCount)
                          return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-9"
                            onClick={() => goToPage(pageNum)}
                            disabled={isLoading}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= meta.pageCount || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents */}
        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Similar content structure as "all" tab */}
              <div className="h-64 flex justify-center items-center text-muted-foreground">
                Select the "My Cases" tab to view cases assigned to you
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Similar content structure as "all" tab */}
              <div className="h-64 flex justify-center items-center text-muted-foreground">
                Select the "Recent" tab to view recently updated cases
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Similar content structure as "all" tab */}
              <div className="h-64 flex justify-center items-center text-muted-foreground">
                Select the "Drafts" tab to view draft cases
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
