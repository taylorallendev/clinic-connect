"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Differential diagnosis schema
const diagnosisSchema = z.object({
  caseId: z.number(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  approved: z.boolean().default(false),
  notes: z.string().optional(),
});

export type DiagnosisFormValues = z.infer<typeof diagnosisSchema>;

// Create differential diagnosis
export async function createDifferentialDiagnosis(data: DiagnosisFormValues) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const parsedData = diagnosisSchema.parse(data);

    // Check if case exists
    const { data: caseExists, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", parsedData.caseId)
      .limit(1);

    if (caseError) {
      console.error("Error checking if case exists:", caseError);
      return { success: false, error: "Failed to check if case exists" };
    }

    if (!caseExists || caseExists.length === 0) {
      return { success: false, error: "Case not found" };
    }

    // Insert diagnosis into database
    const { data: result, error } = await supabase
      .from("differential_diagnoses")
      .insert({
        case_id: parsedData.caseId,
        diagnosis: parsedData.diagnosis,
        approved: parsedData.approved,
        notes: parsedData.notes || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating differential diagnosis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/case/${parsedData.caseId}`);
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create differential diagnosis",
    };
  }
}

// Get differential diagnosis by ID
export async function getDifferentialDiagnosis(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: diagnosis, error } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("id", id)
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Diagnosis not found" };
      }
      console.error("Error getting differential diagnosis:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: diagnosis };
  } catch (error) {
    console.error("Error getting differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get differential diagnosis",
    };
  }
}

// Update differential diagnosis
export async function updateDifferentialDiagnosis(
  id: number,
  data: Partial<DiagnosisFormValues>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get existing diagnosis
    const { data: existingDiagnosis, error: getError } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("id", id)
      .limit(1)
      .single();

    if (getError) {
      if (getError.code === "PGRST116") {
        return { success: false, error: "Diagnosis not found" };
      }
      console.error("Error getting existing diagnosis:", getError);
      return { success: false, error: getError.message };
    }

    // Update diagnosis in database
    const { data: result, error: updateError } = await supabase
      .from("differential_diagnoses")
      .update({
        diagnosis: data.diagnosis ?? existingDiagnosis.diagnosis,
        approved:
          data.approved !== undefined
            ? data.approved
            : existingDiagnosis.approved,
        notes: data.notes ?? existingDiagnosis.notes,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating differential diagnosis:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/app/dashboard/case/${existingDiagnosis.case_id}`);
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update differential diagnosis",
    };
  }
}

// Delete differential diagnosis
export async function deleteDifferentialDiagnosis(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get diagnosis to record case ID for path revalidation
    const { data: diagnosis, error: getError } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("id", id)
      .limit(1)
      .single();

    if (getError) {
      if (getError.code === "PGRST116") {
        return { success: false, error: "Diagnosis not found" };
      }
      console.error("Error getting diagnosis for deletion:", getError);
      return { success: false, error: getError.message };
    }

    // Delete diagnosis
    const { error: deleteError } = await supabase
      .from("differential_diagnoses")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting differential diagnosis:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath(`/dashboard/case/${diagnosis.case_id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete differential diagnosis",
    };
  }
}

// Get differential diagnoses by case ID
export async function getDifferentialDiagnosesByCase(caseId: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: diagnoses, error } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("case_id", caseId)
      .order("created_at");

    if (error) {
      console.error("Error getting differential diagnoses:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: diagnoses };
  } catch (error) {
    console.error("Error getting differential diagnoses:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get differential diagnoses",
    };
  }
}

// Generate differential diagnoses from transcript using AI
export async function generateDifferentialDiagnoses(
  caseId: number,
  transcript: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if case exists
    const { data: caseExists, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .limit(1);

    if (caseError) {
      console.error("Error checking if case exists:", caseError);
      return { success: false, error: "Failed to check if case exists" };
    }

    if (!caseExists || caseExists.length === 0) {
      return { success: false, error: "Case not found" };
    }

    // This would normally call an AI service to generate diagnoses
    // For now, we'll return some placeholder diagnoses
    const possibleDiagnoses = [
      {
        diagnosis: "Gastroenteritis",
        notes: "Based on symptoms of vomiting and diarrhea",
      },
      {
        diagnosis: "Foreign body ingestion",
        notes: "Consider based on history and patient behavior",
      },
      {
        diagnosis: "Pancreatitis",
        notes: "Consider based on abdominal pain and vomiting",
      },
    ];

    // Insert the diagnoses into the database
    const insertPromises = possibleDiagnoses.map((diagnosis) => {
      return supabase.from("differential_diagnoses").insert({
        case_id: caseId,
        diagnosis: diagnosis.diagnosis,
        approved: false,
        notes: diagnosis.notes,
      });
    });

    await Promise.all(insertPromises);

    revalidatePath(`/dashboard/case/${caseId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Generated ${possibleDiagnoses.length} potential diagnoses`,
    };
  } catch (error) {
    console.error("Error generating differential diagnoses:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate differential diagnoses",
    };
  }
}
