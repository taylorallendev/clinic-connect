"use server";

// These actions are no longer needed with Clerk as it handles this UI automatically
// This file is kept for reference and for any custom server actions that may be needed
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tables, TablesInsert, TablesUpdate, Database } from "@/database.types";

// These functions are no longer used with Clerk
// Clerk handles sign up, sign in, and password reset through its UI components

/**
 * Gets the current user ID from the session
 * @returns The user ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Gets all cases with optional pagination
 */
export async function getCases(page = 1, limit = 10) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const {
      data: cases,
      error,
      count,
    } = await supabase
      .from("cases")
      .select("*", { count: "exact" })
      .range(start, end)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: cases as Tables<"cases">[],
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
      error: error instanceof Error ? error.message : "Failed to fetch cases",
    };
  }
}

/**
 * Gets a specific case by ID with all related data
 */
export async function getCaseWithDetails(caseId: string) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Get case with related data
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select(
        `
        *,
        patients (*),
        soap_notes (*),
        generations (*),
        transcriptions (*)
      `
      )
      .eq("id", caseId)
      .single();

    if (caseError) {
      return { success: false, error: caseError.message };
    }

    return {
      success: true,
      data: caseData as Tables<"cases"> & {
        patients: Tables<"patients">[];
        soap_notes: Tables<"soap_notes">[];
        generations: Tables<"generations">[];
        transcriptions: Tables<"transcriptions">[];
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch case details",
    };
  }
}

/**
 * Creates a new SOAP note for a case
 */
export async function createSoapNote(data: {
  case_id: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  transcript?: string;
}) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const soapNoteData: TablesInsert<"soap_notes"> = {
      case_id: data.case_id,
      subjective: data.subjective || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || null,
      transcript: data.transcript || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: soapNote, error } = await supabase
      .from("soap_notes")
      .insert(soapNoteData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: soapNote as Tables<"soap_notes">,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create SOAP note",
    };
  }
}

/**
 * Creates a new generation for a case
 */
export async function createGeneration(data: {
  case_id: string;
  template_id?: string;
  prompt?: string;
  content?: string;
}) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const generationData: TablesInsert<"generations"> = {
      case_id: data.case_id,
      template_id: data.template_id || null,
      prompt: data.prompt || null,
      content: data.content || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: generation, error } = await supabase
      .from("generations")
      .insert(generationData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: generation as Tables<"generations">,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create generation",
    };
  }
}

/**
 * Creates a new transcription for a case
 */
export async function createTranscription(data: {
  case_id: string;
  transcript: string;
}) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const transcriptionData: TablesInsert<"transcriptions"> = {
      case_id: data.case_id,
      transcript: data.transcript,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: transcription, error } = await supabase
      .from("transcriptions")
      .insert(transcriptionData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: transcription as Tables<"transcriptions">,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create transcription",
    };
  }
}

/**
 * Updates a case's status
 */
export async function updateCaseStatus(
  caseId: string,
  status: Database["public"]["Enums"]["CaseStatus"]
) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: TablesUpdate<"cases"> = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedCase, error } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", caseId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: updatedCase as Tables<"cases">,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update case status",
    };
  }
}

/**
 * Updates a case's visibility
 */
export async function updateCaseVisibility(
  caseId: string,
  visibility: Database["public"]["Enums"]["CaseVisibility"]
) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: TablesUpdate<"cases"> = {
      visibility,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedCase, error } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", caseId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: updatedCase as Tables<"cases">,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update case visibility",
    };
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/sign-in?${searchParams.toString()}`);
  }

  redirect("/app/dashboard/current-case");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/sign-up?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Check your email for the confirmation link");
  return redirect(`/sign-up?${searchParams.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/forgot-password?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Check your email for the password reset link");
  return redirect(`/forgot-password?${searchParams.toString()}`);
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", error.message);
    return redirect(`/reset-password?${searchParams.toString()}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("message", "Password updated successfully");
  return redirect(`/sign-in?${searchParams.toString()}`);
}
