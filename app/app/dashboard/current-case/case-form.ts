"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SoapResponse, useCaseStore } from "@/store/use-case-store";
import { createCase, generateSoapNotes } from "@/app/actions";

// Case form schema
export const caseFormSchema = z.object({
  name: z.string().min(1, "Case name is required"),
  dateTime: z.string().min(1, "Date and time is required"),
  assignedTo: z.string(),
  type: z.enum(["checkup", "emergency", "surgery", "follow_up"]),
  // Use exact status values from Supabase database
  status: z
    .enum(["ongoing", "completed", "reviewed", "exported", "scheduled"])
    .default("ongoing"),
  visibility: z.enum(["private", "public"]).default("private"),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;

// Interface for SOAP editor state
export interface SoapEditorState {
  isOpen: boolean;
  soapNotes: SoapResponse | null;
  transcript: string;
  actionId: string | null;
}

/**
 * Custom hook for case form handling
 *
 * This hook provides form handling functionality for creating and updating cases,
 * including form state, validation, and submission.
 */
export function useCaseForm(onCaseCreated?: (caseId: number) => void) {
  const { toast } = useToast();
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [soapEditorState, setSoapEditorState] = useState<SoapEditorState>({
    isOpen: false,
    soapNotes: null,
    transcript: "",
    actionId: null,
  });

  const {
    caseActions,
    transcriptText,
    addCaseAction,
    setTranscriptText,
    updateCaseAction,
  } = useCaseStore();

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      type: "checkup",
      dateTime: new Date().toISOString().slice(0, 16),
      assignedTo: "", // This will be filled by the user
      name: "", // This will be filled by the user
      status: "ongoing", // Default status from Supabase
      visibility: "private", // Add default visibility
    },
  });

  // Form submission handler
  const onSubmit = async (values: CaseFormValues) => {
    try {
      setIsSubmittingCase(true);

      // Only include actions if we have a transcript
      const actions = caseActions;

      // If we have a transcript but no actions yet, add it as a recording action
      if (transcriptText.trim() && actions.length === 0) {
        actions.push({
          id: crypto.randomUUID(),
          type: "recording",
          content: {
            transcript: transcriptText,
          },
          timestamp: Date.now(),
        });
      }

      const result = await createCase({
        ...values,
        visibility: values.visibility || "private",
        actions,
      });

      if (result.success && "data" in result) {
        toast({
          title: "Success",
          description: "Case created successfully!",
        });

        // Reset transcript text
        setTranscriptText("");

        // Call the callback with the new case ID if provided
        if (onCaseCreated && result.data.id) {
          onCaseCreated(result.data.id);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "error" in result ? result.error : "Failed to create case",
        });
      }
    } catch (error) {
      console.error("Error submitting case:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmittingCase(false);
    }
  };

  // Function to handle SOAP notes updates from the editor
  const handleSoapUpdate = (updatedSoap: SoapResponse) => {
    if (soapEditorState.actionId) {
      // Update the case action with the new SOAP notes
      const actionToUpdate = caseActions.find(
        (action) => action.id === soapEditorState.actionId
      );

      if (actionToUpdate && updateCaseAction) {
        const updatedAction = {
          ...actionToUpdate,
          content: {
            ...actionToUpdate.content,
            soap: updatedSoap,
          },
        };

        // Update the action in the store
        updateCaseAction(soapEditorState.actionId, updatedAction);
      }
    }
  };

  // Function to close the SOAP editor
  const closeSoapEditor = () => {
    setSoapEditorState({
      isOpen: false,
      soapNotes: null,
      transcript: "",
      actionId: null,
    });
  };

  // Function to generate SOAP notes from selected recordings or current transcript using a template
  const handleGenerateSoapNotes = async (templateId?: number) => {
    const { caseActions, selectedRecordings, clearSelectedRecordings } =
      useCaseStore.getState();

    // Check if we have selected recordings, otherwise use current transcript
    const hasSelectedRecordings = selectedRecordings.length > 0;
    const hasTranscript = transcriptText.trim().length > 0;

    if ((hasSelectedRecordings || hasTranscript) && !isGeneratingNotes) {
      setIsGeneratingNotes(true);
      try {
        // Get the transcriptions from selected recordings, or use current transcript
        let transcriptions: string[];

        if (hasSelectedRecordings) {
          // Get recordings from case actions
          transcriptions = selectedRecordings
            .map((id) => caseActions.find((action) => action.id === id))
            .filter(
              (action) =>
                action?.type === "recording" && action?.content?.transcript
            )
            .map((action) => action?.content?.transcript || "");
        } else {
          // Use current transcript if no recordings are selected
          transcriptions = [transcriptText];
        }

        // Pass the template ID if provided
        const templateData = templateId ? { templateId } : undefined;

        // Pass array of transcriptions to the server action
        const result = await generateSoapNotes(transcriptions, templateData);

        if (result.success && result.soapNotes) {
          // Create a combined transcript for reference in the soap note
          const combinedTranscript = transcriptions.join("\n\n---\n\n");

          // Cast the soapNotes to the expected SoapResponse type
          const soapResponse: SoapResponse =
            typeof result.soapNotes === "object" && result.soapNotes !== null
              ? {
                  subjective: result.soapNotes.subjective || "",
                  objective: result.soapNotes.objective || "",
                  assessment: result.soapNotes.assessment || "",
                  plan: result.soapNotes.plan || "",
                }
              : {
                  subjective: "",
                  objective: "",
                  assessment: "",
                  plan:
                    typeof result.soapNotes === "string"
                      ? result.soapNotes
                      : "",
                };

          // Generate a unique ID for the new action
          const actionId = crypto.randomUUID();

          // Add the SOAP notes as a case action
          addCaseAction({
            id: actionId,
            type: "soap",
            content: {
              transcript: combinedTranscript,
              soap: soapResponse,
            },
            timestamp: Date.now(),
          });

          // Clear selected recordings and transcript
          if (hasSelectedRecordings) {
            clearSelectedRecordings();
          } else {
            setTranscriptText("");
          }

          // Open the SOAP notes editor with the generated notes
          setSoapEditorState({
            isOpen: true,
            soapNotes: soapResponse,
            transcript: combinedTranscript,
            actionId: actionId,
          });

          toast({
            title: "Success",
            description: "SOAP notes generated successfully",
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error generating SOAP notes:", error);
        toast({
          title: "Error",
          description: "Failed to generate SOAP notes",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingNotes(false);
      }
    }
  };

  // Function to open the SOAP editor for an existing SOAP action
  const openSoapEditor = (actionId: string) => {
    const soapAction = caseActions.find(
      (action) => action.id === actionId && action.type === "soap"
    );

    if (soapAction && soapAction.content.soap) {
      setSoapEditorState({
        isOpen: true,
        soapNotes: soapAction.content.soap,
        transcript: soapAction.content.transcript || "",
        actionId: soapAction.id,
      });
    }
  };

  return {
    form,
    isSubmittingCase,
    isGeneratingNotes,
    soapEditorState,
    onSubmit: form.handleSubmit(onSubmit),
    handleGenerateSoapNotes,
    handleSoapUpdate,
    closeSoapEditor,
    openSoapEditor,
  };
}
