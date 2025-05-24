"use server";

/**
 * Template management server actions
 * Handles creating, reading, updating, and deleting templates
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../common/auth";
import { Tables, TablesInsert, TablesUpdate } from "@/database.types";
import { TemplateInsert, TemplateUpdate } from "../types";
import { EMAIL_CONFIG } from "@/lib/email";

/**
 * Get all templates
 */
export async function getTemplates() {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get all templates
    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      templates: templates as Tables<"templates">[],
    };
  } catch (error) {
    console.error("Failed to get templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get templates",
    };
  }
}

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get all email templates
    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from("templates")
      .select("*")
      .eq("type", "email")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      templates: templates as Tables<"templates">[],
    };
  } catch (error) {
    console.error("Failed to get email templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get email templates",
    };
  }
}

/**
 * Get a template by ID
 */
export async function getTemplateById(templateId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the template
    const supabase = await createClient();
    const { data: template, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      template: template as Tables<"templates">,
    };
  } catch (error) {
    console.error("Failed to get template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get template",
    };
  }
}

/**
 * Create a new template
 */
export async function createTemplate(templateData: TemplateInsert) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Create the template with typed data
    const supabase = await createClient();
    const insertData: TablesInsert<"templates"> = {
      name: templateData.name,
      type: templateData.type,
      content: templateData.content || null,
      prompt: templateData.prompt,
      model: templateData.model || "gpt-4",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      key: templateData.key || null,
      description: templateData.description || null,
    };

    const { data: template, error } = await supabase
      .from("templates")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath("/dashboard/templates");

    return {
      success: true,
      template: template as Tables<"templates">,
    };
  } catch (error) {
    console.error("Failed to create template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  templateData: TemplateUpdate
) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Create update object with only the fields that were provided
    const updateData: TablesUpdate<"templates"> = {
      updated_at: new Date().toISOString(),
    };

    if (templateData.name) updateData.name = templateData.name;
    if (templateData.type) updateData.type = templateData.type;
    if (templateData.content !== undefined) updateData.content = templateData.content;
    if (templateData.prompt) updateData.prompt = templateData.prompt;
    if (templateData.model) updateData.model = templateData.model;
    if (templateData.key) updateData.key = templateData.key;
    if (templateData.description) updateData.description = templateData.description;

    // Update the template
    const supabase = await createClient();
    const { data: template, error } = await supabase
      .from("templates")
      .update(updateData)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath("/dashboard/templates");

    return {
      success: true,
      template: template as Tables<"templates">,
    };
  } catch (error) {
    console.error("Failed to update template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Delete the template
    const supabase = await createClient();
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath("/dashboard/templates");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete template",
    };
  }
}

/**
 * Ensure default templates exist
 * This will create default templates if they don't exist yet
 */
export async function ensureDefaultTemplates() {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Create default templates if they don't exist yet
    // This is a placeholder - actual implementation would create default templates
    // based on the application's needs
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to ensure default templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ensure default templates",
    };
  }
}