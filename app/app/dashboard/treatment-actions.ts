"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Treatment task schema
const treatmentTaskSchema = z.object({
  caseId: z.number(),
  description: z.string().min(1, "Task description is required"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  assignedTo: z.string().optional(),
  completedAt: z.date().optional(),
});

export type TreatmentTaskFormValues = z.infer<typeof treatmentTaskSchema>;

// Create treatment task
export async function createTreatmentTask(data: TreatmentTaskFormValues) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const parsedData = treatmentTaskSchema.parse(data);

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

    // Insert task into database
    const completedAt =
      parsedData.status === "completed" ? new Date().toISOString() : null;

    const { data: result, error } = await supabase
      .from("treatment_tasks")
      .insert({
        case_id: parsedData.caseId,
        description: parsedData.description,
        status: parsedData.status,
        assigned_to: parsedData.assignedTo || user.id,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating treatment task:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/case/${parsedData.caseId}`);
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create treatment task",
    };
  }
}

// Get treatment task by ID
export async function getTreatmentTask(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: task, error } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Task not found" };
      }
      console.error("Error getting treatment task:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: task };
  } catch (error) {
    console.error("Error getting treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get treatment task",
    };
  }
}

// Update treatment task
export async function updateTreatmentTask(
  id: number,
  data: Partial<TreatmentTaskFormValues>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get existing task
    const { data: existingTask, error: getError } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("id", id)
      .single();

    if (getError) {
      if (getError.code === "PGRST116") {
        return { success: false, error: "Task not found" };
      }
      console.error("Error getting existing task:", getError);
      return { success: false, error: getError.message };
    }

    // Update completed date if status changed to completed
    let completedAt = existingTask.completed_at;
    if (data.status === "completed" && existingTask.status !== "completed") {
      completedAt = new Date().toISOString();
    } else if (data.status && data.status !== "completed") {
      completedAt = null;
    }

    // Update task in database
    const { data: result, error: updateError } = await supabase
      .from("treatment_tasks")
      .update({
        description: data.description ?? existingTask.description,
        status: data.status ?? existingTask.status,
        assigned_to: data.assignedTo ?? existingTask.assigned_to,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating treatment task:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/dashboard/case/${existingTask.case_id}`);
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update treatment task",
    };
  }
}

// Delete treatment task
export async function deleteTreatmentTask(id: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get task to record case ID for path revalidation
    const { data: task, error: getError } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("id", id)
      .single();

    if (getError) {
      if (getError.code === "PGRST116") {
        return { success: false, error: "Task not found" };
      }
      console.error("Error getting task for deletion:", getError);
      return { success: false, error: getError.message };
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from("treatment_tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting treatment task:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath(`/dashboard/case/${task.case_id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete treatment task",
    };
  }
}

// Get treatment tasks by case ID
export async function getTreatmentTasksByCase(caseId: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: tasks, error } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("case_id", caseId)
      .order("created_at");

    if (error) {
      console.error("Error getting treatment tasks:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Error getting treatment tasks:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get treatment tasks",
    };
  }
}

// Get pending treatment tasks for a user
export async function getPendingTreatmentTasks(limit = 10) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: tasks, error } = await supabase
      .from("treatment_tasks")
      .select(
        `
        *,
        cases:case_id (
          name
        )
      `
      )
      .eq("assigned_to", user.id)
      .not("status", "eq", "completed")
      .order("created_at")
      .limit(limit);

    if (error) {
      console.error("Error getting pending treatment tasks:", error);
      return { success: false, error: error.message };
    }

    // Transform the data to match the expected format
    const formattedTasks = tasks.map((task) => ({
      ...task,
      caseName: task.cases?.name || null,
    }));

    return { success: true, data: formattedTasks };
  } catch (error) {
    console.error("Error getting pending treatment tasks:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get pending treatment tasks",
    };
  }
}
