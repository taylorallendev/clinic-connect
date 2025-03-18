"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "../simplified-store";
import { getEmailTemplates, ensureDefaultTemplates } from "../../template-actions";
import { generateContentFromTemplate } from "../actions";

export function useTemplateGeneration() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [availableTemplates, setAvailableTemplates] = useState<
    Array<{ id: number; name: string; type: string }>
  >([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  
  const { toast } = useToast();
  const { addCaseAction, selectedRecordings, actions } = useCaseStore();
  
  // Fetch available templates on mount
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      // First ensure the SOAP template exists
      await ensureDefaultTemplates();

      // Then fetch all templates
      const result = await getEmailTemplates();
      if (result.templates) {
        setAvailableTemplates(result.templates);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle generating content from a template for a specific recording
  const handleGenerateFromTemplate = async (
    actionId: string,
    transcript: string
  ) => {
    if (isGeneratingSoap) return;

    setIsGeneratingSoap(true);
    try {
      // Call the server action to generate content from the template
      // Use a default template ID if none is selected (1 is usually the default SOAP template)
      const templateIdToUse = selectedTemplateId
        ? parseInt(selectedTemplateId)
        : 1;
      
      const result = await generateContentFromTemplate([transcript], {
        templateId: templateIdToUse,
      });

      if (result.success && result.content) {
        if (
          result.template.type === "soap_notes" &&
          typeof result.content === "object"
        ) {
          // Create SOAP action with full SOAP structure
          const soapAction = {
            id: crypto.randomUUID(),
            type: "soap" as const,
            content: {
              transcript: transcript,
              soap: {
                subjective: result.content.subjective || "",
                objective: result.content.objective || "",
                assessment: result.content.assessment || "",
                plan: result.content.plan || "",
              },
            },
            timestamp: Date.now(),
          };
          
          // Add the SOAP action to the case store
          addCaseAction(soapAction);

          toast({
            title: "SOAP Note Generated",
            description: "SOAP note has been generated successfully",
          });
        } else {
          // For other template types
          const soapAction = {
            id: crypto.randomUUID(),
            type: "soap" as const,
            content: {
              transcript: transcript,
              soap: {
                subjective: `Generated using template: ${result.template.name}`,
                objective: "",
                assessment: "",
                plan: typeof result.content === "string" ? result.content : JSON.stringify(result.content),
              },
            },
            timestamp: Date.now(),
          };
          
          // Add the SOAP action to the case store
          addCaseAction(soapAction);

          toast({
            title: "Content Generated",
            description: `Content from template "${result.template.name}" has been generated`,
          });
        }
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: "An error occurred during content generation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);
    }
  };

  // Handle generating content from multiple selected recordings
  const handleGenerateFromMultiple = async () => {
    if (isGeneratingSoap || selectedRecordings.length === 0) return;

    setIsGeneratingSoap(true);
    try {
      // Gather all selected transcripts
      const selectedTranscripts = actions
        .filter(
          (action) =>
            action.type === "recording" &&
            selectedRecordings.includes(action.id)
        )
        .map((action) => action.content.transcript);

      if (selectedTranscripts.length === 0) {
        toast({
          title: "No Transcripts Selected",
          description: "Please select at least one recording to generate from",
          variant: "destructive",
        });
        return;
      }

      // Use a default template ID if none is selected
      const templateIdToUse = selectedTemplateId ? parseInt(selectedTemplateId) : 1;
      const result = await generateContentFromTemplate(selectedTranscripts, {
        templateId: templateIdToUse,
      });

      if (result.success && result.content) {
        if (
          result.template.type === "soap_notes" &&
          typeof result.content === "object"
        ) {
          // Create SOAP action
          const soapAction = {
            id: crypto.randomUUID(),
            type: "soap" as const,
            content: {
              transcript: selectedTranscripts.join("\n\n"),
              soap: {
                subjective: result.content.subjective || "",
                objective: result.content.objective || "",
                assessment: result.content.assessment || "",
                plan: result.content.plan || "",
              },
            },
            timestamp: Date.now(),
          };
          
          // Add the SOAP action to the case store
          addCaseAction(soapAction);

          toast({
            title: "SOAP Note Generated",
            description: `SOAP note has been generated from ${selectedTranscripts.length} transcripts`,
          });
        } else {
          // For other template types
          const soapAction = {
            id: crypto.randomUUID(),
            type: "soap" as const,
            content: {
              transcript: selectedTranscripts.join("\n\n"),
              soap: {
                subjective: `Generated using template: ${result.template.name}`,
                objective: "",
                assessment: "",
                plan: typeof result.content === "string" ? result.content : JSON.stringify(result.content),
              },
            },
            timestamp: Date.now(),
          };
          
          // Add the SOAP action to the case store
          addCaseAction(soapAction);

          toast({
            title: "Content Generated",
            description: `Content from template "${result.template.name}" has been generated`,
          });
        }
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating content from multiple recordings:", error);
      toast({
        title: "Error",
        description: "An error occurred during content generation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);
    }
  };
  
  return {
    selectedTemplateId,
    setSelectedTemplateId,
    availableTemplates,
    isLoadingTemplates,
    isGeneratingSoap,
    handleGenerateFromTemplate,
    handleGenerateFromMultiple,
  };
}