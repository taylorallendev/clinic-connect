"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Interface for appointment data
 */
export interface Appointment {
  id: string;
  patient: string;
  owner: string;
  date: string;
  time: string;
  type: string;
}

/**
 * Gets upcoming appointments from the cases table
 * Used in the modern dashboard component to display upcoming appointments
 * @returns An array of upcoming appointments
 */
export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();

  try {
    // Query the cases table for upcoming appointments with related patient data
    const { data: casesData, error: casesError } = await supabase
      .from("cases")
      .select(
        `
        id,
        type,
        created_at,
        patients (
          id,
          name,
          owner_name
        )
      `
      )
      .order("created_at", { ascending: true })
      .limit(5);

    if (casesError) {
      console.error("Error fetching upcoming appointments:", casesError);
      throw casesError;
    }

    // Map the database results to the Appointment interface
    const appointments: Appointment[] = casesData.map(
      (item: {
        id: string;
        type: string | null;
        created_at: string;
        patients:
          | {
              id: string;
              name: string | null;
              owner_name: string | null;
            }[]
          | null;
      }) => {
        const patient =
          item.patients && item.patients.length > 0 ? item.patients[0] : null;

        const dateTime = new Date(item.created_at);

        return {
          id: item.id,
          patient: patient?.name || "Unknown Patient",
          owner: patient?.owner_name || "Unknown Owner",
          date: dateTime.toLocaleDateString(),
          time: dateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: item.type || "General",
        };
      }
    );

    return appointments;
  } catch (error) {
    console.error("Error in getUpcomingAppointments:", error);
    return [];
  }
}