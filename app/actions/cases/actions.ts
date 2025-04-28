"use server";

/**
 * Case management server actions
 * Handles creating, reading, updating, and deleting cases
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Enums } from "@/database.types";
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

    // Create Supabase client
    const supabase = await createClient();

    console.log("Supabase client created");

    // First, create the case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        type: data.type as Enums<"CaseType">,
        status: data.status as Enums<"CaseStatus">,
        visibility: data.visibility as Enums<"CaseVisibility">,
        created_at: new Date(data.dateTime).toISOString(),
        updated_at: new Date().toISOString(),
      })
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
    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        name: data.name,
        owner_name: data.assignedTo,
        case_id: newCase.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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

    // First, check if the name has changed
    const { data: currentCase, error: getCurrentError } = await supabase
      .from("cases")
      .select("name, patientId")
      .eq("id", parsedData.id)
      .single();

    if (getCurrentError) {
      console.error("Failed to get current case:", getCurrentError);
      return {
        success: false,
        error: getCurrentError.message,
      };
    }

    // Build update object with only the fields that were provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsedData.status) updateData.status = parsedData.status;
    if (parsedData.visibility) updateData.visibility = parsedData.visibility;

    // Update the case data
    const { data: updatedCase, error: updateError } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", parsedData.id.toString())
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
 * Gets a case by ID with all related data
 * Used in the case view component
 */
export async function getCase(caseId: string) {
  try {
    console.log(`getCase called with ID: ${caseId}`);

    // Authenticate the user making the request
    const supabase = await createClient();

    // Fetch the case from the database
    console.log(`Fetching case with ID: ${caseId}`);
    const { data: caseData, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
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

    console.log("Case found:", caseData);

    // Build a response based on available fields
    const responseData: any = {
      id: caseData.id,
      name: caseData.name,
    };

    // Add other fields only if they exist
    if (caseData.dateTime) responseData.dateTime = caseData.dateTime;
    if (caseData.visibility) responseData.visibility = caseData.visibility;
    if (caseData.type) responseData.type = caseData.type;

    // Include case actions if available
    if (caseData.case_actions) {
      responseData.actions = caseData.case_actions;
    }

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

    console.log(
      `Storing ${actions.length} actions in case_actions column for case ${caseId}`
    );

    // Validate all actions against the schema
    const validatedActions = actions.map((action) =>
      caseActionSchema.parse(action)
    );

    // Format actions for storage in the case_actions column
    const formattedActions = validatedActions.map((action) => ({
      id: action.id,
      type: action.type,
      content: {
        transcript: action.content?.transcript || "",
        soap: action.content?.soap,
      },
      timestamp: action.timestamp,
    }));

    // Update the case with all actions at once
    const { error } = await supabase
      .from("cases")
      .update({
        case_actions: formattedActions,
      })
      .eq("id", caseId);

    if (error) {
      console.error("Failed to save case actions:", error);
      return {
        success: false,
        error: error.message,
      };
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
