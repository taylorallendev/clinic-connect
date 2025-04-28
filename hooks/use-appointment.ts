import { getAppointmentById } from "@/app/actions";
import { useState, useEffect } from "react";

// Define a more flexible interface that matches what your server actions return
interface AppointmentData {
  id: string;
  name: string;
  date: string;
  time: string;
  type: string;
  status: string;
  patients: {
    id: string | null;
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
  metadata: {
    hasTranscriptions: boolean;
    hasSoapNotes: boolean;
    hasGenerations: boolean;
  };
  rawData?: any;
}

export function useAppointment(appointmentId: string) {
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAppointment() {
      if (!appointmentId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use the server action instead of fetch API
        const result = await getAppointmentById(appointmentId);

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to fetch appointment");
        }

        // Explicitly type the data to ensure it matches AppointmentData
        const appointmentData: AppointmentData = {
          id: result.data.id,
          name: result.data.name,
          date: result.data.date,
          time: result.data.time,
          type: result.data.type,
          status: result.data.status,
          patients: {
            id: result.data.patients?.id || null,
            name: result.data.patients?.name || "Unknown Patient",
            first_name: result.data.patients?.first_name || "",
            last_name: result.data.patients?.last_name || "",
          },
          users: {
            id: result.data.users?.id || "unknown",
            name: result.data.users?.name || "Unknown Provider",
            first_name: result.data.users?.first_name || "",
            last_name: result.data.users?.last_name || "",
          },
          metadata: {
            hasTranscriptions: result.data.metadata?.hasTranscriptions || false,
            hasSoapNotes: result.data.metadata?.hasSoapNotes || false,
            hasGenerations: result.data.metadata?.hasGenerations || false,
          },
          rawData: result.data.rawData,
        };

        setAppointment(appointmentData);
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointment();
  }, [appointmentId]);

  // Function to refresh the appointment data
  const refreshAppointment = async () => {
    if (!appointmentId) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await getAppointmentById(appointmentId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to refresh appointment");
      }

      // Explicitly type the data to ensure it matches AppointmentData
      const appointmentData: AppointmentData = {
        id: result.data.id,
        name: result.data.name,
        date: result.data.date,
        time: result.data.time,
        type: result.data.type,
        status: result.data.status,
        patients: {
          id: result.data.patients?.id || null,
          name: result.data.patients?.name || "Unknown Patient",
          first_name: result.data.patients?.first_name || "",
          last_name: result.data.patients?.last_name || "",
        },
        users: {
          id: result.data.users?.id || "unknown",
          name: result.data.users?.name || "Unknown Provider",
          first_name: result.data.users?.first_name || "",
          last_name: result.data.users?.last_name || "",
        },
        metadata: {
          hasTranscriptions: result.data.metadata?.hasTranscriptions || false,
          hasSoapNotes: result.data.metadata?.hasSoapNotes || false,
          hasGenerations: result.data.metadata?.hasGenerations || false,
        },
        rawData: result.data.rawData,
      };

      setAppointment(appointmentData);
    } catch (err) {
      console.error("Error refreshing appointment:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointment,
    isLoading,
    error,
    refreshAppointment,
  };
}
