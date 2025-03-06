"use server";

import { createClient } from "@/utils/supabase/server";

export interface CaseStatusCounts {
  total: number;
  drafts: number;
  approved: number;
  exported: number;
}

// Update this interface to match your actual status values
interface CaseStatusQueryResult {
  status: string;
}

/**
 * Gets the count of cases for each case type
 * @returns An object containing counts for each status type
 */
export async function getCaseTypeStats(): Promise<{
  total: number;
  ongoing: number;
  completed: number;
  reviewed: number;
  exported: number;
}> {
  const supabase = await createClient();

  try {
    // Query to get all case statuses
    const { data, error } = await supabase.from("cases").select("status");

    if (error) {
      console.error("Error fetching case type stats:", error);
      throw error;
    }

    // Initialize counts object
    const counts = {
      total: 0,
      ongoing: 0,
      completed: 0,
      reviewed: 0,
      exported: 0,
    };

    // Count total cases
    counts.total = data.length;

    // Count cases by status
    data.forEach((item: CaseStatusQueryResult) => {
      // Use type assertion to handle possible undefined status
      const status = item.status as string;

      // Increment the appropriate counter based on status
      if (status === "in_progress") counts.ongoing++;
      else if (status === "completed") counts.completed++;
      else if (status === "reviewed") counts.reviewed++;
      else if (status === "exported") counts.exported++;
    });
    console.log(counts);
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
    // Query the cases table for upcoming appointments
    const { data: casesData, error: casesError } = await supabase
      .from("cases")
      .select("id, name, dateTime, type, patientId, status")
      .order("dateTime", { ascending: true })
      .limit(5);

    if (casesError) {
      console.error("Error fetching upcoming appointments:", casesError);
      throw casesError;
    }

    // We need to get patient information for each case
    const patientIds = casesData.map((c) => c.patientId).filter(Boolean);

    // Get patient data from the patients table
    const { data: patientsData, error: patientsError } = await supabase
      .from("patients")
      .select("id, name, metadata")
      .in("id", patientIds);

    if (patientsError) {
      console.error("Error fetching patient data:", patientsError);
      throw patientsError;
    }

    // Create a map of patient data for quick lookup
    const patientMap = new Map(
      patientsData.map((patient) => [patient.id, patient])
    );

    // Map the database results to the Appointment interface
    const appointments: Appointment[] = casesData.map((item) => {
      const patient = patientMap.get(item.patientId);
      const dateTime = new Date(item.dateTime);

      // Extract owner name from metadata if available
      const ownerName =
        patient?.metadata?.owner_name ||
        patient?.metadata?.ownerName ||
        "Unknown Owner";

      return {
        id: item.id.toString(),
        patient: patient?.name || "Unknown Patient",
        owner: ownerName,
        date: dateTime.toLocaleDateString(),
        time: dateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: item.type || "General",
      };
    });

    return appointments;
  } catch (error) {
    console.error("Failed to get upcoming appointments:", error);
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
    // Query the cases table
    const { data: casesData, error: casesError } = await supabase
      .from("cases")
      .select("id, name, dateTime, type, patientId, status")
      .order("dateTime", { ascending: false });

    if (casesError) {
      console.error("Error fetching cases:", casesError);
      throw casesError;
    }

    // We need to get patient information for each case
    const patientIds = casesData.map((c) => c.patientId).filter(Boolean);

    // Get patient data from the patients table
    const { data: patientsData, error: patientsError } = await supabase
      .from("patients")
      .select("id, name, metadata")
      .in("id", patientIds);

    if (patientsError) {
      console.error("Error fetching patient data:", patientsError);
      throw patientsError;
    }

    // Create a map of patient data for quick lookup
    const patientMap = new Map(
      patientsData.map((patient) => [patient.id, patient])
    );

    // Map the database results to the Case interface
    const cases: Case[] = casesData.map((item) => {
      const patient = patientMap.get(item.patientId);
      const dateTime = new Date(item.dateTime);

      // Map the database status to the UI status
      // Adjust this mapping based on your actual status values in the database
      let uiStatus = "Draft";
      if (item.status === "in_progress") uiStatus = "Ongoing";
      else if (item.status === "completed") uiStatus = "Completed";
      else if (item.status === "reviewed") uiStatus = "Reviewed";
      else if (item.status === "exported") uiStatus = "Exported";

      return {
        id: item.id.toString(),
        name: item.name || `Case for ${patient?.name || "Unknown Patient"}`,
        patient: patient?.name || "Unknown Patient",
        type: item.type || "General",
        date: dateTime.toLocaleDateString(),
        time: dateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        assignedTo: "Unassigned", // You might want to add this field to your database
        status: uiStatus,
      };
    });

    return cases;
  } catch (error) {
    console.error("Failed to get cases:", error);
    return [];
  }
}
