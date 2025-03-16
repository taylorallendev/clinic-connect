import { useState, useEffect } from "react";
import { AppointmentData } from "@/store/use-case-store";

export function useAppointment(appointmentId: string) {
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAppointment() {
      try {
        setIsLoading(true);
        // Replace this with your actual API call
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (!response.ok) throw new Error("Failed to fetch appointment");
        const data = await response.json();
        setAppointment(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointment();
  }, [appointmentId]);

  return { appointment, isLoading, error };
}
