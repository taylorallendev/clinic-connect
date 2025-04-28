"use server";

import { createClient } from "@/utils/supabase/server";
import { Tables, Database } from "@/types/database.types";

/**
 * Debug function to list all cases in the database
 * This helps troubleshoot issues with case creation and syncing
 */
export async function debugListAllCases() {
  try {
    console.log("*** DEBUG: Listing all cases in database ***");
    const supabase = await createClient();

    // Get all cases sorted by id (safer if created_at doesn't exist)
    const { data: cases, error } = await supabase
      .from("cases")
      .select("*")
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
    return cases as Tables["cases"]["Row"][];
  } catch (error) {
    console.error("Exception in debugListAllCases:", error);
    return [];
  }
}

interface AppointmentQueryResult {
  id: string;
  visibility: Database["public"]["Enums"]["CaseVisibility"] | null;
  type: string | null;
  status: Database["public"]["Enums"]["CaseStatus"] | null;
  created_at: string;
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
    patientName: string;
    ownerName: string;
    type: string;
    date: string;
    time: string;
    status: string;
    hasTranscription: boolean;
    hasSoapNote: boolean;
    hasGeneration: boolean;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
}

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

    // Calculate pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // First, build the query to fetch cases with related patient data
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

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting count:", countError);
    }

    // Map cases to appointments format
    let appointments = [];

    if (casesData && casesData.length > 0) {
      // Log case fields for debugging
      console.log("Case data fields available:", Object.keys(casesData[0]));
      console.log("First case sample:", JSON.stringify(casesData[0]));

      // Map cases to appointments format
      appointments = casesData
        .map((caseItem: AppointmentQueryResult) => {
          try {
            // Get the first patient from the patients array
            const patient =
              caseItem.patients && caseItem.patients.length > 0
                ? caseItem.patients[0]
                : null;

            // Format the date and time from created_at
            const dateTime = new Date(caseItem.created_at);
            const formattedDate = dateTime.toLocaleDateString();
            const formattedTime = dateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              id: caseItem.id,
              patientName: patient?.name || "Unknown Patient",
              ownerName: patient?.owner_name || "Unknown Owner",
              type: caseItem.type || "General",
              date: formattedDate,
              time: formattedTime,
              status: caseItem.status || "ongoing",
              hasTranscription:
                caseItem.transcriptions && caseItem.transcriptions.length > 0,
              hasSoapNote:
                caseItem.soap_notes && caseItem.soap_notes.length > 0,
              hasGeneration:
                caseItem.generations && caseItem.generations.length > 0,
            };
          } catch (error) {
            console.error("Error mapping case to appointment:", error);
            return null;
          }
        })
        .filter(Boolean); // Remove any null items from failed mappings
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

interface AppointmentDetailResult {
  id: string;
  patientName: string;
  ownerName: string;
  type: string;
  date: string;
  time: string;
  status: Database["public"]["Enums"]["CaseStatus"];
  soapNotes: Array<{
    id: string;
    date: string;
    time: string;
    transcript: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  }>;
  transcriptions: Array<{
    id: string;
    date: string;
    time: string;
    transcript: string;
  }>;
  generations: Array<{
    id: string;
    date: string;
    time: string;
    prompt: string | null;
    content: string | null;
    templateId: string | null;
  }>;
}

/**
 * Get detailed appointment data including all related records
 * This is used for the appointment detail view
 */
export async function getAppointmentDetails(appointmentId: string): Promise<{
  success: boolean;
  data?: AppointmentDetailResult;
  error?: string;
}> {
  try {
    console.log(
      "Server action: getAppointmentDetails called for ID:",
      appointmentId
    );
    const supabase = await createClient();

    // Define the return type for the query
    type CaseWithDetails = Tables["cases"]["Row"] & {
      patients: Array<
        Pick<Tables["patients"]["Row"], "id" | "name" | "owner_name">
      >;
      soap_notes: Array<
        Pick<
          Tables["soap_notes"]["Row"],
          | "id"
          | "created_at"
          | "transcript"
          | "subjective"
          | "objective"
          | "assessment"
          | "plan"
        >
      >;
      transcriptions: Array<
        Pick<
          Tables["transcriptions"]["Row"],
          "id" | "created_at" | "transcript"
        >
      >;
      generations: Array<
        Pick<
          Tables["generations"]["Row"],
          "id" | "created_at" | "prompt" | "content" | "template_id"
        >
      >;
    };

    // Fetch the case with all related data
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
        patients (
          id,
          name,
          owner_name
        ),
        soap_notes (
          id,
          created_at,
          transcript,
          subjective,
          objective,
          assessment,
          plan
        ),
        transcriptions (
          id,
          created_at,
          transcript
        ),
        generations (
          id,
          created_at,
          prompt,
          content,
          template_id
        )
      `
      )
      .eq("id", appointmentId)
      .single();

    if (caseError) {
      console.error("Error fetching appointment details:", caseError);
      return { success: false, error: caseError.message };
    }

    if (!caseData) {
      return { success: false, error: "Appointment not found" };
    }

    // Cast to our type with relations
    const typedCaseData = caseData as CaseWithDetails;

    // Get the first patient from the patients array
    const patient =
      typedCaseData.patients && typedCaseData.patients.length > 0
        ? typedCaseData.patients[0]
        : { id: null, name: "Unknown Patient", owner_name: "Unknown Owner" };

    // Format the date and time from created_at
    const dateTime = new Date(typedCaseData.created_at);

    // Extract doctor/owner info from patient
    const doctorName = patient.owner_name || "Unassigned";

    // Format SOAP notes
    const soapNotes = (typedCaseData.soap_notes || []).map((note) => {
      const noteDateTime = new Date(note.created_at);
      return {
        id: note.id,
        date: noteDateTime.toLocaleDateString(),
        time: noteDateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        transcript: note.transcript,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
      };
    });

    // Format transcriptions
    const transcriptions = (typedCaseData.transcriptions || []).map(
      (transcription) => {
        const transcriptDateTime = new Date(transcription.created_at);
        return {
          id: transcription.id,
          date: transcriptDateTime.toLocaleDateString(),
          time: transcriptDateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          transcript: transcription.transcript || "",
        };
      }
    );

    // Format generations
    const generations = (typedCaseData.generations || []).map((generation) => {
      const genDateTime = new Date(generation.created_at);
      return {
        id: generation.id,
        date: genDateTime.toLocaleDateString(),
        time: genDateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        prompt: generation.prompt,
        content: generation.content,
        templateId: generation.template_id,
      };
    });

    // Construct the detailed appointment data
    const appointmentDetails: AppointmentDetailResult = {
      id: typedCaseData.id,
      patientName: patient.name || "Unknown Patient",
      ownerName: doctorName,
      type: typedCaseData.type || "General",
      date: dateTime.toLocaleDateString(),
      time: dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: typedCaseData.status || "ongoing",
      soapNotes,
      transcriptions,
      generations,
    };

    return { success: true, data: appointmentDetails };
  } catch (error) {
    console.error("Server action error in getAppointmentDetails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Save SOAP notes to the database
 * This creates or updates a SOAP note in the soap_notes table
 */
export async function saveSoapNotes({
  caseId,
  soapId,
  transcript,
  subjective,
  objective,
  assessment,
  plan,
}: {
  caseId: string;
  soapId?: string;
  transcript?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}) {
  try {
    console.log("Server action: saveSoapNotes called for case:", caseId);
    const supabase = await createClient();

    // Prepare the data to insert/update
    const soapData: Tables["soap_notes"]["Insert"] = {
      case_id: caseId,
      transcript: transcript || null,
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    // If soapId is provided, update existing record
    if (soapId) {
      const { data, error } = await supabase
        .from("soap_notes")
        .update(soapData)
        .eq("id", soapId)
        .select()
        .single();

      if (error) {
        console.error("Error updating SOAP notes:", error);
        throw new Error(error.message);
      }

      result = data;
    }
    // Otherwise, create a new record
    else {
      // Add created_at for new records
      soapData.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("soap_notes")
        .insert(soapData)
        .select()
        .single();

      if (error) {
        console.error("Error creating SOAP notes:", error);
        throw new Error(error.message);
      }

      result = data;
    }

    return {
      success: true,
      data: result as Tables["soap_notes"]["Row"],
    };
  } catch (error) {
    console.error("Server action error in saveSoapNotes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Save a transcription to the database
 * This creates a new transcription in the transcriptions table
 */
export async function saveTranscription({
  caseId,
  transcript,
}: {
  caseId: string;
  transcript: string;
}) {
  try {
    console.log("Server action: saveTranscription called for case:", caseId);
    const supabase = await createClient();

    // Insert the transcription
    const transcriptionData: Tables["transcriptions"]["Insert"] = {
      case_id: caseId,
      transcript,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("transcriptions")
      .insert(transcriptionData)
      .select()
      .single();

    if (error) {
      console.error("Error saving transcription:", error);
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as Tables["transcriptions"]["Row"],
    };
  } catch (error) {
    console.error("Server action error in saveTranscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Save an AI generation to the database
 * This creates a new generation in the generations table
 */
export async function saveGeneration({
  caseId,
  prompt,
  content,
  templateId,
}: {
  caseId: string;
  prompt: string;
  content: string;
  templateId?: string;
}) {
  try {
    console.log("Server action: saveGeneration called for case:", caseId);
    const supabase = await createClient();

    // Insert the generation
    const generationData: Tables["generations"]["Insert"] = {
      case_id: caseId,
      prompt,
      content,
      template_id: templateId || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("generations")
      .insert(generationData)
      .select()
      .single();

    if (error) {
      console.error("Error saving generation:", error);
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data as Tables["generations"]["Row"],
    };
  } catch (error) {
    console.error("Server action error in saveGeneration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a single appointment by ID
 * @param id The appointment ID to fetch
 */
export async function getAppointmentById(id: string) {
  try {
    console.log("Server action: getAppointmentById called for ID:", id);
    const supabase = await createClient();

    // Define the return type for the query
    type CaseWithRelations = Tables["cases"]["Row"] & {
      patients: Array<
        Pick<Tables["patients"]["Row"], "id" | "name" | "owner_name">
      >;
      transcriptions: Array<
        Pick<
          Tables["transcriptions"]["Row"],
          "id" | "transcript" | "created_at"
        >
      >;
      soap_notes: Array<
        Pick<
          Tables["soap_notes"]["Row"],
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
        Pick<
          Tables["generations"]["Row"],
          "id" | "prompt" | "content" | "created_at"
        >
      >;
    };

    // Query the case with the given ID, including related data
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
    const dateTime = new Date(typedCaseData.created_at);
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
      type: typedCaseData.type || "General",
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
