"use server";

import { createClient } from "@/utils/supabase/server";

export interface CaseStatusCounts {
  total: number;
  ongoing: number;
  completed: number;
  reviewed: number;
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
export async function getCaseTypeStats(): Promise<CaseStatusCounts> {
  const supabase = await createClient();

  try {
    // Query to get all case statuses
    const { data, error } = await supabase.from("cases").select("status");

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
    };

    // Count total cases
    counts.total = data.length;

    // Count cases by status
    data.forEach((item: CaseStatusQueryResult) => {
      // Use type assertion to handle possible undefined status
      const status = item.status as string;

      // Increment the appropriate counter based on status
      if (status === "in_progress" || status === "Ongoing") counts.ongoing++;
      else if (status === "completed" || status === "Completed")
        counts.completed++;
      else if (status === "reviewed" || status === "Reviewed")
        counts.reviewed++;
      else if (status === "exported" || status === "Exported")
        counts.exported++;
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
    const patientIds = casesData
      .map((c: CaseData) => c.patientId)
      .filter(Boolean);

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
    const patientMap = new Map<string, PatientData>(
      patientsData.map((patient: PatientData) => [patient.id, patient])
    );

    // Map the database results to the Appointment interface
    const appointments: Appointment[] = casesData.map((item: CaseData) => {
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

interface PatientData {
  id: string;
  name: string;
  metadata?: {
    owner_name?: string;
    ownerName?: string;
    [key: string]: any;
  };
}

interface CaseData {
  id: string;
  name: string;
  patientId: string;
  type: string;
  dateTime: string;
  status?: string;
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
      .select("id, name, patientId, type, dateTime, status")
      .order("dateTime", { ascending: false });

    if (error) {
      console.error("Error fetching cases:", error);
      throw error;
    }

    // Get patient data for each case
    const patientIds = data.map((c: CaseData) => c.patientId).filter(Boolean);

    const { data: patientsData, error: patientsError } = await supabase
      .from("patients")
      .select("id, name")
      .in("id", patientIds);

    if (patientsError) {
      console.error("Error fetching patient data:", patientsError);
      throw patientsError;
    }

    // Create a map of patient data for quick lookup
    const patientMap = new Map<string, { id: string; name: string }>(
      patientsData.map((patient: { id: string; name: string }) => [
        patient.id,
        patient,
      ])
    );

    // Format the cases data
    return data.map((item: CaseData) => {
      const dateTime = new Date(item.dateTime);
      const patient = patientMap.get(item.patientId);

      return {
        id: item.id.toString(),
        name: item.name,
        patient: patient?.name || "Unknown Patient",
        type: item.type,
        date: dateTime.toLocaleDateString(),
        time: dateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        assignedTo: "Unassigned",
        status: item.status || "Pending",
      };
    });
  } catch (error) {
    console.error("Error in getAllCases:", error);
    return [];
  }
}
