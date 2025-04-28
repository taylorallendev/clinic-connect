"use server";

import { createClient } from "@/utils/supabase/server";
import { Tables, Database } from "@/database.types";

export interface CaseStatusCounts {
  total: number;
  ongoing: number;
  completed: number;
  reviewed: number;
  exported: number;
  scheduled: number;
}

/**
 * Gets the count of cases for each case type
 * @returns An object containing counts for each status type
 */
export async function getCaseTypeStats(): Promise<CaseStatusCounts> {
  const supabase = await createClient();

  try {
    // Query to get all case statuses
    const { data, error } = (await supabase.from("cases").select("status")) as {
      data: Pick<Tables<"cases">, "status">[];
      error: any;
    };

    if (error) {
      console.error("Error fetching case type stats:", error);
      throw error;
    }

    // Initialize counts object
    const counts: CaseStatusCounts = {
      total: 0,
      ongoing: 0,
      completed: 0,
      reviewed: 0,
      exported: 0,
      scheduled: 0,
    };

    // Count total cases
    counts.total = data.length;

    // Count cases by status
    data.forEach((item) => {
      const status = item.status as Database["public"]["Enums"]["CaseStatus"];

      // Increment the appropriate counter based on status
      if (status === "ongoing") counts.ongoing++;
      else if (status === "completed") counts.completed++;
      else if (status === "reviewed") counts.reviewed++;
      else if (status === "exported") counts.exported++;
      else if (status === "scheduled") counts.scheduled++;
    });

    return counts;
  } catch (error) {
    console.error("Failed to get case type stats:", error);
    // Return zeros for all counts in case of error
    return {
      total: 0,
      ongoing: 0,
      completed: 0,
      reviewed: 0,
      exported: 0,
      scheduled: 0,
    };
  }
}

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

/**
 * Interface for case data
 */
export interface Case {
  id: string;
  name: string;
  patient: string;
  type: string;
  date: string;
  assignedTo: string;
  status: string;
  time?: string;
}

/**
 * Gets all cases from the database
 * @returns An array of cases
 */
export async function getAllCases(): Promise<Case[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        id,
        type,
        status,
        created_at,
        patients (
          id,
          name,
          owner_name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cases:", error);
      throw error;
    }

    // Format the cases data
    return data.map(
      (item: {
        id: string;
        type: string | null;
        status: Database["public"]["Enums"]["CaseStatus"] | null;
        created_at: string;
        patients:
          | {
              id: string;
              name: string | null;
              owner_name: string | null;
            }[]
          | null;
      }) => {
        const dateTime = new Date(item.created_at);
        const patient =
          item.patients && item.patients.length > 0 ? item.patients[0] : null;

        return {
          id: item.id,
          name: patient?.name || "Unknown Patient",
          patient: patient?.name || "Unknown Patient",
          type: item.type || "General",
          date: dateTime.toLocaleDateString(),
          time: dateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          assignedTo: patient?.owner_name || "Unassigned",
          status: item.status || "ongoing",
        };
      }
    );
  } catch (error) {
    console.error("Error in getAllCases:", error);
    return [];
  }
}
