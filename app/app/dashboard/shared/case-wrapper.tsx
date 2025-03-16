"use client";

import { useEffect, useState } from "react";
import { CurrentCaseContent } from "../current-case/current-case-content";
import { useAppointment } from "@/hooks/use-appointment";
import { useCaseStore } from "@/store/use-case-store";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CaseWrapperProps {
  appointmentId?: string;
}

export function CaseWrapper({ appointmentId }: CaseWrapperProps) {
  const [isLoading, setIsLoading] = useState(!!appointmentId);
  const { loadAppointmentData, reset } = useCaseStore();

  // If an appointmentId is provided, we're in view/edit mode for an existing case
  // If not, we're in creation mode for a new case
  const {
    appointment,
    isLoading: isAppointmentLoading,
    error,
  } = useAppointment(appointmentId || "");

  useEffect(() => {
    if (appointmentId) {
      // We're viewing an existing case
      setIsLoading(true);

      if (appointment && !isAppointmentLoading) {
        // Load the appointment data into the case store
        loadAppointmentData(appointment);
        setIsLoading(false);
      }
    } else {
      // We're creating a new case, reset the store
      reset();
      setIsLoading(false);
    }
  }, [
    appointmentId,
    appointment,
    isAppointmentLoading,
    loadAppointmentData,
    reset,
  ]);

  if (isLoading || isAppointmentLoading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-50">
        <Loader2 className="w-8 h-8 mr-2 animate-spin" />
        <span>Loading case data...</span>
      </div>
    );
  }

  if (appointmentId && error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <span>Error loading case: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-6">
      {/* Navigation and Breadcrumbs */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-200 hover:text-blue-50 hover:bg-blue-800/30 mr-2"
            asChild
          >
            <Link href="/app/dashboard/appointments">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Appointments
            </Link>
          </Button>
        </div>
      </div>

      {/* Render the same CurrentCaseContent component for both new and existing cases */}
      <CurrentCaseContent />
    </div>
  );
}
