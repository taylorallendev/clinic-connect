"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["soap", "summary", "email", "structured"]),
  content: z.string().min(1, "Content is required"),
  schema: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea"]),
        required: z.boolean().default(false),
        placeholder: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export async function createTemplate(values: TemplateFormValues) {
  console.log("Server action createTemplate called with:", values);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("Create template authorization error: No user");
      return { error: "Unauthorized" };
    }

    const validatedFields = templateFormSchema.parse(values);
    console.log("Validated template fields:", validatedFields);

    // Make sure schema is properly formatted for storage
    let schemaValue = null;
    if (
      validatedFields.schema &&
      Array.isArray(validatedFields.schema) &&
      validatedFields.schema.length > 0
    ) {
      schemaValue = validatedFields.schema;
    }

    const { data: result, error } = await supabase
      .from("templates")
      .insert({
        name: validatedFields.name,
        type: validatedFields.type,
        content: validatedFields.content,
        schema: schemaValue,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return { error: error.message };
    }

    console.log("Template insert result:", result);

    revalidatePath("/app/dashboard/templates");
    return { success: true };
  } catch (error) {
    console.error("Template creation error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    // Show more details about the error
    return {
      error: "Failed to create template. Please try again.",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateTemplate(id: number, values: TemplateFormValues) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const validatedFields = templateFormSchema.parse(values);

    // Make sure schema is properly formatted for storage
    let schemaValue = null;
    if (
      validatedFields.schema &&
      Array.isArray(validatedFields.schema) &&
      validatedFields.schema.length > 0
    ) {
      schemaValue = validatedFields.schema;
    }

    const { error } = await supabase
      .from("templates")
      .update({
        name: validatedFields.name,
        type: validatedFields.type,
        content: validatedFields.content,
        schema: schemaValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Template update error:", error);
      return { error: error.message };
    }

    revalidatePath("/app/dashboard/templates");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update template. Please try again." };
  }
}

export async function deleteTemplate(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

export async function getTemplateById(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
