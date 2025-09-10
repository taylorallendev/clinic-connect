"use server";

/**
 * Appointment management server actions
 * Handles listing, filtering, and retrieving appointment data
 */

import { createClient } from "@/src/lib/supabase/server";
import { Tables, Database } from "@/database.types";

/**
 * Debug function to list all cases in the database
 * This helps troubleshoot issues with case creation and syncing
 */
export async function debugListAllCases() {
  try {
    console.log("*** DEBUG: Listing all cases for current user ***");
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return [];
    }

    // Get all cases for the user sorted by id
    const { data: cases, error } = await supabase
      .from("cases")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(20);

    if (error) {
      console.error(
        "Error fetching all cases in debugListAllCases:",
        JSON.stringify(error)
      );
      return [];
    }

    console.log(`Found ${cases.length} cases:`, JSON.stringify(cases, null, 2));
    return cases as Tables<"cases">[];
  } catch (error) {
    console.error("Exception in debugListAllCases:", error);
    return [];
  }
}

interface AppointmentQueryResult {
  id: string;
  visibility: Database["public"]["Enums"]["CaseVisibility"] | null;
  type: Database["public"]["Enums"]["CaseType"] | null;
  status: Database["public"]["Enums"]["CaseStatus"] | null;
  created_at: string | null;
  updated_at: string | null;
  patients:
    | {
        id: string;
        name: string | null;
        owner_name: string | null;
      }[]
    | null;
  transcriptions: { id: string }[] | null;
  soap_notes: { id: string }[] | null;
  generations: { id: string }[] | null;
}

interface AppointmentResult {
  appointments: Array<{
    id: string;
    name: string;
    patientName: string;
    ownerName: string;
    type: string;
    date: string;
    time: string;
    status: Database["public"]["Enums"]["CaseStatus"];
    hasTranscription: boolean;
    hasSoapNote: boolean;
    hasGeneration: boolean;
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
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Get appointments with filtering and pagination
 * This is the main function used in the appointments table view
 */
export async function getAppointments({
  page = 0,
  pageSize = 10,
  searchQuery = "",
  dateFilter = "",
  timestamp = Date.now(),
  forceRefresh = false,
}: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  dateFilter?: string;
  timestamp?: number;
  forceRefresh?: boolean;
} = {}): Promise<AppointmentResult> {
  try {
    console.log("Server action: getAppointments called with params:", {
      page,
      pageSize,
      searchQuery,
      dateFilter,
      timestamp,
    });
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return {
        appointments: [],
        totalCount: 0,
        page: 0,
        pageSize,
      };
    }

    // Calculate pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // First, build the query to fetch cases with related patient data, filtered by user
    let query = supabase
      .from("cases")
      .select(
        `
        id,
        visibility,
        type,
        status,
        created_at,
        updated_at,
        user_id,
        patients (
          id,
          name,
          owner_name
        ),
        transcriptions (
          id
        ),
        soap_notes (
          id
        ),
        generations (
          id
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Add console log to debug the query
    console.log("Fetching cases with query parameters:", {
      page,
      pageSize,
      searchQuery,
      dateFilter,
    });

    // Apply search filter if provided
    if (searchQuery) {
      // Search in patients table since name is now there
      query = query.or(`
        patients.name.ilike.%${searchQuery}%,
        type.ilike.%${searchQuery}%
      `);
    }

    // Apply date filter if provided
    if (dateFilter) {
      try {
        // Convert dateFilter to start and end of day
        const startOfDay = `${dateFilter}T00:00:00.000Z`;
        const endOfDay = `${dateFilter}T23:59:59.999Z`;

        // Log for debugging
        console.log("Filtering by date range:", {
          startOfDay,
          endOfDay,
          dateFilter,
        });

        // Use created_at instead of dateTime
        query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
      } catch (error) {
        console.error("Error setting date filter:", error);
      }
    }

    // Execute the query with pagination
    const { data: casesData, error: casesError } = await query.range(from, to);

    if (casesError) {
      console.error("Error fetching cases:", casesError);
      throw new Error(casesError.message);
    }

    // Debug the results
    console.log(
      `Found ${casesData ? casesData.length : 0} cases in the database`
    );
    if (casesData && casesData.length > 0) {
      console.log("Sample case data:", JSON.stringify(casesData[0], null, 2));
    }

    // Get total count for pagination (filtered by user)
    const { count: totalCount, error: countError } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error getting count:", countError);
    }

    // Map cases to appointments format that is compatible with AppointmentData in use-case-store.tsx
    let appointments: Array<{
      id: string;
      name: string;
      patientName: string;
      ownerName: string;
      type: string;
      date: string;
      time: string;
      status: Database["public"]["Enums"]["CaseStatus"];
      hasTranscription: boolean;
      hasSoapNote: boolean;
      hasGeneration: boolean;
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
    }> = [];

    if (casesData && casesData.length > 0) {
      // Map cases to appointments format
      appointments = casesData
        .map((caseItem) => {
          try {
            // Get the first patient from the patients array
            const patient =
              caseItem.patients && caseItem.patients.length > 0
                ? caseItem.patients[0]
                : null;

            // Format the date and time from created_at
            const dateTime = caseItem.created_at
              ? new Date(caseItem.created_at)
              : new Date();
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              id: caseItem.id,
              name: patient?.name || "Unknown Patient", // Add name for AppointmentData compatibility
              patientName: patient?.name || "Unknown Patient",
              ownerName: patient?.owner_name || "Unknown Owner",
              type: caseItem.type || "checkup",
              date: formattedDate,
              time: formattedTime,
              status: caseItem.status || "ongoing",
              hasTranscription: Boolean(
                caseItem.transcriptions && caseItem.transcriptions.length > 0
              ),
              hasSoapNote: Boolean(
                caseItem.soap_notes && caseItem.soap_notes.length > 0
              ),
              hasGeneration: Boolean(
                caseItem.generations && caseItem.generations.length > 0
              ),
              // Also add patients and users structure for AppointmentData compatibility
              patients: {
                id: patient?.id || null,
                name: patient?.name || "Unknown Patient",
                first_name: patient?.name?.split(" ")[0] || "",
                last_name: patient?.name?.split(" ").slice(1).join(" ") || ""
              },
              users: {
                id: "doctor-id",
                name: patient?.owner_name || "Unknown Owner",
                first_name: patient?.owner_name?.split(" ")[0] || "",
                last_name: patient?.owner_name?.split(" ").slice(1).join(" ") || ""
              },
              metadata: {
                hasTranscriptions: Boolean(
                  caseItem.transcriptions && caseItem.transcriptions.length > 0
                ),
                hasSoapNotes: Boolean(
                  caseItem.soap_notes && caseItem.soap_notes.length > 0
                ),
                hasGenerations: Boolean(
                  caseItem.generations && caseItem.generations.length > 0
                )
              }
            };
          } catch (error) {
            console.error("Error mapping case to appointment:", error);
            return null;
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null); // Type guard to remove nulls
    }

    return {
      appointments,
      totalCount: totalCount || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Server action error in getAppointments:", error);
    // Return empty data rather than throwing
    return {
      appointments: [],
      totalCount: 0,
      page: 0,
      pageSize,
    };
  }
}

/**
 * Get a single appointment by ID
 * Used by the use-appointment hook to fetch appointment details
 * @param id The appointment ID to fetch
 */
export async function getAppointmentById(id: string) {
  try {
    console.log("Server action: getAppointmentById called for ID:", id);
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      throw new Error("You must be logged in to view appointments");
    }

    // Define the return type for the query
    type CaseWithRelations = Tables<"cases"> & {
      patients: Array<Pick<Tables<"patients">, "id" | "name" | "owner_name">>;
      transcriptions: Array<
        Pick<Tables<"transcriptions">, "id" | "transcript" | "created_at">
      >;
      soap_notes: Array<
        Pick<
          Tables<"soap_notes">,
          | "id"
          | "subjective"
          | "objective"
          | "assessment"
          | "plan"
          | "created_at"
          | "updated_at"
        >
      >;
      generations: Array<
        Pick<Tables<"generations">, "id" | "prompt" | "content" | "created_at">
      >;
    };

    // Query the case with the given ID, including related data (filtered by user)
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select(
        `
        id,
        visibility,
        type,
        status,
        created_at,
        updated_at,
        user_id,
        patients (
          id,
          name,
          owner_name
        ),
        transcriptions (
          id,
          transcript,
          created_at
        ),
        soap_notes (
          id,
          subjective,
          objective,
          assessment,
          plan,
          created_at,
          updated_at
        ),
        generations (
          id,
          prompt,
          content,
          created_at
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (caseError) {
      console.error("Error fetching appointment by ID:", caseError);
      return {
        success: false,
        error: caseError.message,
      };
    }

    if (!caseData) {
      return {
        success: false,
        error: "Appointment not found",
      };
    }

    // Cast to our type with relations
    const typedCaseData = caseData as CaseWithRelations;

    // Format the appointment data
    const dateTime = new Date(typedCaseData.created_at ?? new Date());
    const patient =
      typedCaseData.patients && typedCaseData.patients.length > 0
        ? typedCaseData.patients[0]
        : { id: null, name: "Unknown Patient", owner_name: "Unknown Owner" };

    // Get user data (provider) from patient's owner_name
    const doctorName = patient.owner_name || "Unassigned";

    // Create a properly typed formatted appointment
    interface FormattedAppointment {
      id: string;
      name: string;
      date: string;
      time: string;
      type: string;
      status: Database["public"]["Enums"]["CaseStatus"];
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
      rawData: CaseWithRelations;
    }

    const formattedAppointment: FormattedAppointment = {
      id: typedCaseData.id,
      name: patient.name || "Unknown Patient",
      date: dateTime.toLocaleDateString(),
      time: dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: typedCaseData.type || "checkup",
      status: typedCaseData.status || "ongoing",
      patients: {
        id: patient.id || null,
        name: patient.name || "Unknown Patient",
        first_name: patient.name?.split(" ")[0] || "",
        last_name: patient.name?.split(" ").slice(1).join(" ") || "",
      },
      users: {
        id: "doctor-id", // Placeholder as we don't have actual doctor IDs
        name: doctorName,
        first_name: doctorName.split(" ")[0] || "",
        last_name: doctorName.split(" ").slice(1).join(" ") || "",
      },
      metadata: {
        hasTranscriptions:
          Array.isArray(typedCaseData.transcriptions) &&
          typedCaseData.transcriptions.length > 0,
        hasSoapNotes:
          Array.isArray(typedCaseData.soap_notes) &&
          typedCaseData.soap_notes.length > 0,
        hasGenerations:
          Array.isArray(typedCaseData.generations) &&
          typedCaseData.generations.length > 0,
      },
      // Include the raw data for detailed views
      rawData: typedCaseData,
    };

    return {
      success: true,
      data: formattedAppointment,
    };
  } catch (error) {
    console.error("Server action error in getAppointmentById:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get upcoming appointments for the dashboard
 * Used in the dashboard component
 */
export async function getUpcomingAppointments() {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return [];
    }
    
    // Query the cases table for upcoming appointments with related patient data (filtered by user)
    const { data: casesData, error: casesError } = await supabase
      .from("cases")
      .select(
        `
        id,
        type,
        created_at,
        user_id,
        patients (
          id,
          name,
          owner_name
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(5);

    if (casesError) {
      console.error("Error fetching upcoming appointments:", casesError);
      throw casesError;
    }

    // Map the database results to the Appointment interface
    const appointments = casesData.map(
      (item: {
        id: string;
        type: Database["public"]["Enums"]["CaseType"] | null;
        created_at: string | null;
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

        const dateTime = new Date(item.created_at || new Date());

        return {
          id: item.id,
          patient: patient?.name || "Unknown Patient",
          owner: patient?.owner_name || "Unknown Owner",
          date: dateTime.toLocaleDateString(),
          time: dateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: item.type || "checkup",
        };
      }
    );

    return appointments;
  } catch (error) {
    console.error("Error in getUpcomingAppointments:", error);
    return [];
  }
}
