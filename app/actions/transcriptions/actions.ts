"use server";

/**
 * Transcription management server actions
 * Handles creating, reading, and managing transcriptions
 */

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../common/auth";
import { Tables } from "@/database.types";

/**
 * Saves a transcription to the database
 * Used by the transcription component after voice recording
 */
export async function saveTranscription(
  caseId: string, 
  transcript: string
) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify the case belongs to the user
    const supabase = await createClient();
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .single();

    if (caseError || !caseData) {
      throw new Error("Case not found or unauthorized");
    }

    // Create the transcription record
    const { data: transcription, error } = await supabase
      .from("transcriptions")
      .insert({
        case_id: caseId,
        transcript: transcript,
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
      transcription: transcription as Tables<"transcriptions">,
    };
  } catch (error) {
    console.error("Failed to save transcription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save transcription",
    };
  }
}

/**
 * Gets all transcriptions for a case
 * Used to display transcription history in the case view
 */
export async function getTranscriptionsForCase(caseId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify the case belongs to the user
    const supabase = await createClient();
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .single();

    if (caseError || !caseData) {
      throw new Error("Case not found or unauthorized");
    }

    // Get all transcriptions for the case
    const { data: transcriptions, error } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      transcriptions: transcriptions as Tables<"transcriptions">[],
    };
  } catch (error) {
    console.error("Failed to get transcriptions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transcriptions",
    };
  }
}

/**
 * Updates a transcription in the database
 * Allows for manual correction of transcribed text
 */
export async function updateTranscription(
  transcriptionId: string,
  transcript: string
) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the transcription and verify its case belongs to the user
    const supabase = await createClient();
    const { data: existingTranscription, error: getError } = await supabase
      .from("transcriptions")
      .select("case_id, cases!inner(id, user_id)")
      .eq("id", transcriptionId)
      .eq("cases.user_id", userId)
      .single();

    if (getError || !existingTranscription) {
      throw new Error("Transcription not found or unauthorized");
    }

    // Update the transcription
    const { data: transcription, error } = await supabase
      .from("transcriptions")
      .update({
        transcript: transcript,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcriptionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (existingTranscription?.case_id) {
      revalidatePath(`/dashboard/case/${existingTranscription.case_id}`);
    }

    return {
      success: true,
      transcription: transcription as Tables<"transcriptions">,
    };
  } catch (error) {
    console.error("Failed to update transcription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update transcription",
    };
  }
}

/**
 * Deletes a transcription from the database
 */
export async function deleteTranscription(transcriptionId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the transcription to find its case_id for path revalidation
    const supabase = await createClient();
    const { data: existingTranscription, error: getError } = await supabase
      .from("transcriptions")
      .select("case_id")
      .eq("id", transcriptionId)
      .single();

    if (getError) {
      throw getError;
    }

    // Delete the transcription
    const { error } = await supabase
      .from("transcriptions")
      .delete()
      .eq("id", transcriptionId);

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (existingTranscription?.case_id) {
      revalidatePath(`/dashboard/case/${existingTranscription.case_id}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete transcription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transcription",
    };
  }
}