"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/app/actions";

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["soap", "summary", "email", "structured"]),
  content: z.string().min(1, "Content is required"),
  prompt: z.string().optional(),
  model: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export async function createTemplate(values: TemplateFormValues) {
  console.log("Server action createTemplate called with:", values);

  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      console.error("Create template authorization error: No user");
      return { error: "Unauthorized" };
    }

    const validatedFields = templateFormSchema.parse(values);
    console.log("Validated template fields:", validatedFields);

    const { data: result, error } = await supabase
      .from("templates")
      .insert({
        name: validatedFields.name,
        type: validatedFields.type,
        content: validatedFields.content,
        prompt: validatedFields.prompt || null,
        model: validatedFields.model || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return { error: error.message };
    }

    console.log("Template insert result:", result);

    revalidatePath("/app/dashboard/templates");
    return { success: true, template: result };
  } catch (error) {
    console.error("Template creation error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return {
      error: "Failed to create template. Please try again.",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateTemplate(id: string, values: TemplateFormValues) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const validatedFields = templateFormSchema.parse(values);

    const { data, error } = await supabase
      .from("templates")
      .update({
        name: validatedFields.name,
        type: validatedFields.type,
        content: validatedFields.content,
        prompt: validatedFields.prompt || null,
        model: validatedFields.model || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Template update error:", error);
      return { error: error.message };
    }

    revalidatePath("/app/dashboard/templates");
    return { success: true, template: data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update template. Please try again." };
  }
}

export async function deleteTemplate(id: string) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("templates").delete().eq("id", id);

    if (error) {
      console.error("Template deletion error:", error);
      return { error: error.message };
    }

    revalidatePath("/app/dashboard/templates");
    return { success: true };
  } catch (error) {
    console.error("Template deletion error:", error);
    return { error: "Failed to delete template. Please try again." };
  }
}

export async function getTemplates(type?: string) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    let query = supabase.from("templates").select();

    // Add filter condition if type is provided
    if (type) {
      query = query.eq("type", type);
    }

    // Execute the query with ordering
    const { data: templates, error } = await query.order("created_at");

    if (error) {
      console.error("Template fetch error:", error);
      return { error: error.message };
    }

    return { templates };
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return { error: "Failed to fetch templates." };
  }
}

export async function getTemplateById(id: string) {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const { data: template, error } = await supabase
      .from("templates")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { error: "Template not found" };
      }
      console.error("Template fetch error:", error);
      return { error: error.message };
    }

    return { template };
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return { error: "Failed to fetch template." };
  }
}

export type Template = {
  id: string;
  name: string;
  type: string;
  content: string;
  prompt?: string;
  model?: string;
  created_at: string;
  updated_at?: string;
};

export async function getEmailTemplates() {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" } as const;
    }

    const { data: templates, error } = await supabase
      .from("templates")
      .select()
      .order("name", { ascending: true });

    if (error) {
      console.error("Email template fetch error:", error);
      return { error: error.message } as const;
    }

    return {
      templates: templates as Template[],
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch email templates:", error);
    return {
      templates: null,
      error: "Failed to fetch email templates.",
    };
  }
}

/**
 * Adds default SOAP template to the database if it doesn't exist
 * This ensures that there's always a SOAP template available
 */
export async function ensureDefaultTemplates() {
  try {
    const userId = getCurrentUserId();
    const supabase = await createClient();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Check if SOAP template already exists
    const { data: existingTemplates, error: checkError } = await supabase
      .from("templates")
      .select("id")
      .eq("type", "soap")
      .limit(1);

    if (checkError) {
      console.error("Error checking for SOAP template:", checkError);
      return { error: checkError.message };
    }

    // If no SOAP template exists, create one
    if (!existingTemplates || existingTemplates.length === 0) {
      const { data: newTemplate, error: createError } = await supabase
        .from("templates")
        .insert({
          name: "SOAP Notes",
          type: "soap",
          content: `Generate comprehensive SOAP notes from the provided transcriptions.

Subjective: Summarize the patient history and owner's description of the problem.
Objective: Document physical examination findings, vital signs, and test results.
Assessment: Provide clinical assessment and differential diagnoses.
Plan: Outline the treatment plan, medications, and follow-up recommendations.`,
          prompt:
            "Generate SOAP notes from the following veterinary consultation transcript:",
          model: "gpt-4o",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating SOAP template:", createError);
        return { error: createError.message };
      }

      console.log("Created default SOAP template:", newTemplate);
      return { success: true, template: newTemplate };
    }

    return { success: true, message: "SOAP template already exists" };
  } catch (error) {
    console.error("Error ensuring default templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
