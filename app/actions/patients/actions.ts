"use server";

/**
 * Patient management server actions
 * Handles creating, reading, updating, and deleting patients
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../common/auth";
import { Tables } from "@/database.types";

/**
 * Get all patients with optional filtering
 */
export async function getPatients(filter?: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Initialize Supabase client
    const supabase = await createClient();
    
    // Start building the query
    let query = supabase
      .from("patients")
      .select("*, cases(id, type, status, created_at)");
    
    // Apply filter if provided
    if (filter) {
      query = query.ilike("name", `%${filter}%`);
    }
    
    // Execute query with ordering
    const { data: patients, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      patients,
    };
  } catch (error) {
    console.error("Failed to get patients:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patients",
    };
  }
}

/**
 * Get a patient by ID
 */
export async function getPatientById(patientId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the patient with case information
    const supabase = await createClient();
    const { data: patient, error } = await supabase
      .from("patients")
      .select("*, cases(id, type, status, created_at)")
      .eq("id", patientId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      patient,
    };
  } catch (error) {
    console.error("Failed to get patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patient",
    };
  }
}

/**
 * Update patient information
 */
export async function updatePatient(
  patientId: string,
  patientData: {
    name?: string;
    owner_name?: string;
  }
) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the patient first to find the case_id for revalidation
    const supabase = await createClient();
    const { data: existingPatient, error: getError } = await supabase
      .from("patients")
      .select("case_id")
      .eq("id", patientId)
      .single();

    if (getError) {
      throw getError;
    }

    // Build update object with only the fields that were provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (patientData.name !== undefined) updateData.name = patientData.name;
    if (patientData.owner_name !== undefined) updateData.owner_name = patientData.owner_name;

    // Update the patient
    const { data: patient, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", patientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (existingPatient?.case_id) {
      revalidatePath(`/dashboard/case/${existingPatient.case_id}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      patient: patient as Tables<"patients">,
    };
  } catch (error) {
    console.error("Failed to update patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update patient",
    };
  }
}

/**
 * Create a new patient and optionally link to a case
 */
export async function createPatient({
  name,
  owner_name,
  case_id,
}: {
  name: string;
  owner_name: string;
  case_id?: string;
}) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Create the patient
    const supabase = await createClient();
    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        name,
        owner_name,
        case_id: case_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    if (case_id) {
      revalidatePath(`/dashboard/case/${case_id}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");

    return {
      success: true,
      patient: patient as Tables<"patients">,
    };
  } catch (error) {
    console.error("Failed to create patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create patient",
    };
  }
}