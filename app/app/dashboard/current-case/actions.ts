"use server";

/**
 * This file contains server actions for managing cases and related content generation in the Clinic Connect application.
 * 
 * Server actions in this file handle:
 * - Case management (create, get, update)
 * - Transcription and SOAP note management
 * - AI-based content generation from templates and transcripts
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTemplateById } from "../template-actions";
import { getCurrentUserId } from "@/app/actions";
import { TablesInsert, Tables, Enums } from "@/database.types";
import { Constants } from "@/database.types";

/**
 * Schema for creating a new case that maps to our database structure
 */
const createCaseSchema = z.object({
  name: z.string().min(1),
  dateTime: z.string().min(1),
  assignedTo: z.string(),
  type: z.enum(
    Constants.public.Enums.CaseType as unknown as [string, ...string[]]
  ),
  status: z
    .enum(Constants.public.Enums.CaseStatus as unknown as [string, ...string[]])
    .default("ongoing"),
  visibility: z
    .enum(
      Constants.public.Enums.CaseVisibility as unknown as [string, ...string[]]
    )
    .default("private"),
});

/**
 * Schema for case actions sent from the client
 */
const caseActionSchema = z.object({
  id: z.string(),
  type: z.enum(["recording", "soap", "unknown"]),
  content: z.object({
    transcript: z.string().optional(),
    soap: z
      .object({
        subjective: z.string(),
        objective: z.string(),
        assessment: z.string(),
        plan: z.string(),
      })
      .optional(),
  }),
  timestamp: z.number(),
});

export type ClientCaseAction = z.infer<typeof caseActionSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

/**
 * Creates a new case with the new schema
 */
export async function createCase(data: CreateCaseInput) {
  try {
    console.log("createCase called with data:", JSON.stringify(data, null, 2));
    console.log("====================== CASE CREATION START ======================");

    // Create Supabase client
    const supabase = await createClient();

    console.log("Supabase client created");

    // First, create the case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        type: data.type as Enums<"CaseType">,
        status: data.status as Enums<"CaseStatus">,
        visibility: data.visibility as Enums<"CaseVisibility">,
        created_at: new Date(data.dateTime).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (caseError) {
      console.error("Failed to create case:", caseError);
      return {
        success: false,
        error: caseError.message,
      };
    }

    console.log(`Created new case with ID: ${newCase.id}`);

    // Then, create the patient
    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        name: data.name,
        owner_name: data.assignedTo,
        case_id: newCase.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (patientError) {
      console.error("Failed to create patient:", patientError);
      // Don't return error here, we still have a valid case
    } else {
      console.log(`Created new patient with ID: ${newPatient.id}`);
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/api/appointments");

    return {
      success: true,
      data: {
        ...newCase,
        patient: newPatient,
      },
    };
  } catch (error) {
    console.error("Failed to create case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create case",
    };
  }
}

/**
 * Schema for SOAP notes (Subjective, Objective, Assessment, Plan)
 */
const soapNotesSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

/**
 * Interface for SOAP notes structure
 */
export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * Generates structured output from transcriptions using AI based on a template
 */
export async function generateContentFromTemplate(
  transcriptions: string | string[],
  templateData: { templateId: string }
) {
  try {
    // Authenticate the user making the request
    const userId = getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Normalize transcriptions to an array
    const transcriptionArray = Array.isArray(transcriptions)
      ? transcriptions
      : [transcriptions];

    // Log for debugging purposes
    console.log(
      `Server received ${transcriptionArray.length} transcripts for template generation`
    );

    // Combine multiple transcriptions with clear separators
    const combinedTranscription = transcriptionArray
      .map((t, i) => `Recording ${i + 1}:\n${t}`)
      .join("\n\n---\n\n");

    // Fetch the template
    const result = await getTemplateById(templateData.templateId);
    if (result.error) {
      throw new Error(result.error);
    }

    // Now we can safely assert that template exists
    const template = result.template!;
    console.log(`Using template: ${template.name} (${template.type})`);

    // Handle different template types
    if (template.type === "structured" && template.schema) {
      // Parse the template schema
      const schema = template.schema;

      // Build a dynamic schema based on the template schema
      const dynamicSchema: Record<string, any> = {};
      schema.forEach((field: { key: string; type: string }) => {
        dynamicSchema[field.key] = z.string();
      });

      // Create a zod schema from the dynamic schema
      const templateSchema = z.object(dynamicSchema);

      // Generate the structured output using the template schema
      const promptPrefix =
        transcriptionArray.length > 1
          ? `Create COMPREHENSIVE structured output from the following ${transcriptionArray.length} transcriptions. 
IMPORTANT: You MUST integrate information from ALL transcriptions to create a complete clinical picture.
Each transcription contains different parts of the patient information.

${combinedTranscription}`
          : `Create structured output from the following transcription: 

${combinedTranscription}`;

      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: templateSchema,
        prompt: `${promptPrefix}
        
Following the template "${
          template.name
        }", format your response as ONLY a valid JSON object with the following structure:
{
  ${schema
    .map(
      (field: { key: string; label: string; description?: string }) =>
        `"${field.key}": "..." ${
          field.description ? `// ${field.description}` : ""
        }`
    )
    .join(",\n  ")}
}
        
Template instructions: ${template.content}

IMPORTANT: If multiple transcriptions were provided, ensure your structured output incorporates information from ALL transcriptions.
        
Do not include any explanatory text, markdown formatting, or code blocks.`,
        system:
          "You are an assistant that creates structured documentation from transcriptions. Your task is to compile comprehensive clinical notes that incorporate ALL information provided across ALL transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
      });

      return {
        success: true,
        content: result.object,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
        },
      };
    }

    // For SOAP templates, use the template content as instructions
    if (template.type === "soap") {
      // Create a more explicit prompt when multiple transcripts are involved
      const promptPrefix =
        transcriptionArray.length > 1
          ? `Create COMPREHENSIVE SOAP notes from the following ${transcriptionArray.length} transcriptions. 
IMPORTANT: You MUST integrate information from ALL transcriptions to create a complete clinical picture.
Each transcription contains different parts of the patient information.

${combinedTranscription}`
          : `Create SOAP notes from the following transcription: 

${combinedTranscription}`;

      const result = await generateObject<SoapNotes>({
        model: openai("gpt-4o"),
        schema: soapNotesSchema,
        prompt: `${promptPrefix}
        
Template instructions: ${template.content}
        
Format your response as ONLY a valid JSON object with the following structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}

IMPORTANT: If multiple transcriptions were provided, ensure your SOAP notes incorporate information from ALL transcriptions.
        
Do not include any explanatory text, markdown formatting, or code blocks.`,
        system:
          "You are a veterinary assistant that creates SOAP notes from transcriptions. Your task is to compile comprehensive clinical notes that incorporate ALL information provided across ALL transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
      });

      return {
        success: true,
        content: result.object,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
        },
      };
    }

    // For summary or free-form templates
    if (template.type === "summary" || template.type === "email") {
      const promptPrefix =
        transcriptionArray.length > 1
          ? `Create content from the following ${transcriptionArray.length} transcriptions based on the template. 
IMPORTANT: You MUST integrate information from ALL transcriptions to create a complete narrative.

${combinedTranscription}`
          : `Create content from the following transcription based on the template: 

${combinedTranscription}`;

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `${promptPrefix}
        
Template: ${template.name}
Template instructions: ${template.content}

IMPORTANT: If multiple transcriptions were provided, ensure your content incorporates information from ALL transcriptions.
        
Create content that follows the template instructions and format. Provide well-formatted markdown.`,
        system:
          "You are a veterinary assistant that creates content from transcriptions according to templates. Your task is to compile comprehensive content that incorporates ALL information provided across ALL transcriptions. Format your output in markdown.",
      });

      return {
        success: true,
        content: text,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
        },
      };
    }

    // Default case - just return an error for unsupported template types
    return {
      success: false,
      error: `Unsupported template type: ${template.type}`,
    };
  } catch (error) {
    console.error("Failed to generate content from template:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate content from template",
    };
  }
}

/**
 * Saves a transcription to the database
 */
export async function saveTranscription(caseId: string, transcript: string) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const transcriptionData: TablesInsert<"transcriptions"> = {
      case_id: caseId,
      transcript: transcript,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newTranscription, error } = await supabase
      .from("transcriptions")
      .insert(transcriptionData)
      .select()
      .single();

    if (error) {
      console.error("Failed to save transcription:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the case page to update the UI
    revalidatePath(`/dashboard/cases/${caseId}`);
    return {
      success: true,
      data: newTranscription as Tables<"transcriptions">,
    };
  } catch (error) {
    console.error("Failed to save transcription:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save transcription",
    };
  }
}

/**
 * Saves SOAP notes to the database
 */
export async function saveSoapNotes(
  caseId: string,
  soapNotes: SoapNotes,
  transcript?: string
) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const soapNoteData: TablesInsert<"soap_notes"> = {
      case_id: caseId,
      subjective: soapNotes.subjective,
      objective: soapNotes.objective,
      assessment: soapNotes.assessment,
      plan: soapNotes.plan,
      transcript: transcript || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newSoapNote, error } = await supabase
      .from("soap_notes")
      .insert(soapNoteData)
      .select()
      .single();

    if (error) {
      console.error("Failed to save SOAP notes:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the case page to update the UI
    revalidatePath(`/dashboard/cases/${caseId}`);
    return {
      success: true,
      data: newSoapNote as Tables<"soap_notes">,
    };
  } catch (error) {
    console.error("Failed to save SOAP notes:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save SOAP notes",
    };
  }
}

/**
 * Saves a generation to the database
 */
export async function saveGeneration(
  caseId: string,
  content: string,
  prompt?: string,
  templateId?: string
) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const generationData: TablesInsert<"generations"> = {
      case_id: caseId,
      content: content,
      prompt: prompt || null,
      template_id: templateId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newGeneration, error } = await supabase
      .from("generations")
      .insert(generationData)
      .select()
      .single();

    if (error) {
      console.error("Failed to save generation:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the case page to update the UI
    revalidatePath(`/dashboard/cases/${caseId}`);
    return {
      success: true,
      data: newGeneration as Tables<"generations">,
    };
  } catch (error) {
    console.error("Failed to save generation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save generation",
    };
  }
}

/**
 * Gets all SOAP notes for a case
 */
export async function getCaseSoapNotes(caseId: string) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { data: soapNotes, error } = await supabase
      .from("soap_notes")
      .select()
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch SOAP notes:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: soapNotes as Tables<"soap_notes">[],
    };
  } catch (error) {
    console.error("Failed to fetch SOAP notes:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch SOAP notes",
    };
  }
}

/**
 * Gets all transcriptions for a case
 */
export async function getCaseTranscriptions(caseId: string) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { data: transcriptions, error } = await supabase
      .from("transcriptions")
      .select()
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch transcriptions:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: transcriptions as Tables<"transcriptions">[],
    };
  } catch (error) {
    console.error("Failed to fetch transcriptions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch transcriptions",
    };
  }
}

/**
 * Gets all generations for a case
 */
export async function getCaseGenerations(caseId: string) {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { data: generations, error } = await supabase
      .from("generations")
      .select()
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch generations:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: generations as Tables<"generations">[],
    };
  } catch (error) {
    console.error("Failed to fetch generations:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch generations",
    };
  }
}

/**
 * Generates SOAP notes from transcriptions using AI based on a template or default format
 */
export async function generateSoapNotes(
  transcriptions: string | string[],
  templateData?: { templateId: string }
) {
  try {
    // If a template ID is provided, use the general content generation function
    if (templateData?.templateId) {
      const result = await generateContentFromTemplate(
        transcriptions,
        templateData
      );
      if (result.success && result.content) {
        // If it's a SOAP template, the content will already be in SOAP format
        if (result.template.type === "soap") {
          return { success: true, soapNotes: result.content };
        }

        // For other template types, we don't support conversion to SOAP
        return {
          success: false,
          error: `Template type '${result.template.type}' is not compatible with SOAP notes generation`,
        };
      }
      return { success: false, error: result.error };
    }

    // Default SOAP notes generation - falling back to original implementation for no template
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Normalize transcriptions to an array
    const transcriptionArray = Array.isArray(transcriptions)
      ? transcriptions
      : [transcriptions];

    // Combine multiple transcriptions with clear separators
    const combinedTranscription = transcriptionArray
      .map((t, i) => `Recording ${i + 1}:\n${t}`)
      .join("\n\n---\n\n");

    console.log("Generating SOAP notes with AI...");

    // Create a more explicit prompt when multiple transcripts are involved
    const promptPrefix =
      transcriptionArray.length > 1
        ? `Create COMPREHENSIVE SOAP notes from the following ${transcriptionArray.length} transcriptions. 
IMPORTANT: You MUST integrate information from ALL transcriptions to create a complete clinical picture.
Each transcription contains different parts of the patient information.

${combinedTranscription}`
        : `Create SOAP notes from the following transcription: 

${combinedTranscription}`;

    const result = await generateObject<SoapNotes>({
      model: openai("gpt-4o"),
      schema: soapNotesSchema,
      prompt: `${promptPrefix}
      
Format your response as ONLY a valid JSON object with the following structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
      
Subjective: Summarize the patient history and owner's description of the problem.
Objective: Document physical examination findings, vital signs, and test results.
Assessment: Provide your clinical assessment and differential diagnoses.
Plan: Outline the treatment plan, medications, and follow-up recommendations.

IMPORTANT: If multiple transcriptions were provided, ensure your SOAP notes incorporate information from ALL transcriptions.
      
Do not include any explanatory text, markdown formatting, or code blocks.`,
      system:
        "You are a veterinary assistant that creates SOAP notes from transcriptions. Your task is to compile comprehensive clinical notes that incorporate ALL information provided across ALL transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
    });

    return { success: true, soapNotes: result.object };
  } catch (error) {
    console.error("Failed to generate SOAP notes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate SOAP notes",
    };
  }
}

/**
 * Saves multiple case actions at once to a case
 */
export async function saveActionsToCase(
  caseId: number,
  actions: ClientCaseAction[]
) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    console.log(
      `Storing ${actions.length} actions in case_actions column for case ${caseId}`
    );

    // Validate all actions against the schema
    const validatedActions = actions.map((action) =>
      caseActionSchema.parse(action)
    );

    // Format actions for storage in the case_actions column
    const formattedActions = validatedActions.map((action) => ({
      id: action.id,
      type: action.type,
      content: {
        transcript: action.content?.transcript || "",
        soap: action.content?.soap,
      },
      timestamp: action.timestamp,
    }));

    // Update the case with all actions at once
    const { error } = await supabase
      .from("cases")
      .update({
        case_actions: formattedActions,
      })
      .eq("id", caseId);

    if (error) {
      console.error("Failed to save case actions:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(
      `Successfully stored ${formattedActions.length} actions in case_actions column`
    );

    // Revalidate the case page to update the UI
    revalidatePath(`/dashboard/cases/${caseId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to save case actions:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save case actions",
    };
  }
}

/**
 * Schema for updating an existing case
 */
const updateCaseSchema = createCaseSchema.extend({
  id: z.number(),
  actions: z.array(caseActionSchema).optional(),
});

/**
 * Updates an existing case with new information
 */
export async function updateCase(data: z.infer<typeof updateCaseSchema>) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate input data against the schema
    const parsedData = updateCaseSchema.parse(data);

    // First, check if the name has changed
    const { data: currentCase, error: getCurrentError } = await supabase
      .from("cases")
      .select("name, patientId")
      .eq("id", parsedData.id)
      .single();

    if (getCurrentError) {
      console.error("Failed to get current case:", getCurrentError);
      return {
        success: false,
        error: getCurrentError.message,
      };
    }

    // Only update patient if the name has changed
    let patientId = currentCase.patientId;

    if (currentCase.name !== parsedData.name) {
      // Use the case name directly as the patient name
      const patientName = parsedData.name;
      console.log(`Updating patient name to: ${patientName}`);

      // Check if a patient with this name already exists
      const { data: existingPatients, error: patientSearchError } =
        await supabase
          .from("patients")
          .select("id, name")
          .ilike("name", patientName);

      if (patientSearchError) {
        console.error("Error searching for patient:", patientSearchError);
      }

      // If patient doesn't exist, create one
      if (!existingPatients || existingPatients.length === 0) {
        console.log(`Creating new patient during case update: ${patientName}`);

        // Create default patient data
        const patientData = {
          name: patientName,
          dateOfBirth: new Date().toISOString().split("T")[0], // Today as default
          ownerName: "Unknown Owner", // Default owner name
          species: "Unknown", // Default species
          breed: "Unknown", // Default breed
        };

        // Insert the patient into the database
        const { data: newPatient, error: newPatientError } = await supabase
          .from("patients")
          .insert({
            name: patientData.name,
            // Include dateOfBirth which is required
            dateOfBirth: new Date().toISOString().split("T")[0],
            // Only include metadata if needed
            metadata: JSON.stringify({
              species: patientData.species,
              breed: patientData.breed,
              owner: {
                name: patientData.ownerName,
              },
            }),
          })
          .select()
          .single();

        if (newPatientError) {
          console.error(
            "Failed to create patient during case update:",
            newPatientError
          );
        } else if (newPatient) {
          patientId = newPatient.id;
          console.log(`Created new patient with ID: ${patientId}`);
        }
      } else {
        // Use existing patient
        patientId = existingPatients[0].id;
        console.log(`Using existing patient with ID: ${patientId}`);
      }
    }

    // Check the column names in the cases table to determine the correct patient ID column name
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from("cases")
      .select("*")
      .limit(1);

    // Determine if we should use patient_id (snake_case) or patientId (camelCase)
    const columnName =
      tableInfo &&
      tableInfo.length > 0 &&
      Object.keys(tableInfo[0]).includes("patient_id")
        ? "patient_id"
        : "patientId";

    console.log(
      `Using column name '${columnName}' for patient reference during update`
    );

    // Create base update data
    const updateData: any = {
      name: parsedData.name,
      dateTime: new Date(parsedData.dateTime).toISOString(),
      visibility: parsedData.visibility,
      type: parsedData.type,
      status: parsedData.status || "ongoing",
    };

    // Set the patient ID using the dynamically determined column name
    if (patientId) {
      updateData[columnName] = patientId;
    }

    console.log(
      "Updating case with data:",
      JSON.stringify(updateData, null, 2)
    );

    // Update the case with the potentially new patient ID
    const { data: updatedCase, error: caseError } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", parsedData.id)
      .select()
      .single();

    if (caseError) {
      console.error("Failed to update case:", caseError);
      return {
        success: false,
        error: caseError.message,
      };
    }

    // Handle case actions - if actions are provided in the update data, save them as well
    if (parsedData.actions && parsedData.actions.length > 0) {
      console.log(`Updating ${parsedData.actions.length} case actions`);

      try {
        // Format actions for storage in the case_actions column
        const formattedActions = parsedData.actions.map((action) => ({
          id: action.id,
          type: action.type,
          content: {
            transcript: action.content?.transcript || "",
            soap: action.content?.soap,
          },
          timestamp: action.timestamp,
        }));

        // Update the case with the actions
        const { error: updateError } = await supabase
          .from("cases")
          .update({
            case_actions: formattedActions,
          })
          .eq("id", parsedData.id);

        if (updateError) {
          console.error(
            "Error storing case actions during update:",
            updateError
          );
        } else {
          console.log(
            `Successfully stored ${formattedActions.length} actions in case_actions column`
          );
        }
      } catch (actionError) {
        console.error("Error storing case actions during update:", actionError);
      }
    }

    // Revalidate paths to update the UI
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/api/appointments");
    revalidatePath(`/dashboard/current-case/${parsedData.id}`);

    // Return success and the updated case
    return { success: true, data: updatedCase };
  } catch (error) {
    console.error("Failed to update case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update case",
    };
  }
}

/**
 * Retrieves a single case by ID
 */
export async function getCase(caseId: number) {
  try {
    console.log(`getCase called with ID: ${caseId}`);

    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch the case from the database
    console.log(`Fetching case with ID: ${caseId}`);
    const { data: caseData, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error) {
      console.error("Failed to fetch case:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!caseData) {
      console.log(`No case found with ID: ${caseId}`);
      return {
        success: false,
        error: "Case not found",
      };
    }

    console.log("Case found:", caseData);

    // Build a response based on available fields
    const responseData: any = {
      id: caseData.id,
      name: caseData.name,
    };

    // Add other fields only if they exist
    if (caseData.dateTime) responseData.dateTime = caseData.dateTime;
    if (caseData.visibility) responseData.visibility = caseData.visibility;
    if (caseData.type) responseData.type = caseData.type;

    // Include case actions if available
    if (caseData.case_actions) {
      console.log(
        `Found ${caseData.case_actions.length} actions in case_actions column`
      );
      responseData.actions = caseData.case_actions;
    } else {
      console.log("No actions found in case_actions column");
      responseData.actions = [];
    }

    // Handle assignedTo with different possible field names
    if (caseData.assignedTo) responseData.assignedTo = caseData.assignedTo;
    else if (caseData.assigned_to)
      responseData.assignedTo = caseData.assigned_to;
    else responseData.assignedTo = "";

    // Return success and the case data
    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error("Failed to fetch case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch case",
    };
  }
}