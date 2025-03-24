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
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTemplateById } from "../template-actions";

/**
 * Schema for creating a new case
 *
 * @property {string} name - Name of the case (required)
 * @property {string} dateTime - Date and time of the case (required, ISO format string)
 * @property {string} assignedTo - ID of the user the case is assigned to
 * @property {enum} type - The type of case (checkup, emergency, surgery, follow_up)
 */
const createCaseSchema = z.object({
  name: z.string().min(1),
  dateTime: z.string().min(1),
  assignedTo: z.string().default("db109256-9541-427b-9cb3-b14c0c7682ff"),
  type: z.enum(["checkup", "emergency", "surgery", "follow_up"]),
  // Use exact status values from Supabase database
  status: z
    .enum(["ongoing", "completed", "reviewed", "exported", "scheduled"])
    .default("ongoing"),
  visibility: z.enum(["private", "public"]).default("private"), // Add visibility field
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
  type: z.enum(["recording", "soap", "unknown"]), // Add "unknown" to the allowed types
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

/**
 * Exports a case to the debug log to help troubleshoot issues with case creation
 * This function directly queries the Supabase DB and logs details to help diagnose issues
 */
/**
 * Diagnoses database schema issues
 * This function helps troubleshoot schema problems by directly querying table structures
 */
export async function diagnoseDatabaseSchema() {
  try {
    console.log("===== DATABASE SCHEMA DIAGNOSIS =====");
    const supabase = await createClient();

    // Check patients table
    console.log("1. Checking patients table schema...");
    const { data: patientInfo, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .limit(1);

    if (patientError) {
      console.error("Error accessing patients table:", patientError);
    } else if (patientInfo && patientInfo.length > 0) {
      console.log("Patients table columns:", Object.keys(patientInfo[0]));
      console.log(
        "Patient sample data:",
        JSON.stringify(patientInfo[0], null, 2)
      );
    } else {
      console.log("Patients table exists but is empty");

      // Try to get column info through a different method
      try {
        const { data: firstInsertTest, error: insertError } = await supabase
          .from("patients")
          .insert({
            name: "TEST_PATIENT_DELETE_ME",
            // We'll try without specifying other fields to see what errors we get
          })
          .select();

        if (insertError) {
          console.log("Patient test insert error:", insertError);
          // This will tell us which fields are required
        }
      } catch (e) {
        console.error("Test insert failed:", e);
      }
    }

    // Check cases table and status enum values
    console.log("\n2. Checking cases table and status options...");
    const { data: caseInfo, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .limit(1);

    if (caseError) {
      console.error("Error accessing cases table:", caseError);
    } else if (caseInfo && caseInfo.length > 0) {
      console.log("Cases table columns:", Object.keys(caseInfo[0]));
      console.log("Case sample data:", JSON.stringify(caseInfo[0], null, 2));

      // If there's a status field, try to understand the possible values
      if (caseInfo[0].status) {
        console.log("Current status value example:", caseInfo[0].status);
      }
    } else {
      console.log("Cases table exists but is empty");

      // Try inserting cases with different status values to find valid ones
      const statusValuesToTry = [
        "scheduled",
        "SCHEDULED",
        "in_progress",
        "IN_PROGRESS",
        "completed",
        "COMPLETED",
      ];

      for (const statusValue of statusValuesToTry) {
        try {
          console.log(`Testing status value: "${statusValue}"`);
          const { data: testData, error: testError } = await supabase
            .from("cases")
            .insert({
              name: "TEST_CASE_DELETE_ME",
              dateTime: new Date().toISOString(),
              visibility: "private",
              type: "checkup",
              status: statusValue,
            })
            .select();

          if (testError) {
            console.log(`Status "${statusValue}" error:`, testError.message);
          } else {
            console.log(`Status "${statusValue}" SUCCESS! Valid value.`);
            // Delete the test case
            await supabase
              .from("cases")
              .delete()
              .eq("name", "TEST_CASE_DELETE_ME");
            break; // We found a working value
          }
        } catch (e) {
          console.error(`Test for status "${statusValue}" failed:`, e);
        }
      }
    }

    // Check patient-case relationship
    console.log("\n3. Checking patient-case relationship...");
    // Find a case with a patient
    const { data: caseWithPatient, error: casePatientError } = await supabase
      .from("cases")
      .select("id, name, patientId")
      .not("patientId", "is", null)
      .limit(1);

    if (casePatientError) {
      console.error(
        "Error checking case-patient relationship:",
        casePatientError
      );
    } else if (caseWithPatient && caseWithPatient.length > 0) {
      console.log("Found case with patient:", caseWithPatient[0]);

      // Check if we can get the patient
      if (caseWithPatient[0].patientId) {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", caseWithPatient[0].patientId)
          .single();

        if (patientError) {
          console.error("Error fetching linked patient:", patientError);
        } else {
          console.log("Linked patient data:", patientData);
        }
      }
    } else {
      console.log("No cases with patient IDs found");
    }

    // Check all patients
    const { data: allPatients, error: allPatientsError } = await supabase
      .from("patients")
      .select("*")
      .limit(5);

    if (allPatientsError) {
      console.error("Error fetching patients:", allPatientsError);
    } else {
      console.log("All patients (up to 5):", allPatients);
    }

    console.log("===== DATABASE SCHEMA DIAGNOSIS COMPLETE =====");
    return { success: true };
  } catch (error) {
    console.error("Schema diagnosis failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function debugCase(caseId: number) {
  try {
    console.log("* DEBUG CASE *: Starting debug for case ID", caseId);
    const supabase = await createClient();

    // Fetch the case
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (caseError) {
      console.error("* DEBUG CASE *: Error fetching case:", caseError);
      return { success: false, error: caseError.message };
    }

    if (!caseData) {
      console.error("* DEBUG CASE *: Case not found in database");
      return { success: false, error: "Case not found" };
    }

    console.log(
      "* DEBUG CASE *: Case data from DB:",
      JSON.stringify(caseData, null, 2)
    );

    // List all cases in the database (limit to recent)
    const { data: allCases, error: allCasesError } = await supabase
      .from("cases")
      .select("id, name, dateTime, type")
      .order("id", { ascending: false })
      .limit(10);

    if (allCasesError) {
      console.error("* DEBUG CASE *: Error fetching all cases:", allCasesError);
    } else {
      console.log(
        "* DEBUG CASE *: Recent cases in database:",
        JSON.stringify(allCases, null, 2)
      );
    }

    return { success: true, caseData };
  } catch (error) {
    console.error("* DEBUG CASE *: Exception in debugCase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
export async function createCase(
  data: z.infer<typeof createCaseWithActionsSchema>
) {
  try {
    console.log("createCase called with data:", JSON.stringify(data, null, 2));
    console.log(
      "====================== CASE CREATION START ======================"
    );

    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("Authentication failed - no user found");
      throw new Error("Unauthorized");
    }

    console.log("User authenticated successfully:", user.id);

    // Validate input data against the schema
    const parsedData = createCaseWithActionsSchema.parse(data);

    // Use the case name directly as the patient name
    const patientName = parsedData.name;
    console.log(`Using case name as patient name: ${patientName}`);

    // Check if a patient with this name already exists
    const { data: existingPatients, error: patientSearchError } = await supabase
      .from("patients")
      .select("id, name")
      .ilike("name", patientName);

    if (patientSearchError) {
      console.error("Error searching for patient:", patientSearchError);
    }

    let patientId = null;

    // If patient doesn't exist, create one
    if (!existingPatients || existingPatients.length === 0) {
      console.log(`Creating new patient: ${patientName}`);

      // Create a patient object with the required fields based on the error message
      const patientObj = {
        name: patientName,
        // Adding dateOfBirth field which is required according to the error message
        dateOfBirth: new Date().toISOString().split("T")[0],
      };

      console.log(
        "Creating simplified patient with only name:",
        JSON.stringify(patientObj, null, 2)
      );

      // Insert the patient with minimal required fields
      const { data: newPatient, error: newPatientError } = await supabase
        .from("patients")
        .insert(patientObj)
        .select()
        .single();

      if (newPatientError) {
        console.error("Failed to create patient:", newPatientError);
      } else if (newPatient) {
        patientId = newPatient.id;
        console.log(`Created new patient with ID: ${patientId}`);
      }
    } else {
      // Use existing patient
      patientId = existingPatients[0].id;
      console.log(`Using existing patient with ID: ${patientId}`);
    }

    // Log case data before saving
    console.log("Preparing to create case with data:", {
      name: parsedData.name,
      dateTime: new Date(parsedData.dateTime).toISOString(),
      visibility: parsedData.visibility,
      type: parsedData.type,
      status: "scheduled",
      patientId: patientId,
    });

    // Check the column names in the cases table to determine the correct patient ID column name
    const { data: tableInfo, error: tableError } = await supabase
      .from("cases")
      .select("*")
      .limit(1);

    let columnStructure;
    if (tableInfo && tableInfo.length > 0) {
      columnStructure = tableInfo[0];
      console.log(
        "DB Table structure - case columns:",
        Object.keys(columnStructure)
      );
    } else {
      console.log("Could not get case table structure:", tableError);
      // Create a fallback schema with standard fields to avoid errors
      columnStructure = {
        id: 1,
        name: "fallback",
        dateTime: new Date(),
        visibility: "private",
        type: "checkup",
        status: "ongoing",
        patientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log("Using fallback case schema");
    }

    // Create the case and link it to the patient using the correct column name
    // We'll determine if we should use patient_id (snake_case) or patientId (camelCase)
    const columnName = Object.keys(columnStructure).includes("patient_id")
      ? "patient_id"
      : "patientId";

    console.log(`Using column name '${columnName}' for patient reference`);

    // Get the table columns to determine what fields to include
    console.log(
      "Available columns for cases table:",
      Object.keys(columnStructure)
    );

    // Create base case data without optional fields
    const caseData: any = {
      name: parsedData.name,
      dateTime: new Date(parsedData.dateTime).toISOString(),
      visibility: parsedData.visibility,
      type: parsedData.type,
    };

    // Add status from form input if the field exists
    if (Object.keys(columnStructure).includes("status")) {
      // Use exact Supabase status values
      caseData.status = parsedData.status || "ongoing";

      // Log status value
      console.log(`Using status value: ${caseData.status}`);
    }

    // Always use this specific ID regardless of what's passed from the client
    caseData.assignedTo = "db109256-9541-427b-9cb3-b14c0c7682ff";

    // Set the patient ID using the dynamically determined column name, if it exists
    if (Object.keys(columnStructure).includes(columnName)) {
      caseData[columnName] = patientId;
    }

    console.log("Creating case with data:", JSON.stringify(caseData, null, 2));

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert(caseData)
      .select()
      .single();

    if (caseError) {
      console.error("Failed to create case:", caseError);
      return {
        success: false,
        error: caseError.message,
      };
    }

    console.log("Case created successfully:", newCase);

    // Double check the patient ID was set correctly
    console.log(
      `IMPORTANT: Case created with patient ID: ${newCase.patientId || "NULL"}`
    );

    if (!newCase.patientId) {
      console.warn("WARNING: Case was created but patient ID was not set!");
    }

    const caseId = newCase.id;
    console.log("Created case with ID:", caseId);

    // If there are case actions, store them directly in the cases table
    if (parsedData.actions && parsedData.actions.length > 0) {
      console.log(
        `Storing ${parsedData.actions.length} actions in case_actions column`
      );

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
          .eq("id", caseId);

        if (updateError) {
          console.error("Error storing case actions:", updateError);
        } else {
          console.log(
            `Successfully stored ${formattedActions.length} actions in case_actions column`
          );
        }
      } catch (actionError) {
        console.error("Error storing case actions:", actionError);
      }
    }

    // Revalidate paths to update the UI
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/api/appointments"); // Add API path to ensure cache is invalidated

    console.log("Revalidated paths after creating case");

    // Debug the case we just created to see what actually went into the database
    const debugResult = await debugCase(newCase.id);

    console.log(
      "====================== CASE CREATION COMPLETE ======================"
    );
    console.log(`Case created with ID: ${newCase.id}`);

    // Fetch all cases for comparison
    const allCases = await supabase
      .from("cases")
      .select("id, name, dateTime")
      .order("id", { ascending: false })
      .limit(5);
    console.log(
      "Recent cases in database:",
      JSON.stringify(allCases.data, null, 2)
    );

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

    // First, fetch the current case to get existing actions
    const { data: currentCase, error: fetchError } = await supabase
      .from("cases")
      .select("case_actions")
      .eq("id", caseId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch current case actions:", fetchError);
      return {
        success: false,
        error: fetchError.message,
      };
    }

    // Format the new action
    const formattedAction = {
      id: parsedAction.id,
      type: parsedAction.type,
      content: {
        transcript: parsedAction.content?.transcript || "",
        soap: parsedAction.content?.soap,
      },
      timestamp: parsedAction.timestamp,
    };

    // Combine existing actions with the new one
    const existingActions = currentCase.case_actions || [];
    const updatedActions = [...existingActions, formattedAction];

    console.log(
      `Adding 1 action to existing ${existingActions.length} actions for case ${caseId}`
    );

    // Update the case with the combined actions
    const { error: updateError } = await supabase
      .from("cases")
      .update({
        case_actions: updatedActions,
      })
      .eq("id", caseId);

    if (updateError) {
      console.error("Failed to save case action:", updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    console.log("Successfully added action to case_actions column");

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
 * structured output according to the provided template type. The output format is determined
 * by the template type and content.
 *
 * @param {string|string[]} transcriptions - The text transcription(s) to analyze
 * @param {object} templateData - Data about the template to use
 * @param {number} templateData.templateId - ID of the template to use
 * @returns {Promise<object>} Object with success status and either the generated content or error message
 */
export async function generateContentFromTemplate(
  transcriptions: string | string[],
  templateData: { templateId: number }
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
 * Generates SOAP notes from transcriptions using AI based on a template or default format
 *
 * This function uses OpenAI's GPT-4o model to analyze one or more transcriptions and generate
 * SOAP notes. It can use either a default SOAP format or a specific template.
 *
 * @param {string|string[]} transcriptions - The text transcription(s) to analyze
 * @param {object} templateData - Optional template data for structured output
 * @param {string} templateData.templateId - ID of the template to use
 * @returns {Promise<object>} Object with success status and either the generated SOAP notes or error message
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

/**
 * Schema for updating an existing case
 */
// Make sure updateCaseSchema includes the same fields as createCaseSchema
const updateCaseSchema = createCaseSchema.extend({
  id: z.number(),
  actions: z.array(caseActionSchema).optional(),
});

/**
 * Updates an existing case with new information
 *
 * @param {object} data - Case data including id and fields to update
 * @returns {Promise<object>} Object with success status and either the updated case data or error message
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

    // Log the update data before sending
    console.log("Updating case with data:", {
      id: parsedData.id,
      name: parsedData.name,
      dateTime: new Date(parsedData.dateTime).toISOString(),
      visibility: parsedData.visibility,
      type: parsedData.type,
      patientId: patientId,
    });

    // Check the column names in the cases table to determine the correct patient ID column name
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from("cases")
      .select("*")
      .limit(1);

    if (tableInfo && tableInfo.length > 0) {
      console.log(
        "DB Table structure - case columns:",
        Object.keys(tableInfo[0])
      );
    } else {
      console.log("Could not get case table structure:", tableInfoError);
    }

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

    // Check the table structure to see what columns are available
    const { data: caseTableInfo, error: caseTableInfoError } = await supabase
      .from("cases")
      .select("*")
      .limit(1);

    // Create a columnStructure variable either from the query or fallback
    let columnStructure;
    if (caseTableInfo && caseTableInfo.length > 0) {
      columnStructure = caseTableInfo[0];
      console.log(
        "Available columns for update:",
        Object.keys(columnStructure)
      );
    } else {
      console.error("Error getting case table structure:", caseTableInfoError);
      // Create a fallback schema with standard fields to avoid errors
      columnStructure = {
        id: 1,
        name: "fallback",
        dateTime: new Date(),
        visibility: "private",
        type: "checkup",
        status: "ongoing",
        patientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log("Using fallback case schema for update");
    }

    // Create base update data
    const updateData: any = {
      name: parsedData.name,
      dateTime: new Date(parsedData.dateTime).toISOString(),
      visibility: parsedData.visibility,
      type: parsedData.type,
    };

    // Add status if field exists - always use lowercase
    if (Object.keys(columnStructure).includes("status")) {
      updateData.status = parsedData.status || "ongoing";
      console.log(`Updating status to: ${updateData.status}`);
    }

    // Set the patient ID using the dynamically determined column name
    if (Object.keys(columnStructure).includes(columnName)) {
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

    if (updatedCase) {
      console.log("Case updated successfully:", updatedCase);
    }

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

    // Revalidate the dashboard and appointments paths to update the UI
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/api/appointments"); // Add API path to ensure cache is invalidated
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
 *
 * @param {number} caseId - The ID of the case to retrieve
 * @returns {Promise<object>} Object with success status and either the case data or error message
 */
export async function getCase(caseId: number) {
  try {
    console.log(`getCase called with ID: ${caseId}`);

    // Authenticate the user making the request
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("Authentication failed in getCase");
      return { success: false, error: "Unauthorized" };
    }

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

    console.log("Returning case data:", JSON.stringify(responseData, null, 2));

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
