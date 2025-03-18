"use client";

import { useEffect, useState } from "react";
import { CurrentCaseContent } from "../current-case/current-case-content";
import { useAppointment } from "@/hooks/use-appointment";
import { useCaseStore } from "@/store/use-case-store";
import { Loader2, ChevronLeft, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const isFromAppointments = searchParams.get('from') === 'appointments';

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
      <div className="flex items-center justify-center h-full text-[#1A202C]">
        <Loader2 className="w-8 h-8 mr-2 animate-spin text-[#2A9D8F]" />
        <span>Loading case data...</span>
      </div>
    );
  }

  if (appointmentId && error) {
    return (
      <div className="flex items-center justify-center h-full text-[#E76F51]">
        <span>Error loading case: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-6 bg-white light current-case-page">
      {/* Back to Appointments button - only show when coming from appointments page */}
      {isFromAppointments && appointmentId && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#2A9D8F]/10 border-[#2A9D8F]/30 text-[#2A9D8F] hover:bg-[#2A9D8F]/20"
            asChild
          >
            <Link href="/app/dashboard/appointments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Link>
          </Button>
        </div>
      )}
      
      {/* Render the CurrentCaseContent component for both new and existing cases */}
      <CurrentCaseContent />
    </div>
  );
}
