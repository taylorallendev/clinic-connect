"use server";

/**
 * SOAP notes management server actions
 * Handles creating, reading, updating, and deleting SOAP notes
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../common/auth";
import { Tables } from "@/database.types";

/**
 * Create a new SOAP note from a transcript or generated content
 */
export async function createSoapNote({
  caseId,
  transcript = "",
  subjective,
  objective,
  assessment,
  plan,
}: {
  caseId: string;
  transcript?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Create the SOAP note
    const supabase = await createClient();
    const { data: soapNote, error } = await supabase
      .from("soap_notes")
      .insert({
        case_id: caseId,
        transcript: transcript,
        subjective: subjective,
        objective: objective,
        assessment: assessment,
        plan: plan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath(`/dashboard/case/${caseId}`);

    return {
      success: true,
      soapNote: soapNote as Tables<"soap_notes">,
    };
  } catch (error) {
    console.error("Failed to create SOAP note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create SOAP note",
    };
  }
}

/**
 * Get all SOAP notes for a case
 */
export async function getSoapNotesForCase(caseId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get all SOAP notes for the case
    const supabase = await createClient();
    const { data: soapNotes, error } = await supabase
      .from("soap_notes")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      soapNotes: soapNotes as Tables<"soap_notes">[],
    };
  } catch (error) {
    console.error("Failed to get SOAP notes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get SOAP notes",
    };
  }
}

/**
 * Get a SOAP note by ID
 */
export async function getSoapNoteById(soapNoteId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the SOAP note
    const supabase = await createClient();
    const { data: soapNote, error } = await supabase
      .from("soap_notes")
      .select("*")
      .eq("id", soapNoteId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      soapNote: soapNote as Tables<"soap_notes">,
    };
  } catch (error) {
    console.error("Failed to get SOAP note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get SOAP note",
    };
  }
}

/**
 * Update a SOAP note
 */
export async function updateSoapNote({
  soapNoteId,
  subjective,
  objective,
  assessment,
  plan,
}: {
  soapNoteId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the SOAP note to find its case_id for path revalidation
    const supabase = await createClient();
    const { data: existingSoapNote, error: getError } = await supabase
      .from("soap_notes")
      .select("case_id")
      .eq("id", soapNoteId)
      .single();

    if (getError) {
      throw getError;
    }

    // Create update object with only the fields that were provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (subjective !== undefined) updateData.subjective = subjective;
    if (objective !== undefined) updateData.objective = objective;
    if (assessment !== undefined) updateData.assessment = assessment;
    if (plan !== undefined) updateData.plan = plan;

    // Update the SOAP note
    const { data: soapNote, error } = await supabase
      .from("soap_notes")
      .update(updateData)
      .eq("id", soapNoteId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (existingSoapNote?.case_id) {
      revalidatePath(`/dashboard/case/${existingSoapNote.case_id}`);
    }

    return {
      success: true,
      soapNote: soapNote as Tables<"soap_notes">,
    };
  } catch (error) {
    console.error("Failed to update SOAP note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update SOAP note",
    };
  }
}

/**
 * Delete a SOAP note
 */
export async function deleteSoapNote(soapNoteId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the SOAP note to find its case_id for path revalidation
    const supabase = await createClient();
    const { data: existingSoapNote, error: getError } = await supabase
      .from("soap_notes")
      .select("case_id")
      .eq("id", soapNoteId)
      .single();

    if (getError) {
      throw getError;
    }

    // Delete the SOAP note
    const { error } = await supabase
      .from("soap_notes")
      .delete()
      .eq("id", soapNoteId);

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (existingSoapNote?.case_id) {
      revalidatePath(`/dashboard/case/${existingSoapNote.case_id}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete SOAP note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete SOAP note",
    };
  }
}