"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/app/actions";
import { Tables, TablesInsert } from "@/database.types";

// Define type for the metadata structure
interface PatientMetadata {
  species?: string;
  breed?: string;
  owner?: {
    name: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
}

// Patient Schema with metadata
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

// Type-safe patient row type
type PatientRow = Tables<"patients">;
type PatientInsert = TablesInsert<"patients">;

// Create patient with type safety
export async function createPatient(
  data: PatientFormValues
): Promise<{ success: boolean; error?: string; data?: PatientRow }> {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const parsedData = patientSchema.parse(data);

    const patientData: PatientInsert = {
      name: parsedData.name,
      owner_name: parsedData.ownerName,
      // Add other fields according to your database schema
    };

    const { data: result, error } = await supabase
      .from("patients")
      .insert(patientData)
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

// Get patient by ID with type safety
export async function getPatient(
  id: string
): Promise<{ success: boolean; error?: string; data?: PatientRow }> {
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
      return { success: false, error: error.message };
    }

    return { success: true, data: patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patient",
    };
  }
}

// Update patient with type safety
export async function updatePatient(
  id: string,
  data: Partial<PatientFormValues>
): Promise<{ success: boolean; error?: string; data?: PatientRow }> {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: Partial<PatientInsert> = {
      name: data.name,
      owner_name: data.ownerName,
      updated_at: new Date().toISOString(),
      // Add other fields according to your database schema
    };

    const { data: result, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update patient",
    };
  }
}

// Search patients with type safety
export async function searchPatients(
  searchTerm: string
): Promise<{ success: boolean; error?: string; data?: PatientRow[] }> {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (!searchTerm.trim()) {
      return { success: true, data: [] };
    }

    const { data: patients, error } = await supabase
      .from("patients")
      .select()
      .or(`name.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: patients };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search patients",
    };
  }
}

// Get all patients with pagination and type safety
interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPatients(
  page = 1,
  limit = 20
): Promise<{
  success: boolean;
  error?: string;
  data?: PatientRow[];
  pagination?: PaginationResult;
}> {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const offset = (page - 1) * limit;

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select()
      .order("name")
      .range(offset, offset + limit - 1);

    if (patientsError) {
      return { success: false, error: patientsError.message };
    }

    const { count, error: countError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    if (countError) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patients",
    };
  }
}
