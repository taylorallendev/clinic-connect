"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/utils/clerk/server";

// Patient Schema
const patientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  species: z.string().optional(),
  breed: z.string().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerEmail: z.string().email("Invalid email address").optional(),
  ownerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

// Create patient
export async function createPatient(data: PatientFormValues) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsedData = patientSchema.parse(data);

    // Insert patient into database
    const { data: result, error } = await supabase
      .from("patients")
      .insert({
        name: parsedData.name,
        date_of_birth: new Date(parsedData.dateOfBirth).toISOString(),
        metadata: {
          species: parsedData.species,
          breed: parsedData.breed,
          owner: {
            name: parsedData.ownerName,
            email: parsedData.ownerEmail,
            phone: parsedData.ownerPhone,
          },
          notes: parsedData.notes,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating patient:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating patient:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create patient",
    };
  }
}

// Get patient by ID
export async function getPatient(id: number) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: patient, error } = await supabase
      .from("patients")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Patient not found" };
      }
      console.error("Error getting patient:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: patient };
  } catch (error) {
    console.error("Error getting patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patient",
    };
  }
}

// Update patient
export async function updatePatient(
  id: number,
  data: Partial<PatientFormValues>
) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Get existing patient data
    const { data: existingPatient, error: getError } = await supabase
      .from("patients")
      .select()
      .eq("id", id)
      .single();

    if (getError) {
      if (getError.code === "PGRST116") {
        return { success: false, error: "Patient not found" };
      }
      console.error("Error getting existing patient:", getError);
      return { success: false, error: getError.message };
    }

    const currentMetadata = existingPatient.metadata || {};

    // Merge updates with existing data
    const updatedMetadata = {
      ...currentMetadata,
      species: data.species ?? currentMetadata.species,
      breed: data.breed ?? currentMetadata.breed,
      owner: {
        ...currentMetadata.owner,
        name: data.ownerName ?? currentMetadata.owner?.name,
        email: data.ownerEmail ?? currentMetadata.owner?.email,
        phone: data.ownerPhone ?? currentMetadata.owner?.phone,
      },
      notes: data.notes ?? currentMetadata.notes,
    };

    // Update patient in database
    const { data: result, error: updateError } = await supabase
      .from("patients")
      .update({
        name: data.name ?? existingPatient.name,
        date_of_birth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString()
          : existingPatient.date_of_birth,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating patient:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating patient:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update patient",
    };
  }
}

// Search patients
export async function searchPatients(searchTerm: string) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (!searchTerm.trim()) {
      return { success: true, data: [] };
    }

    // Using Supabase's text search capabilities
    const { data: patients, error } = await supabase
      .from("patients")
      .select()
      .or(
        `name.ilike.%${searchTerm}%,metadata->species.ilike.%${searchTerm}%,metadata->breed.ilike.%${searchTerm}%,metadata->owner->name.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (error) {
      console.error("Error searching patients:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: patients };
  } catch (error) {
    console.error("Error searching patients:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search patients",
    };
  }
}

// Get all patients with pagination
export async function getPatients(page = 1, limit = 20) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const offset = (page - 1) * limit;

    // Get paginated patients
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select()
      .order("name")
      .range(offset, offset + limit - 1);

    if (patientsError) {
      console.error("Error getting patients:", patientsError);
      return { success: false, error: patientsError.message };
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting patient count:", countError);
      return { success: false, error: countError.message };
    }

    return {
      success: true,
      data: patients,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error getting patients:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patients",
    };
  }
}
