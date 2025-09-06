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
import { revalidatePath } from "next/cache";
import { getTemplateById } from "../templates/actions";
import { simpleSendEmail } from "../email/service";

/**
 * Generates structured output from transcriptions using AI based on a template
 * Used in the SOAP note generation component
 */
export async function generateContentFromTemplate(
  transcriptions: string | string[],
  templateData: { templateId: string; caseId?: string }
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
    if (!result.success || !result.template) {
      throw new Error(result.error || "Failed to fetch template");
    }

    // Now we can safely use the template
    const template = result.template;
    console.log(`Using template: ${template.name} (${template.type})`);

    let generatedContent: any;

    // Handle different template types based on the template.type field
    if (template.type === "soap") {
      // For SOAP notes, we still need the structure but we'll use a simpler approach
      const { text } = await generateText({
        model: openai(template.model || "gpt-4"),
        prompt: `${template.prompt || ""}
        
        Transcript:
        ${combinedTranscription}
        
        Generate a SOAP note with the following sections:
        - Subjective: Patient history and symptoms as reported
        - Objective: Clinical findings and observations
        - Assessment: Diagnosis and clinical reasoning
        - Plan: Treatment plan and follow-up instructions
        
        Format your response as a JSON object with the keys: subjective, objective, assessment, and plan.
        Example format:
        {
          "subjective": "...",
          "objective": "...",
          "assessment": "...",
          "plan": "..."
        }`,
      });

      // Try to parse the response as JSON
      try {
        generatedContent = JSON.parse(text);
      } catch (error) {
        console.warn("Could not parse SOAP response as JSON:", error);
        // If parsing fails, create a structured object with the text in the plan field
        generatedContent = {
          subjective: "See generated content below",
          objective: "See generated content below",
          assessment: "See generated content below",
          plan: text,
        };
      }
    } else if (template.type === "structured") {
      // For structured templates, use a text-based approach
      const fields = template.content
        ? template.content.split(",").map((f) => f.trim())
        : [];

      if (fields.length > 0) {
        const { text } = await generateText({
          model: openai(template.model || "gpt-4"),
          prompt: `${template.prompt || ""}
          
          Transcript:
          ${combinedTranscription}
          
          Generate content with the following fields: ${fields.join(", ")}
          
          Format your response as a JSON object with these keys: ${fields.join(", ")}
          Example format:
          {
            ${fields.map((field) => `"${field}": "..."`).join(",\n            ")}
          }`,
        });

        // Try to parse the response as JSON
        try {
          generatedContent = JSON.parse(text);
        } catch (error) {
          console.warn("Could not parse structured response as JSON:", error);
          // If parsing fails, return the raw text
          generatedContent = text;
        }
      } else {
        // Fallback to text generation if no fields are specified
        const { text } = await generateText({
          model: openai(template.model || "gpt-4"),
          prompt: `${template.prompt || ""}
          
          Transcript:
          ${combinedTranscription}`,
        });
        generatedContent = text;
      }
    } else {
      // For all other template types, just generate text
      const { text } = await generateText({
        model: openai(template.model || "gpt-4"),
        prompt: `${template.prompt || ""}
        
        Transcript:
        ${combinedTranscription}`,
      });
      generatedContent = text;
    }

    // Save the generation to the database if a case ID was provided
    if (templateData.caseId) {
      // Verify the case belongs to the user before saving
      const supabase = await createClient();
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id")
        .eq("id", templateData.caseId)
        .eq("user_id", userId)
        .single();

      if (caseError || !caseData) {
        throw new Error("Case not found or unauthorized");
      }

      await saveGeneration({
        caseId: templateData.caseId,
        templateId: templateData.templateId,
        prompt: template.prompt || "",
        content:
          typeof generatedContent === "string"
            ? generatedContent
            : JSON.stringify(generatedContent),
      });
    }

    return {
      success: true,
      content: generatedContent,
      template: template,
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
 * Saves a generation to the database
 */
export async function saveGeneration({
  caseId,
  templateId,
  prompt,
  content,
}: {
  caseId: string;
  templateId: string;
  prompt: string;
  content: string;
}) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify the case belongs to the user
    const supabase = await createClient();
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .single();

    if (caseError || !caseData) {
      throw new Error("Case not found or unauthorized");
    }

    // Create the generation
    const { data: generation, error } = await supabase
      .from("generations")
      .insert({
        case_id: caseId,
        template_id: templateId,
        prompt: prompt,
        content: content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath(`/dashboard/case/${caseId}`);

    return {
      success: true,
      generation: generation as Tables<"generations">,
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
 * Gets all generations for a case
 */
export async function getGenerationsForCase(caseId: string) {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify the case belongs to the user
    const supabase = await createClient();
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .single();

    if (caseError || !caseData) {
      throw new Error("Case not found or unauthorized");
    }

    // Get all generations for the case
    const { data: generations, error } = await supabase
      .from("generations")
      .select("*, templates(id, name, type)")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      generations: generations as Array<
        Tables<"generations"> & { templates: Tables<"templates"> }
      >,
    };
  } catch (error) {
    console.error("Failed to get generations:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get generations",
    };
  }
}
