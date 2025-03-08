"use server";

/**
 * This file contains server actions for managing cases, patients, and related features
 * in the Clinic Connect application.
 *
 * Server actions in this file handle:
 * - Case management (create, get, update)
 * - Case action management (recordings, SOAP notes)
 * - SOAP note generation with AI
 * - Patient management
 * - Differential diagnoses
 * - Treatment plan management
 * - Dashboard metrics and analytics
 *
 * @module app/dashboard/actions
 * @author Clinic Connect Team
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTemplateById } from "../template-actions";

/**
 * Schema for creating a new case
 *
 * @property {string} name - Name of the case (required)
 * @property {string} dateTime - Date and time of the case (required, ISO format string)
 * @property {string} assignedTo - ID of the user the case is assigned to
 * @property {enum} visibility - Whether the case is public or private
 * @property {enum} type - The type of case (checkup, emergency, surgery, follow_up)
 */
const createCaseSchema = z.object({
  name: z.string().min(1),
  dateTime: z.string().min(1),
  assignedTo: z.string(),
  visibility: z.enum(["public", "private"]),
  type: z.enum(["checkup", "emergency", "surgery", "follow_up"]),
});

/**
 * Schema for case actions sent from the client
 *
 * @property {string} id - Unique identifier for the action
 * @property {enum} type - Type of action (recording or soap)
 * @property {object} content - Content of the action
 * @property {string} content.transcript - Transcript text (optional)
 * @property {object} content.soap - SOAP notes (optional)
 * @property {number} timestamp - Unix timestamp when the action was created
 */
const caseActionSchema = z.object({
  id: z.string(),
  type: z.enum(["recording", "soap"]),
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

/**
 * Extended schema for creating a case with associated actions
 *
 * @property {array} actions - Array of case actions (optional)
 */
const createCaseWithActionsSchema = createCaseSchema.extend({
  actions: z.array(caseActionSchema).optional(),
});

/**
 * Creates a new case with optional associated actions
 *
 * This function creates a new veterinary case and optionally adds associated actions
 * like recordings or SOAP notes. It uses a database transaction to ensure data integrity.
 *
 * @param {object} data - Case data including name, date/time, assigned user, visibility, type and optional actions
 * @returns {Promise<object>} Object with success status and either the created case data or error message
 *
 * @example
 * // Create a basic case
 * const result = await createCase({
 *   name: "Routine checkup - Max",
 *   dateTime: "2025-03-15T14:30:00",
 *   assignedTo: "user_123",
 *   visibility: "private",
 *   type: "checkup"
 * });
 *
 * @example
 * // Create a case with an associated recording action
 * const result = await createCase({
 *   name: "Emergency visit - Bella",
 *   dateTime: "2025-03-15T14:30:00",
 *   assignedTo: "user_123",
 *   visibility: "private",
 *   type: "emergency",
 *   actions: [{
 *     id: "action-123",
 *     type: "recording",
 *     content: { transcript: "Patient presented with vomiting..." },
 *     timestamp: Date.now()
 *   }]
 * });
 */
export async function createCase(
  data: z.infer<typeof createCaseWithActionsSchema>
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

    // Validate input data against the schema
    const parsedData = createCaseWithActionsSchema.parse(data);

    // Create the case first
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        name: parsedData.name,
        date_time: new Date(parsedData.dateTime).toISOString(),
        assigned_to_id: user.id,
        visibility: parsedData.visibility,
        type: parsedData.type,
        status: "draft",
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

    const caseId = newCase.id;
    console.log("Created case with ID:", caseId);

    // If there are case actions, insert them one by one with error handling
    if (parsedData.actions && parsedData.actions.length > 0) {
      console.log(`Attempting to insert ${parsedData.actions.length} actions`);

      for (const action of parsedData.actions) {
        try {
          // Format the action data for database insertion
          const { error: actionError } = await supabase
            .from("case_actions")
            .insert({
              case_id: caseId,
              type: action.type,
              content: action.content.transcript || "",
              metadata: {
                soap: action.content.soap,
                clientId: action.id,
                timestamp: action.timestamp,
              },
              performed_by: user.id,
            });

          if (actionError) {
            console.error("Error inserting action:", actionError);
          } else {
            console.log(`Successfully inserted action of type ${action.type}`);
          }
        } catch (actionError) {
          console.error("Error inserting action:", actionError);
          // Allow the process to continue even if one action fails
        }
      }
    }

    // Revalidate the dashboard path to update the UI
    revalidatePath("/dashboard");

    // Return success and the newly created case
    return { success: true, data: newCase };
  } catch (error) {
    console.error("Failed to create case:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create case",
    };
  }
}

/**
 * Saves a single case action for an existing case
 *
 * This function adds a new action (like a recording or SOAP notes) to an existing case.
 * Actions are the primary way of recording clinical information within cases.
 *
 * @param {number} caseId - The ID of the case to add the action to
 * @param {ClientCaseAction} action - The action data to save
 * @returns {Promise<object>} Object with success status and optional error message
 *
 * @example
 * // Add a recording action to case with ID 123
 * const result = await saveCaseAction(123, {
 *   id: "action-456",
 *   type: "recording",
 *   content: { transcript: "Patient presented with vomiting..." },
 *   timestamp: Date.now()
 * });
 */
export async function saveCaseAction(caseId: number, action: ClientCaseAction) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate the action data against the schema
    const parsedAction = caseActionSchema.parse(action);

    // Insert the action into the database
    const { error } = await supabase.from("case_actions").insert({
      case_id: caseId,
      type: parsedAction.type,
      content: parsedAction.content.transcript || "",
      metadata: {
        soap: parsedAction.content.soap,
        clientId: parsedAction.id,
        timestamp: parsedAction.timestamp,
      },
      performed_by: user.id,
    });

    if (error) {
      console.error("Failed to save case action:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the case page to update the UI
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save case action:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save case action",
    };
  }
}

/**
 * Schema for SOAP notes (Subjective, Objective, Assessment, Plan)
 *
 * This schema defines the structure of SOAP notes used in veterinary medicine
 * to document patient encounters in a structured format.
 */
const soapNotesSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

/**
 * Interface for SOAP notes structure
 *
 * @property {string} subjective - Patient history and subjective information provided by the owner
 * @property {string} objective - Objective findings from physical examination and tests
 * @property {string} assessment - Clinical assessment and differential diagnoses
 * @property {string} plan - Treatment plan and follow-up recommendations
 */
export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * Generates structured output from transcriptions using AI based on a template
 *
 * This function uses OpenAI's GPT-4o model to analyze one or more transcriptions and generate
 * structured output according to the provided template. The output format is determined
 * by the template's schema.
 *
 * @param {string|string[]} transcriptions - The text transcription(s) to analyze
 * @param {object} templateData - Optional template data for structured output
 * @param {string} templateData.templateId - ID of the template to use
 * @returns {Promise<object>} Object with success status and either the generated structured output or error message
 *
 * @example
 * // Generate notes using default SOAP template with a single transcription
 * const result = await generateSoapNotes("The owner reports their dog has been vomiting for 2 days...");
 *
 * @example
 * // Generate notes using default SOAP template with multiple transcriptions
 * const result = await generateSoapNotes([
 *   "The owner reports their dog has been vomiting for 2 days...",
 *   "Physical examination shows mild dehydration and abdominal tenderness..."
 * ]);
 *
 * @example
 * // Generate notes using a specific template
 * const result = await generateSoapNotes(
 *   "The owner reports their dog has been vomiting for 2 days...",
 *   { templateId: 123 }
 * );
 */
export async function generateSoapNotes(
  transcriptions: string | string[],
  templateData?: { templateId: number }
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

    // Normalize transcriptions to an array
    const transcriptionArray = Array.isArray(transcriptions)
      ? transcriptions
      : [transcriptions];

    // Combine multiple transcriptions with clear separators
    const combinedTranscription = transcriptionArray
      .map((t, i) => `Recording ${i + 1}:\n${t}`)
      .join("\n\n---\n\n");

    // If a template ID is provided, fetch the template
    if (templateData?.templateId) {
      const result = await getTemplateById(templateData.templateId);
      if (result.error) {
        throw new Error(result.error);
      }

      // Now we can safely assert that template exists
      const template = result.template!;

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
        const result = await generateObject({
          model: openai("gpt-4o"),
          schema: templateSchema,
          prompt: `Create structured output from the following transcription(s): 

${combinedTranscription}
          
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
          
Do not include any explanatory text, markdown formatting, or code blocks.`,
          system:
            "You are an assistant that creates structured documentation from transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
        });

        return { success: true, soapNotes: result.object };
      }

      // For SOAP templates, use the template content as instructions
      if (template.type === "soap") {
        const result = await generateObject<SoapNotes>({
          model: openai("gpt-4o"),
          schema: soapNotesSchema,
          prompt: `Create SOAP notes from the following transcription(s): 

${combinedTranscription}
          
Template instructions: ${template.content}
          
Format your response as ONLY a valid JSON object with the following structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
          
Do not include any explanatory text, markdown formatting, or code blocks.`,
          system:
            "You are a veterinary assistant that creates SOAP notes from transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
        });

        return { success: true, soapNotes: result.object };
      }
    }

    // Default to SOAP notes if no template or template type not handled
    const result = await generateObject<SoapNotes>({
      model: openai("gpt-4o"),
      schema: soapNotesSchema,
      prompt: `Create SOAP notes from the following transcription(s): 

${combinedTranscription}
      
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
      
Do not include any explanatory text, markdown formatting, or code blocks.`,
      system:
        "You are a veterinary assistant that creates SOAP notes from transcriptions. Format each section in markdown, but ensure your ENTIRE response is a valid JSON object that can be parsed with JSON.parse().",
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
 * Retrieves all actions for a specific case
 *
 * This function gets all actions (recordings, SOAP notes) associated with a case
 * and transforms them from the database format to a client-friendly structure.
 *
 * @param {number} caseId - The ID of the case to retrieve actions for
 * @returns {Promise<Array>} Array of case actions in client-friendly format
 * @throws {Error} If authentication fails or database query fails
 *
 * @example
 * try {
 *   const actions = await getCaseActions(123);
 *   // Process and display actions
 * } catch (error) {
 *   console.error("Failed to load case actions:", error);
 * }
 */
export async function getCaseActions(caseId: number) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Fetch all actions for this case, ordered by when they were performed
    const { data: actions, error } = await supabase
      .from("case_actions")
      .select()
      .eq("case_id", caseId)
      .order("performed_at");

    if (error) {
      console.error("Failed to fetch case actions:", error);
      throw error;
    }

    // Transform the database records to match the frontend structure
    return actions.map((action) => {
      const metadata = action.metadata || {};

      return {
        id: metadata.clientId || `server-${action.id}`,
        type: action.type,
        content: {
          transcript: action.content,
          soap: metadata.soap,
        },
        timestamp:
          metadata.timestamp ||
          new Date(action.performed_at).getTime() ||
          Date.now(),
        dbId: action.id, // Keep the database ID for reference
      };
    });
  } catch (error) {
    console.error("Failed to fetch case actions:", error);
    throw error;
  }
}

/**
 * Saves multiple case actions at once to a case
 *
 * This function saves an array of actions to a case using a database transaction
 * to ensure all actions are saved successfully or none are saved.
 *
 * @param {number} caseId - The ID of the case to add actions to
 * @param {Array<ClientCaseAction>} actions - Array of case actions to save
 * @returns {Promise<object>} Object with success status and optional error message
 *
 * @example
 * const result = await saveActionsToCase(123, [
 *   {
 *     id: "action-1",
 *     type: "recording",
 *     content: { transcript: "Patient history..." },
 *     timestamp: Date.now()
 *   },
 *   {
 *     id: "action-2",
 *     type: "soap",
 *     content: {
 *       transcript: "Patient history...",
 *       soap: {
 *         subjective: "Owner reports...",
 *         objective: "Physical exam...",
 *         assessment: "Likely diagnosis...",
 *         plan: "Treatment includes..."
 *       }
 *     },
 *     timestamp: Date.now()
 *   }
 * ]);
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

    // Create a promise for each action to insert
    const actionPromises = actions.map((action) => {
      // Validate the action data
      const parsedAction = caseActionSchema.parse(action);

      return supabase.from("case_actions").insert({
        case_id: caseId,
        type: parsedAction.type,
        content: parsedAction.content.transcript || "",
        metadata: {
          soap: parsedAction.content.soap,
          clientId: parsedAction.id,
          timestamp: parsedAction.timestamp,
        },
        performed_by: user.id,
      });
    });

    // Execute all inserts in parallel
    const results = await Promise.all(actionPromises);

    // Check if any inserts failed
    const errors = results
      .filter((result) => result.error)
      .map((result) => result.error);
    if (errors.length > 0) {
      console.error("Some case actions failed to save:", errors);
      return {
        success: false,
        error: "Some actions failed to save",
        details: errors,
      };
    }

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
 * Patient Management Functions
 *
 * These functions handle creating, retrieving, updating and searching for patients
 * in the veterinary clinic system.
 */

/**
 * Schema for creating and updating patients
 *
 * @property {string} name - Patient name (required)
 * @property {string} species - Animal species (optional)
 * @property {string} breed - Animal breed (optional)
 * @property {string} dateOfBirth - Date of birth in ISO format (required)
 * @property {string} ownerName - Name of the pet owner (required)
 * @property {string} ownerEmail - Email address of the owner (optional, must be valid email)
 * @property {string} ownerPhone - Phone number of the owner (optional)
 */
const createPatientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  species: z.string().optional(),
  breed: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerEmail: z.string().email("Invalid email address").optional(),
  ownerPhone: z.string().optional(),
});

export type PatientData = z.infer<typeof createPatientSchema>;

/**
 * Creates a new patient record
 *
 * This function creates a new patient with basic information and owner details.
 * Additional data like species and breed are stored in the metadata JSON field.
 *
 * @param {PatientData} data - The patient data to save
 * @returns {Promise<object>} Object with success status and either the created patient data or error message
 *
 * @example
 * const result = await createPatient({
 *   name: "Max",
 *   species: "Dog",
 *   breed: "Golden Retriever",
 *   dateOfBirth: "2019-05-10",
 *   ownerName: "John Smith",
 *   ownerEmail: "john@example.com",
 *   ownerPhone: "555-123-4567"
 * });
 */
export async function createPatient(data: PatientData) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate the patient data
    const parsedData = createPatientSchema.parse(data);

    // Insert the patient into the database
    const { data: newPatient, error } = await supabase
      .from("patients")
      .insert({
        name: parsedData.name,
        date_of_birth: new Date(parsedData.dateOfBirth).toISOString(),
        metadata: JSON.stringify({
          species: parsedData.species,
          breed: parsedData.breed,
          owner: {
            name: parsedData.ownerName,
            email: parsedData.ownerEmail,
            phone: parsedData.ownerPhone,
          },
        }),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create patient:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Revalidate the dashboard to update the UI
    revalidatePath("/dashboard");
    return { success: true, data: newPatient };
  } catch (error) {
    console.error("Failed to create patient:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create patient",
    };
  }
}

/**
 * Searches for patients by name
 *
 * This function performs a case-insensitive search for patients by their name.
 * Results are sorted alphabetically and limited to 10 matches.
 *
 * @param {string} searchTerm - The search term to match against patient names
 * @returns {Promise<object>} Object with success status and either an array of matching patients or error message
 *
 * @example
 * const result = await searchPatients("max");
 * // Will find patients with names like "Max", "Maxwell", etc.
 */
export async function searchPatients(searchTerm: string) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Search patients by name using case-insensitive LIKE query
    const { data: patients, error } = await supabase
      .from("patients")
      .select()
      .ilike("name", `%${searchTerm.toLowerCase()}%`)
      .limit(10);

    if (error) {
      console.error("Failed to search patients:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true, data: patients };
  } catch (error) {
    console.error("Failed to search patients:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search patients",
    };
  }
}

/**
 * Retrieves a patient by ID
 *
 * This function fetches a patient record by its database ID.
 *
 * @param {number} patientId - The ID of the patient to retrieve
 * @returns {Promise<object>} Object with success status and either the patient data or error message
 *
 * @example
 * const result = await getPatientById(123);
 * if (result.success) {
 *   const patient = result.data;
 *   // Access patient.name, patient.dateOfBirth, etc.
 * }
 */
export async function getPatientById(patientId: number) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get patient by ID
    const { data: patient, error } = await supabase
      .from("patients")
      .select()
      .eq("id", patientId)
      .limit(1);

    if (error) {
      console.error("Failed to get patient:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (patient.length === 0) {
      return { success: false, error: "Patient not found" };
    }

    return { success: true, data: patient[0] };
  } catch (error) {
    console.error("Failed to get patient:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get patient",
    };
  }
}

/**
 * Differential Diagnoses Functions
 *
 * These functions handle creating, retrieving, and updating differential diagnoses
 * for veterinary cases. Differential diagnoses are possible medical conditions that
 * might explain a patient's symptoms.
 */

/**
 * Schema for differential diagnoses
 *
 * @property {number} caseId - ID of the case this diagnosis belongs to
 * @property {string} diagnosis - Name of the diagnosis (required)
 * @property {boolean} approved - Whether this diagnosis has been confirmed (default: false)
 * @property {string} notes - Additional notes about this diagnosis (optional)
 */
const differentialDiagnosisSchema = z.object({
  caseId: z.number(),
  diagnosis: z.string().min(1, "Diagnosis name is required"),
  approved: z.boolean().default(false),
  notes: z.string().optional(),
});

export type DifferentialDiagnosis = z.infer<typeof differentialDiagnosisSchema>;

/**
 * Adds a new differential diagnosis to a case
 *
 * This function creates a new potential diagnosis for a veterinary case.
 * It verifies that the case exists before adding the diagnosis.
 *
 * @param {DifferentialDiagnosis} data - The diagnosis data to save
 * @returns {Promise<object>} Object with success status and either the created diagnosis data or error message
 *
 * @example
 * const result = await addDifferentialDiagnosis({
 *   caseId: 123,
 *   diagnosis: "Gastroenteritis",
 *   approved: false,
 *   notes: "Based on vomiting and diarrhea symptoms"
 * });
 */
export async function addDifferentialDiagnosis(data: DifferentialDiagnosis) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate the diagnosis data
    const parsedData = differentialDiagnosisSchema.parse(data);

    // Check if case exists and user has access
    const { data: caseExists, error: caseExistsError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", parsedData.caseId)
      .limit(1);

    if (caseExistsError) {
      console.error("Failed to check case existence:", caseExistsError);
      return { success: false, error: "Failed to check case existence" };
    }

    if (caseExists.length === 0) {
      return { success: false, error: "Case not found" };
    }

    // Insert the diagnosis
    const { data: newDiagnosis, error: diagnosisError } = await supabase
      .from("differential_diagnoses")
      .insert({
        case_id: parsedData.caseId,
        diagnosis: parsedData.diagnosis,
        approved: parsedData.approved,
      })
      .select()
      .single();

    if (diagnosisError) {
      console.error("Failed to add differential diagnosis:", diagnosisError);
      return { success: false, error: "Failed to add differential diagnosis" };
    }

    // Revalidate paths to update the UI
    revalidatePath(`/dashboard/cases/${parsedData.caseId}`);
    revalidatePath(`/dashboard`);

    return { success: true, data: newDiagnosis };
  } catch (error) {
    console.error("Failed to add differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add differential diagnosis",
    };
  }
}

/**
 * Updates an existing differential diagnosis
 *
 * This function modifies an existing diagnosis, including changing its approval status.
 *
 * @param {number} diagnosisId - ID of the diagnosis to update
 * @param {Partial<DifferentialDiagnosis>} data - The fields to update
 * @returns {Promise<object>} Object with success status and either the updated diagnosis data or error message
 *
 * @example
 * // Approve a diagnosis
 * const result = await updateDifferentialDiagnosis(456, {
 *   approved: true,
 *   notes: "Confirmed by blood test results"
 * });
 */
export async function updateDifferentialDiagnosis(
  diagnosisId: number,
  data: Partial<DifferentialDiagnosis>
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

    // Get the diagnosis to update
    const { data: diagnosis, error } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("id", diagnosisId)
      .limit(1);

    if (error) {
      console.error("Failed to get differential diagnosis:", error);
      return { success: false, error: "Failed to get differential diagnosis" };
    }

    if (diagnosis.length === 0) {
      return { success: false, error: "Diagnosis not found" };
    }

    // Update the diagnosis with provided fields
    const { data: updatedDiagnosis, error: updateError } = await supabase
      .from("differential_diagnoses")
      .update({
        ...(data.diagnosis && { diagnosis: data.diagnosis }),
        ...(data.approved !== undefined && { approved: data.approved }),
        ...(data.notes && { notes: data.notes }),
      })
      .eq("id", diagnosisId)
      .select();

    if (updateError) {
      console.error("Failed to update differential diagnosis:", updateError);
      return {
        success: false,
        error: "Failed to update differential diagnosis",
      };
    }

    // Revalidate paths to update the UI
    revalidatePath(`/dashboard/cases/${diagnosis[0].caseId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      data:
        updatedDiagnosis && updatedDiagnosis.length > 0
          ? updatedDiagnosis[0]
          : undefined,
    };
  } catch (error) {
    console.error("Failed to update differential diagnosis:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update differential diagnosis",
    };
  }
}

/**
 * Retrieves all differential diagnoses for a case
 *
 * This function fetches all potential diagnoses associated with a specific case,
 * ordered by creation date.
 *
 * @param {number} caseId - ID of the case to retrieve diagnoses for
 * @returns {Promise<object>} Object with success status and either an array of diagnoses or error message
 *
 * @example
 * const result = await getDifferentialDiagnoses(123);
 * if (result.success) {
 *   // Process diagnoses in result.data
 *   const diagnoses = result.data;
 *   const approvedDiagnoses = diagnoses.filter(d => d.approved);
 * }
 */
export async function getDifferentialDiagnoses(caseId: number) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Fetch all diagnoses for this case, ordered by creation date
    const { data: diagnoses, error } = await supabase
      .from("differential_diagnoses")
      .select()
      .eq("case_id", caseId);

    if (error) {
      console.error("Failed to get differential diagnoses:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get differential diagnoses",
      };
    }

    return { success: true, data: diagnoses };
  } catch (error) {
    console.error("Failed to get differential diagnoses:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get differential diagnoses",
    };
  }
}

/**
 * Treatment Plan Functions
 *
 * These functions handle creating, updating, and retrieving treatment tasks
 * for veterinary cases. Treatment tasks represent actions that need to be taken
 * as part of a patient's care plan.
 */

/**
 * Schema for treatment tasks
 *
 * @property {number} caseId - ID of the case this task belongs to
 * @property {string} description - Description of what needs to be done (required)
 * @property {enum} status - Current status of the task (pending, in_progress, completed)
 * @property {string} assignedTo - ID of the user assigned to this task (optional)
 */
const treatmentTaskSchema = z.object({
  caseId: z.number(),
  description: z.string().min(1, "Task description is required"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  assignedTo: z.string().optional(),
});

export type TreatmentTask = z.infer<typeof treatmentTaskSchema>;

/**
 * Adds a new treatment task to a case
 *
 * This function creates a new task as part of a treatment plan for a veterinary case.
 * It verifies that the case exists before adding the task.
 *
 * @param {TreatmentTask} data - The treatment task data to save
 * @returns {Promise<object>} Object with success status and either the created task data or error message
 *
 * @example
 * const result = await addTreatmentTask({
 *   caseId: 123,
 *   description: "Administer 10mg antibiotic",
 *   status: "pending",
 *   assignedTo: "user_456" // Optional, defaults to current user
 * });
 */
export async function addTreatmentTask(data: TreatmentTask) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate the task data
    const parsedData = treatmentTaskSchema.parse(data);

    // Check if case exists and user has access
    const { data: caseExists, error: caseExistsError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", parsedData.caseId)
      .limit(1);

    if (caseExistsError) {
      console.error("Failed to check case existence:", caseExistsError);
      return { success: false, error: "Failed to check case existence" };
    }

    if (caseExists.length === 0) {
      return { success: false, error: "Case not found" };
    }

    // Insert the task
    const { data: newTask, error } = await supabase
      .from("treatment_tasks")
      .insert({
        case_id: parsedData.caseId,
        description: parsedData.description,
        status: parsedData.status,
        assigned_to: parsedData.assignedTo || user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add treatment task:", error);
      return { success: false, error: "Failed to add treatment task" };
    }

    // Revalidate paths to update the UI
    revalidatePath(`/dashboard/cases/${parsedData.caseId}`);
    revalidatePath(`/dashboard`);

    return { success: true, data: newTask };
  } catch (error) {
    console.error("Failed to add treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add treatment task",
    };
  }
}

/**
 * Updates an existing treatment task
 *
 * This function modifies an existing task, including changing its status or reassigning it.
 * When a task is marked as completed, the completedAt timestamp is automatically set.
 *
 * @param {number} taskId - ID of the task to update
 * @param {Partial<TreatmentTask>} data - The fields to update
 * @returns {Promise<object>} Object with success status and either the updated task data or error message
 *
 * @example
 * // Mark a task as completed
 * const result = await updateTreatmentTask(456, {
 *   status: "completed"
 * });
 *
 * @example
 * // Reassign a task
 * const result = await updateTreatmentTask(456, {
 *   assignedTo: "user_789",
 *   status: "in_progress"
 * });
 */
export async function updateTreatmentTask(
  taskId: number,
  data: Partial<TreatmentTask>
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

    // Get the task to update
    const { data: task, error } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("id", taskId)
      .limit(1);

    if (error) {
      console.error("Failed to get treatment task:", error);
      return { success: false, error: "Failed to get treatment task" };
    }

    if (task.length === 0) {
      return { success: false, error: "Task not found" };
    }

    // Update the task with provided fields
    // Automatically set completedAt when status changes to completed
    const { data: updatedTask, error: updateError } = await supabase
      .from("treatment_tasks")
      .update({
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.status === "completed" && { completed_at: new Date() }),
        ...(data.assignedTo && { assigned_to: data.assignedTo }),
        updated_at: new Date(),
      })
      .eq("id", taskId)
      .select();

    if (updateError) {
      console.error("Failed to update treatment task:", updateError);
      return { success: false, error: "Failed to update treatment task" };
    }

    // Revalidate paths to update the UI
    revalidatePath(`/dashboard/cases/${task[0].caseId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      data: updatedTask && updatedTask.length > 0 ? updatedTask[0] : undefined,
    };
  } catch (error) {
    console.error("Failed to update treatment task:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update treatment task",
    };
  }
}

/**
 * Retrieves all treatment tasks for a case
 *
 * This function fetches all tasks associated with a specific case,
 * ordered by creation date.
 *
 * @param {number} caseId - ID of the case to retrieve tasks for
 * @returns {Promise<object>} Object with success status and either an array of tasks or error message
 *
 * @example
 * const result = await getTreatmentTasks(123);
 * if (result.success) {
 *   // Process tasks in result.data
 *   const tasks = result.data;
 *   const pendingTasks = tasks.filter(t => t.status === "pending");
 *   const completedTasks = tasks.filter(t => t.status === "completed");
 * }
 */
export async function getTreatmentTasks(caseId: number) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Fetch all tasks for this case, ordered by creation date
    const { data: tasks, error } = await supabase
      .from("treatment_tasks")
      .select()
      .eq("case_id", caseId);

    if (error) {
      console.error("Failed to get treatment tasks:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get treatment tasks",
      };
    }

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Failed to get treatment tasks:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get treatment tasks",
    };
  }
}

/**
 * Dashboard Functions
 *
 * These functions provide summary information and recent data for the dashboard,
 * helping users get a quick overview of clinic activities.
 */

/**
 * Retrieves summary data for the dashboard
 *
 * This function gathers statistics and upcoming appointments for the dashboard
 * including today's cases, yesterday's cases for comparison, pending tasks,
 * and upcoming appointments.
 *
 * @returns {Promise<object>} Object with success status and dashboard summary data
 *
 * @example
 * const result = await getDashboardSummary();
 * if (result.success) {
 *   const summary = result.data;
 *   console.log(`Today's cases: ${summary.todayCasesCount}`);
 *   console.log(`Pending actions: ${summary.pendingActionsCount}`);
 *   console.log(`Upcoming appointments: ${summary.upcomingAppointments.length}`);
 * }
 */
export async function getDashboardSummary() {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    // Get count of today's cases
    const { data: todayCasesCount, error: todayCasesError } = await supabase
      .from("cases")
      .select("*");

    // Get count of yesterday's cases for comparison
    const { data: yesterdayCasesCount, error: yesterdayCasesError } =
      await supabase.from("cases").select("*");

    // Get pending actions (e.g., treatment tasks that need attention)
    const { data: pendingActionsCount, error: pendingActionsError } =
      await supabase.from("treatment_tasks").select("*");

    // Get upcoming appointments (cases scheduled for today)
    const { data: upcomingAppointments, error: appointmentsError } =
      await supabase.from("cases").select("*");

    if (
      todayCasesError ||
      yesterdayCasesError ||
      pendingActionsError ||
      appointmentsError
    ) {
      console.error("Failed to get dashboard summary:", {
        todayCasesError,
        yesterdayCasesError,
        pendingActionsError,
        appointmentsError,
      });
      return {
        success: false,
        error: "Failed to get dashboard summary",
      };
    }

    return {
      success: true,
      data: {
        todayCasesCount: Number(todayCasesCount[0]?.count || 0),
        yesterdayCasesCount: Number(yesterdayCasesCount[0]?.count || 0),
        pendingActionsCount: Number(pendingActionsCount[0]?.count || 0),
        upcomingAppointments,
      },
    };
  } catch (error) {
    console.error("Failed to get dashboard summary:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get dashboard summary",
    };
  }
}

/**
 * Retrieves the most recently updated cases
 *
 * This function fetches the most recently updated cases with their patient information,
 * ordered by last update time.
 *
 * @param {number} limit - Maximum number of cases to retrieve (default: 5)
 * @returns {Promise<object>} Object with success status and array of recent cases
 *
 * @example
 * // Get the 3 most recent cases
 * const result = await getRecentCases(3);
 * if (result.success) {
 *   const cases = result.data;
 *   // Process and display the cases
 * }
 */
export async function getRecentCases(limit = 5) {
  try {
    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get recent cases with patient information
    const { data: recentCases, error } = await supabase
      .from("cases")
      .select("*");

    if (error) {
      console.error("Failed to get recent cases:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get recent cases",
      };
    }

    return { success: true, data: recentCases };
  } catch (error) {
    console.error("Failed to get recent cases:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get recent cases",
    };
  }
}
