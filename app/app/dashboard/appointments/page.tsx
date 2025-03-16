"use client";

import { useState, useEffect } from "react";
import { AppointmentsTable } from "./appointments-table";
import { AppointmentSidebar } from "./appointment-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Search, Calendar } from "lucide-react";
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
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
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
            searchQuery,
            dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
            timestamp: Date.now(), // Add timestamp to bust cache
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();
        setAppointments(data.appointments || []);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [page, searchQuery, dateFilter]);

  // Handle appointment selection
  const handleSelectAppointment = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    setSelectedAppointment(null);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page when searching
  };

  // Handle date filter change
  const handleDateChange = (date: Date | null) => {
    setDateFilter(date);
    setPage(0); // Reset to first page when changing date filter
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search appointments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500 dark:text-gray-400" />
          <DatePickerDemo
            selected={dateFilter}
            onSelect={handleDateChange}
            placeholder="Filter by date"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(null)}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : appointments.length > 0 ? (
        <>
          <AppointmentsTable
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(newPage) => setPage(newPage - 1)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            No appointments found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
            {searchQuery || dateFilter
              ? "Try adjusting your search or date filter"
              : "Create your first appointment to get started"}
          </p>
        </div>
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
