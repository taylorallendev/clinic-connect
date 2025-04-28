"use server";

/**
 * Content generation server actions
 * Handles AI-based content generation from templates and transcripts
 */

import { createClient } from "@/utils/supabase/server";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getCurrentUserId } from "../common/auth";
import { Tables } from "@/database.types";

// Simulating getTemplateById from template-actions.ts that we would eventually create
async function getTemplateById(templateId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    return { template: data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Generates structured output from transcriptions using AI based on a template
 * Used in the SOAP note generation component
 */
export async function generateContentFromTemplate(
  transcriptions: string | string[],
  templateData: { templateId: string }
) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

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

      // Generate structured content based on the schema and prompt
      const structuredContent = await generateObject({
        model: openai("gpt-4"),
        prompt: `${template.prompt || ""}
        
        Transcript:
        ${combinedTranscription}`,
        schema: {
          type: "object",
          properties: schema.reduce(
            (acc: Record<string, any>, field: { key: string; type: string }) => {
              acc[field.key] = { type: "string" };
              return acc;
            },
            {}
          ),
          required: schema.map((field: { key: string }) => field.key),
        },
      });

      return {
        success: true,
        content: structuredContent,
        template: template,
      };
    } else if (template.type === "soap") {
      // Generate SOAP notes using the template prompt
      const soapNotes = await generateObject({
        model: openai("gpt-4"),
        prompt: `${template.prompt || ""}
        
        Transcript:
        ${combinedTranscription}`,
        schema: {
          type: "object",
          properties: {
            subjective: { type: "string" },
            objective: { type: "string" },
            assessment: { type: "string" },
            plan: { type: "string" },
          },
          required: ["subjective", "objective", "assessment", "plan"],
        },
      });

      return {
        success: true,
        content: soapNotes,
        template: template,
      };
    } else {
      // For free-form templates, just generate text
      const { text } = await generateText({
        model: openai("gpt-4"),
        prompt: `${template.prompt || ""}
        
        Transcript:
        ${combinedTranscription}`,
      });

      return {
        success: true,
        content: text,
        template: template,
      };
    }
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