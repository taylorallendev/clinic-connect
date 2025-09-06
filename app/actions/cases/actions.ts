"use server";

/**
 * Case management server actions
 * Handles creating, reading, updating, and deleting cases
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Enums, TablesUpdate, TablesInsert } from "@/database.types";
import {
  updateCaseSchema,
  ClientCaseAction,
  CreateCaseInput,
} from "../common/validation";
import { caseActionSchema } from "../common/validation";

/**
 * Creates a new case with a patient
 * Used in the current-case form component
 */
export async function createCase(data: CreateCaseInput) {
  try {
    console.log("createCase called with data:", JSON.stringify(data, null, 2));
    console.log(
      "====================== CASE CREATION START ======================"
    );

    // Create Supabase client and get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return {
        success: false,
        error: "You must be logged in to create a case",
      };
    }

    console.log("Supabase client created, user authenticated:", user.id);

    // First, create the case with user_id
    const caseData: TablesInsert<"cases"> = {
      type: data.type,
      status: data.status,
      visibility: data.visibility,
      user_id: user.id,
      created_at: new Date(data.dateTime).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert(caseData)
      .select()
      .single();

    if (caseError) {
      console.error("Failed to create case:", caseError);
      return {
        success: false,
        error: caseError.message,
      };
    }

    console.log(`Created new case with ID: ${newCase.id}`);

    // Then, create the patient
    const patientData: TablesInsert<"patients"> = {
      name: data.name,
      owner_name: data.assignedTo,
      case_id: newCase.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert(patientData)
      .select()
      .single();

    if (patientError) {
      console.error("Failed to create patient:", patientError);
      // Don't return error here, we still have a valid case
    } else {
      console.log(`Created new patient with ID: ${newPatient.id}`);
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/api/appointments");

    return {
      success: true,
      data: {
        ...newCase,
        patient: newPatient,
      },
    };
  } catch (error) {
    console.error("Failed to create case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create case",
    };
  }
}

/**
 * Updates a case's information
 * Used in the case edit form
 */
export async function updateCase(data: z.infer<typeof updateCaseSchema>) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate input data against the schema
    const parsedData = updateCaseSchema.parse(data);

    // First, check if the case belongs to the user
    const { data: currentCase, error: getCurrentError } = await supabase
      .from("cases")
      .select("user_id")
      .eq("id", parsedData.id)
      .eq("user_id", user.id)
      .single();

    if (getCurrentError) {
      console.error("Failed to get current case:", getCurrentError);
      return {
        success: false,
        error: getCurrentError.message,
      };
    }

    // Build update object with only the fields that were provided
    // Using TablesUpdate type for type safety
    const updateData: TablesUpdate<"cases"> = {
      updated_at: new Date().toISOString(),
    };

    if (parsedData.status) {
      updateData.status = parsedData.status as Enums<"CaseStatus">;
    }
    if (parsedData.visibility) {
      updateData.visibility = parsedData.visibility as Enums<"CaseVisibility">;
    }

    // Update the case data (only if it belongs to the user)
    const { data: updatedCase, error: updateError } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", parsedData.id.toString())
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update case:", updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/case/${parsedData.id}`);
    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      data: updatedCase,
    };
  } catch (error) {
    console.error("Failed to update case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update case",
    };
  }
}

/**
 * Gets all cases for the current user
 * Used in the dashboard and case list components
 */
export async function getUserCases() {
  try {
    console.log("getUserCases called");

    // Create Supabase client and get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return {
        success: false,
        error: "You must be logged in to view cases",
      };
    }

    console.log(`Fetching cases for user: ${user.id}`);

    // Fetch all cases for the user with related patient data
    const { data: cases, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        patients (
          id,
          name,
          owner_name
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch user cases:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`Found ${cases?.length || 0} cases for user`);

    // Format the response
    const formattedCases = (cases || []).map(caseItem => ({
      id: caseItem.id,
      type: caseItem.type,
      status: caseItem.status,
      visibility: caseItem.visibility,
      user_id: caseItem.user_id,
      created_at: caseItem.created_at,
      updated_at: caseItem.updated_at,
      patient: caseItem.patients?.[0] || null,
    }));

    return {
      success: true,
      data: formattedCases,
    };
  } catch (error) {
    console.error("Failed to get user cases:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user cases",
    };
  }
}

/**
 * Gets a case by ID with all related data
 * Used in the case view component
 */
export async function getCase(caseId: string) {
  try {
    console.log(`getCase called with ID: ${caseId}`);

    // Create Supabase client and get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return {
        success: false,
        error: "You must be logged in to view cases",
      };
    }

    // Fetch the case with all related data, filtered by user_id
    console.log(`Fetching case with ID: ${caseId} for user: ${user.id}`);
    const { data: caseData, error } = await supabase
      .from("cases")
      .select(
        `
        *,
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
          created_at
        ),
        generations (
          id,
          prompt,
          content,
          created_at
        )
      `
      )
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Failed to fetch case:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!caseData) {
      console.log(`No case found with ID: ${caseId}`);
      return {
        success: false,
        error: "Case not found",
      };
    }

    console.log("Case found with related data");

    // Format the response
    const responseData = {
      id: caseData.id,
      type: caseData.type,
      status: caseData.status,
      visibility: caseData.visibility,
      user_id: caseData.user_id,
      created_at: caseData.created_at,
      updated_at: caseData.updated_at,
      patient: caseData.patients?.[0] || null,
      transcriptions: caseData.transcriptions || [],
      soap_notes: caseData.soap_notes || [],
      generations: caseData.generations || [],
    };

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("Failed to get case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get case",
    };
  }
}

/**
 * Saves client-side case actions to the database
 * Used by the use-case-store to persist recording and SOAP actions
 */
export async function saveActionsToCase(
  caseId: string,
  actions: ClientCaseAction[]
) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify that the case belongs to the user
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .single();

    if (caseError || !caseData) {
      console.error("Case not found or unauthorized:", caseError);
      return {
        success: false,
        error: "Case not found or you don't have permission to modify it",
      };
    }

    console.log(`Processing ${actions.length} actions for case ${caseId}`);

    // Validate all actions against the schema
    const validatedActions = actions.map((action) =>
      caseActionSchema.parse(action)
    );

    // Begin a transaction to ensure all operations succeed or fail together
    // Note: Supabase JS client doesn't support transactions directly, so we'll use individual operations

    // Process each action based on its type
    for (const action of validatedActions) {
      if (action.type === "recording" && action.content?.transcript) {
        // Store recording as a transcription
        const transcriptionData: TablesInsert<"transcriptions"> = {
          transcript: action.content.transcript,
          case_id: caseId,
          created_at: new Date(action.timestamp).toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("transcriptions")
          .insert(transcriptionData);

        if (error) {
          console.error("Failed to save transcription:", error);
          throw new Error(`Failed to save transcription: ${error.message}`);
        }
      } else if (action.type === "soap" && action.content?.soap) {
        // Store SOAP note in the soap_notes table
        const soapNoteData: TablesInsert<"soap_notes"> = {
          transcript: action.content.transcript || "",
          subjective: action.content.soap.subjective,
          objective: action.content.soap.objective,
          assessment: action.content.soap.assessment,
          plan: action.content.soap.plan,
          case_id: caseId,
          created_at: new Date(action.timestamp).toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("soap_notes")
          .insert(soapNoteData);

        if (error) {
          console.error("Failed to save SOAP note:", error);
          throw new Error(`Failed to save SOAP note: ${error.message}`);
        }
      }
    }

    // Revalidate paths
    revalidatePath(`/dashboard/case/${caseId}`);

    return {
      success: true,
      message: `Successfully saved ${actions.length} actions to case ${caseId}`,
    };
  } catch (error) {
    console.error("Failed to save case actions:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save case actions",
    };
  }
}
