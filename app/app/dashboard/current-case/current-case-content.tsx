"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "@/store/use-case-store";
import {
  createCase,
  updateCase,
  getCase,
  diagnoseDatabaseSchema,
  generateContentFromTemplate,
} from "./actions";
import { caseFormSchema } from "./case-form";
import { ClientSideDate } from "./client-side-dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  FileText,
  Clock,
  Clipboard,
  ClipboardCheck,
  Loader2,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  ChevronsUp,
  ChevronsDown,
  Stethoscope,
  Mail,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { SoapNotesEditor } from "@/components/ui/soap-notes-editor";
import { useEmailButton } from "@/context/EmailButtonContext";
import { simpleSendEmail } from "./email-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEmailTemplates, ensureDefaultTemplates } from "../template-actions";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognitionType =
  | typeof window.SpeechRecognition
  | typeof window.webkitSpeechRecognition;

// Add these interfaces for the event types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

type FormValues = z.infer<typeof caseFormSchema>;

interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface ActionContent {
  transcript?: string;
  soap?: SoapResponse;
}

interface CaseAction {
  id: string;
  type: "recording" | "soap";
  content: ActionContent;
  timestamp: number;
}

// Helper function to format time in MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function CurrentCaseContent() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [savedCaseData, setSavedCaseData] = useState<FormValues | null>(null);
  const router = useRouter();
  const [recognition, setRecognition] = useState<SpeechRecognitionType | null>(
    null
  );
  const [transcriptText, setTranscriptText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Add state for expanded transcripts and SOAP sections
  const [expandedTranscripts, setExpandedTranscripts] = useState<
    Record<string, boolean>
  >({});
  const [expandedSoapSections, setExpandedSoapSections] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [expandedSoaps, setExpandedSoaps] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedSoapIds, setSelectedSoapIds] = useState<string[]>([]);
  const [editingSoapId, setEditingSoapId] = useState<string | null>(null);
  const [editingSoapData, setEditingSoapData] = useState<{
    action: CaseAction;
    transcript: string;
  } | null>(null);
  const [caseSummaryCollapsed, setCaseSummaryCollapsed] =
    useState<boolean>(true);

  // Access case store
  const {
    caseActions: actions,
    addCaseAction: addAction,
    currentCaseId,
  } = useCaseStore();

  // Initialize SOAP section states when actions change
  useEffect(() => {
    // Initialize section states for any new SOAP actions
    actions.forEach((action) => {
      if (
        action.type === "soap" &&
        action.content.soap &&
        !expandedSoapSections[action.id]
      ) {
        setExpandedSoapSections((prev) => ({
          ...prev,
          [action.id]: {
            subjective: true,
            objective: true,
            assessment: true,
            plan: true,
          },
        }));
      }
    });
  }, [actions, expandedSoapSections]);

  // Function to toggle all sections for a SOAP note
  const toggleAllSections = (actionId: string, expand: boolean) => {
    setExpandedSoapSections((prev) => ({
      ...prev,
      [actionId]: {
        subjective: expand,
        objective: expand,
        assessment: expand,
        plan: expand,
      },
    }));
  };

  // Function to handle editing SOAP notes
  const handleEditSoap = (action: CaseAction) => {
    if (action.type === "soap" && action.content.soap) {
      setEditingSoapId(action.id);
      setEditingSoapData({
        action,
        transcript: action.content.transcript || "",
      });
    }
  };

  // Function to toggle SOAP expansion
  const toggleSoapExpanded = (actionId: string) => {
    setExpandedSoaps((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  // Function to toggle SOAP selection
  const toggleSoapSelection = (actionId: string) => {
    setSelectedSoapIds((prev) => {
      if (prev.includes(actionId)) {
        return prev.filter((id) => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };

  // Function to close the SOAP editor
  const handleCloseSoapEditor = () => {
    setEditingSoapId(null);
    setEditingSoapData(null);
  };

  // Function to update SOAP notes when edited
  const handleUpdateSoapNotes = (updatedSoap: SoapResponse) => {
    if (editingSoapId && editingSoapData) {
      const action = editingSoapData.action;

      // Update the action in the store
      useCaseStore.getState().updateCaseAction(editingSoapId, {
        ...action,
        content: {
          ...action.content,
          soap: updatedSoap,
        },
      });

      // Update local state
      toast({
        title: "SOAP notes updated",
        description: "Your changes have been saved",
      });
    }
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      name: "",
      dateTime: new Date().toISOString().slice(0, 16),
      assignedTo: "",
      type: "checkup",
      status: "ongoing",
      visibility: "private",
    },
  });

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  // Initialize speech recognition when component mounts
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      // Use the appropriate constructor with proper type casting
      const SpeechRecognitionAPI = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as SpeechRecognitionType;
      const recognitionInstance = new SpeechRecognitionAPI();

      // Configure recognition
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      // Set up event handlers
      // Note: fullTranscriptRef is now defined outside the function

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        // Use continuous mode approach - build the complete transcript in real-time
        let transcript = "";

        // Process all results currently available in this session
        for (let i = 0; i < event.results.length; i++) {
          // Get the transcribed text from this result segment
          const result = event.results[i][0].transcript;

          // Add it to our complete transcript
          transcript += result + " ";
        }

        // Store and display the complete transcript
        fullTranscriptRef.current = transcript.trim();
        setTranscriptText(fullTranscriptRef.current);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
    }

    // Clean up
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [toast]);

  // Add this effect to load case data when currentCaseId changes
  useEffect(() => {
    const loadCaseData = async () => {
      if (currentCaseId) {
        try {
          const result = await getCase(parseInt(currentCaseId));

          if (result.success && result.data) {
            // Format the data to match the form structure
            const caseData: FormValues = {
              name: result.data.name,
              dateTime: new Date(result.data.dateTime)
                .toISOString()
                .slice(0, 16),
              assignedTo: result.data.assignedTo || "",
              type: result.data.type,
              status: result.data.status || "ongoing",
              visibility: result.data.visibility || "private",
            };

            // Update form with existing data
            form.reset(caseData);

            // Save to view state
            setSavedCaseData(caseData);

            // Set to view mode since we're loading an existing case
            setIsEditMode(false);
          }
        } catch (error) {
          console.error("Error loading case data:", error);
          toast({
            title: "Error loading case",
            description: "Failed to load case data",
            variant: "destructive",
          });
        }
      }
    };

    loadCaseData();
  }, [currentCaseId, form, toast]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const result = await createCase({
        ...data,
        visibility: data.visibility || "private",
        actions: actions.map((action) => ({
          id: action.id,
          type: action.type,
          content: {
            transcript: action.content.transcript,
            soap: action.content.soap,
          },
          timestamp: action.timestamp,
        })),
      });

      if (result.success) {
        useCaseStore.setState((state) => ({
          ...state,
          currentCaseId: result.data.id,
        }));

        // Save the case data to display in view mode
        setSavedCaseData(data);

        // Switch to view mode
        setIsEditMode(false);

        toast({
          title: "Case created successfully",
          description: `Case ID: ${result.data.id}`,
        });
      } else {
        toast({
          title: "Failed to create case",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error creating case",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle case update
  const handleUpdateCase = async (data: FormValues) => {
    setIsSaving(true);
    try {
      if (!currentCaseId) {
        throw new Error("No case ID found for update");
      }

      // First update the case metadata
      const result = await updateCase({
        ...data,
        id: parseInt(currentCaseId),
        visibility: data.visibility || "private",
        actions: actions.map((action) => ({
          id: action.id,
          type: action.type,
          content: {
            transcript: action.content.transcript,
            soap: action.content.soap,
          },
          timestamp: action.timestamp,
        })),
      });

      if (result.success) {
        // Also save the case actions to ensure they're persisted
        const actionsResult = await useCaseStore
          .getState()
          .saveActionsToCase(parseInt(currentCaseId));

        if (!actionsResult) {
          console.warn("Some case actions may not have been saved correctly");
        }

        setSavedCaseData(data);
        setIsEditMode(false);

        toast({
          title: "Case updated successfully",
          description: "Your changes have been saved",
        });
      } else {
        toast({
          title: "Failed to update case",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating case",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create refs outside the function
  const finalResultsRef = useRef<string[]>([]);
  const interimResultRef = useRef<string>("");
  const fullTranscriptRef = useRef<string>("");

  // Update the toggleRecording function
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);

      if (recognition) {
        recognition.stop();
      }

      try {
        // Wait a moment to ensure all transcription is processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate a unique ID for this recording
        const actionId = crypto.randomUUID();

        // Add the recording to our actions using the correct store method
        addAction({
          id: actionId,
          type: "recording",
          content: {
            transcript: transcriptText.trim() || "No transcription available",
          },
          timestamp: Date.now(),
        });

        // Update status to "ongoing" automatically
        if (form.getValues("status") !== "ongoing") {
          form.setValue("status", "ongoing");
          // If case already exists, update it
          if (currentCaseId) {
            handleUpdateCase(form.getValues());
          }
        }

        // Reset recording time and transcript
        setRecordingTime(0);

        toast({
          title: "Recording saved",
          description: "Your recording has been processed and saved.",
        });

        // Clear the transcript for the next recording
        setTranscriptText("");

        // Reset the transcript tracking refs
        finalResultsRef.current = [];
        interimResultRef.current = "";
        fullTranscriptRef.current = "";
      } catch (error) {
        console.error("Error processing recording:", error);
        toast({
          title: "Error",
          description: "Failed to process recording",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      setTranscriptText("");

      // Reset the transcript tracking refs
      finalResultsRef.current = [];
      interimResultRef.current = "";
      fullTranscriptRef.current = "";

      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.error("Error starting speech recognition:", error);
          toast({
            title: "Error",
            description: "Failed to start speech recognition",
            variant: "destructive",
          });
          setIsRecording(false);
        }
      }
    }
  };

  // State for template selector
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [availableTemplates, setAvailableTemplates] = useState<
    Array<{ id: number; name: string; type: string }>
  >([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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

    // Making template selection optional
    // if (!selectedTemplateId) {
    //   toast({
    //     title: "No Template Selected",
    //     description: "Please select a template first.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

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
          const soapAction: CaseAction = {
            id: crypto.randomUUID(),
            type: "soap",
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

          // Add the new action
          useCaseStore.getState().addCaseAction(soapAction);
        } else {
          // For other template types, create a simpler action
          const generatedAction: CaseAction = {
            id: crypto.randomUUID(),
            type: "soap",
            content: {
              transcript: transcript,
              soap: {
                subjective: `Generated using template: ${result.template.name}`,
                objective: "",
                assessment: "",
                plan:
                  typeof result.content === "string"
                    ? result.content
                    : JSON.stringify(result.content, null, 2),
              },
            },
            timestamp: Date.now(),
          };

          // Add the new action
          useCaseStore.getState().addCaseAction(generatedAction);
        }
      } else {
        throw new Error(
          result.error || "Failed to generate content from template"
        );
      }
    } catch (error) {
      console.error("Error generating content from template:", error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);

      // Clear selected recordings after generation (for single transcript)
      useCaseStore.getState().clearSelectedRecordings();
    }
  };

  // Handle generating content from multiple selected transcripts
  const handleGenerateFromMultiple = async () => {
    const selectedRecordingIds = useCaseStore.getState().selectedRecordings;

    if (selectedRecordingIds.length === 0 || isGeneratingSoap) return;

    // Making template selection optional
    // if (!selectedTemplateId) {
    //   toast({
    //     title: "No Template Selected",
    //     description: "Please select a template first.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsGeneratingSoap(true);
    try {
      // Get all the selected recordings
      const selectedRecordings = actions.filter(
        (action) =>
          action.type === "recording" &&
          selectedRecordingIds.includes(action.id)
      );

      // Sort recordings by timestamp to ensure chronological order
      selectedRecordings.sort((a, b) => a.timestamp - b.timestamp);

      // Extract transcripts from the selected recordings
      const transcripts = selectedRecordings
        .map((action) => action.content.transcript || "")
        .filter((transcript) => transcript.trim() !== "");

      if (transcripts.length === 0) {
        throw new Error("No valid transcripts selected");
      }

      // Log the number of transcripts being processed
      console.log(
        `Processing ${transcripts.length} transcripts for content generation`
      );

      // Create a combined transcript with clear separation between selections
      const combinedTranscript = selectedRecordings
        .map(
          (recording, index) =>
            `Recording ${index + 1} (${new Date(recording.timestamp).toLocaleString()}):\n${recording.content.transcript}`
        )
        .join("\n\n---\n\n");

      // Call the server action to generate content from the template
      // Use a default template ID if none is selected (1 is usually the default SOAP template)
      const templateIdToUse = selectedTemplateId
        ? parseInt(selectedTemplateId)
        : 1;
      const result = await generateContentFromTemplate(transcripts, {
        templateId: templateIdToUse,
      });

      if (result.success && result.content) {
        if (
          result.template.type === "soap_notes" &&
          typeof result.content === "object"
        ) {
          // Create SOAP action with full SOAP structure
          const soapAction: CaseAction = {
            id: crypto.randomUUID(),
            type: "soap",
            content: {
              transcript: combinedTranscript,
              soap: {
                subjective: result.content.subjective || "",
                objective: result.content.objective || "",
                assessment: result.content.assessment || "",
                plan: result.content.plan || "",
              },
            },
            timestamp: Date.now(),
          };

          // Add the new action
          useCaseStore.getState().addCaseAction(soapAction);
        } else {
          // For other template types, create a simpler action
          const generatedAction: CaseAction = {
            id: crypto.randomUUID(),
            type: "soap",
            content: {
              transcript: combinedTranscript,
              soap: {
                subjective: `Generated using template: ${result.template.name}`,
                objective: "",
                assessment: "",
                plan:
                  typeof result.content === "string"
                    ? result.content
                    : JSON.stringify(result.content, null, 2),
              },
            },
            timestamp: Date.now(),
          };

          // Add the new action
          useCaseStore.getState().addCaseAction(generatedAction);
        }
      } else {
        throw new Error(
          result.error || "Failed to generate content from template"
        );
      }
    } catch (error) {
      console.error(
        "Error generating content from multiple transcripts:",
        error
      );
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);

      // Clear selected recordings after generation (for multiple transcripts)
      useCaseStore.getState().clearSelectedRecordings();
    }
  };

  // When an action is selected:
  const handleActionSelect = (actionId: string) => {
    setSelectedActionId(actionId);
    setShowEmailButton(true);
  };

  // When an action is deselected:
  const handleActionDeselect = () => {
    setSelectedActionId(null);
    setShowEmailButton(false);
  };

  const [showEmailButton, setShowEmailButton] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // No longer needed as templates are loaded on component mount

  // Add email handling functions
  const handleEmailClick = () => {
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!selectedActionId || !emailTo || !emailFrom) {
      toast({
        title: "Missing Information",
        description: "Please fill in all email fields",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const selectedAction = actions.find(
        (action) => action.id === selectedActionId
      );
      if (!selectedAction) throw new Error("Selected action not found");

      // Format the content to be sent
      let emailContent = "";
      let subject = "Clinic Connect: Case Update";

      // Add case information if available
      if (savedCaseData) {
        emailContent += `<h2>Case Information</h2>
<p><strong>Name:</strong> ${savedCaseData.name}<br>
<strong>Date:</strong> ${new Date(savedCaseData.dateTime).toLocaleString()}<br>
<strong>Type:</strong> ${savedCaseData.type.replace("_", " ")}<br>
<strong>Status:</strong> ${savedCaseData.status || "Ongoing"}</p>
<hr>`;
      }

      // If the selected action is a recording
      if (selectedAction.type === "recording") {
        // Add the recording transcript with some formatting
        if (selectedAction.content.transcript) {
          subject = `Clinic Connect: Transcript for ${savedCaseData?.name || "Case"}`;
          emailContent += `<h2>Recording Transcript</h2>
<p><strong>Date:</strong> ${new Date(selectedAction.timestamp).toLocaleString()}</p>
<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${selectedAction.content.transcript}</pre>`;
        }
      }
      // If the selected action is a SOAP note or other generated content
      else if (selectedAction.type === "soap") {
        subject = `Clinic Connect: ${savedCaseData?.name || "Case"} - Notes`;

        // First add the transcript if available
        if (selectedAction.content.transcript) {
          emailContent += `<h2>Recording</h2>
<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${selectedAction.content.transcript}</pre>
<hr>`;
        }

        // Then add the SOAP note content with formatting
        if (selectedAction.content.soap) {
          const soap = selectedAction.content.soap;

          emailContent += `<h2>Generated Notes (${new Date(selectedAction.timestamp).toLocaleString()})</h2>`;

          // For standard SOAP notes
          if (
            soap.subjective.trim() &&
            soap.objective.trim() &&
            soap.assessment.trim() &&
            soap.plan.trim() &&
            !soap.subjective.startsWith("Generated using template:")
          ) {
            emailContent += `<h3>Subjective</h3>
<div>${soap.subjective}</div>

<h3>Objective</h3>
<div>${soap.objective}</div>

<h3>Assessment</h3>
<div>${soap.assessment}</div>

<h3>Plan</h3>
<div>${soap.plan}</div>`;
          }
          // For other template-based content
          else if (soap.plan.trim()) {
            // Use the plan field to store the content for non-SOAP templates
            emailContent += `<div>${soap.plan}</div>`;
          }
        }
      }

      // Send the email with direct content
      const result = await simpleSendEmail(
        emailTo,
        subject,
        emailContent,
        emailFrom
      );

      if (result.success) {
        toast({
          title: "Email Sent",
          description: "The email has been sent successfully",
        });
        setShowEmailDialog(false);

        // Clear the form
        setEmailTo("");
        setEmailFrom("");
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-background">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-card-foreground">
          Current Case
        </h1>
        <div className="flex items-center gap-3">
          {/* Reset button moved to the left */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-card-foreground hover:bg-muted/30 hover:text-card-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-card-foreground">
                  Reset case?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will clear all case information, transcripts, and SOAP
                  notes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted text-card-foreground border-muted hover:bg-muted/30">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => {
                    // Reset without saving
                    useCaseStore.getState().reset();
                    form.reset({
                      name: "",
                      dateTime: new Date().toISOString().slice(0, 16),
                      assignedTo: "",
                      type: "checkup",
                      status: "ongoing",
                      visibility: "private",
                    });

                    // Ensure we're in edit mode
                    setIsEditMode(true);

                    toast({
                      title: "Case reset",
                      description: "All case data has been cleared",
                    });
                  }}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save button */}
          <Button
            onClick={form.handleSubmit(
              currentCaseId ? handleUpdateCase : onSubmit
            )}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {currentCaseId ? "Update Case" : "Save Case"}
          </Button>

          {/* New Case button */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={async () => {
              // If there's a current case or unsaved changes, save them first
              if (actions.length > 0 || form.formState.isDirty) {
                await form.handleSubmit(
                  currentCaseId ? handleUpdateCase : onSubmit
                )();
              }

              // Reset store and form to start fresh
              useCaseStore.getState().reset();
              form.reset({
                name: "",
                dateTime: new Date().toISOString().slice(0, 16),
                assignedTo: "",
                type: "checkup",
                status: "ongoing",
                visibility: "private",
              });

              // Ensure we're ready for a new case
              setIsEditMode(true);

              toast({
                title: "New case created",
                description: "You can now start working on a new case",
              });
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Unified layout with all content visible at once */}
      <div className="grid grid-cols-1 gap-6">
        {/* Case Details Section */}
        <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-card-foreground flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-card-foreground" />
                Case Information
              </div>
              {!isEditMode && savedCaseData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-muted/20 border-muted/30 text-card-foreground hover:bg-muted/40"
                  onClick={() => setIsEditMode(true)}
                >
                  Edit Case
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isEditMode ? (
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Case Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter case name"
                              {...field}
                              className="bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-muted/20 border-input text-foreground focus-visible:ring-ring"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Case Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/20 border-input text-foreground focus:ring-ring">
                                <SelectValue placeholder="Select case type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="checkup">Checkup</SelectItem>
                              <SelectItem value="emergency">
                                Emergency
                              </SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="follow_up">
                                Follow-up
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/20 border-input text-foreground focus:ring-ring">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="exported">Exported</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              savedCaseData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-card-foreground mb-1">
                        Case Name
                      </h3>
                      <p className="text-card-foreground text-lg">
                        {savedCaseData.name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-card-foreground mb-1">
                        Date & Time
                      </h3>
                      <p className="text-card-foreground text-lg">
                        <ClientSideDate
                          timestamp={new Date(savedCaseData.dateTime).getTime()}
                        />
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-card-foreground mb-1">
                        Case Type
                      </h3>
                      <p className="text-card-foreground text-lg capitalize">
                        {savedCaseData.type.replace("_", " ")}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-card-foreground mb-1">
                        Status
                      </h3>
                      <p className="text-card-foreground text-lg">
                        {savedCaseData.status
                          ? savedCaseData.status.replace("_", " ")
                          : "SCHEDULED"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Recording Section */}
        <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-card-foreground flex items-center">
              <Mic className="h-5 w-5 mr-2 text-card-foreground inline" />
              Voice Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              {/* Recording button */}
              <div className="mb-6">
                <Button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative z-10 w-20 h-20 rounded-full ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              </div>

              <div className="text-3xl font-mono text-card-foreground mb-2">
                {formatTime(recordingTime)}
              </div>

              <p className="text-muted-foreground text-center max-w-md">
                {isRecording
                  ? "Recording in progress. Click the button to stop recording."
                  : isProcessing
                    ? "Processing your recording..."
                    : "Click the microphone button to start recording your case notes."}
              </p>

              {/* Live transcription display */}
              {isRecording && (
                <div className="mt-6 w-full">
                  <h3 className="text-muted-foreground text-sm font-medium mb-2">
                    Live Transcription
                  </h3>
                  <div className="bg-muted/30 border border-muted/30 rounded-lg p-4 text-card-foreground min-h-[100px] max-h-[200px] overflow-y-auto">
                    {transcriptText || "Listening..."}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Case Actions Section */}
        <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-card-foreground flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-card-foreground" />
                Case Actions
              </CardTitle>
              {actions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Check for recordings
                      const selectedRecordingsCount =
                        useCaseStore.getState().selectedRecordings.length;
                      const recordingsCount = actions.filter(
                        (action) => action.type === "recording"
                      ).length;

                      // Check for SOAP notes
                      const selectedSoapCount = selectedSoapIds.length;
                      const soapCount = actions.filter(
                        (action) => action.type === "soap"
                      ).length;

                      // If any recordings or SOAP notes are selected, clear all selections
                      if (
                        selectedRecordingsCount > 0 ||
                        selectedSoapCount > 0
                      ) {
                        // Clear all selections
                        useCaseStore.getState().clearSelectedRecordings();
                        setSelectedSoapIds([]);
                        // Hide email button
                        handleActionDeselect();
                      } else {
                        // Select all actions (both recordings and SOAP notes)

                        // Select all recordings
                        const recordingIds = actions
                          .filter((action) => action.type === "recording")
                          .map((action) => action.id);
                        recordingIds.forEach((id) => {
                          useCaseStore.getState().toggleRecordingSelection(id);
                        });

                        // Select all SOAP notes
                        const soapIds = actions
                          .filter((action) => action.type === "soap")
                          .map((action) => action.id);
                        setSelectedSoapIds(soapIds);

                        // Show email button with the first action if available
                        if (actions.length > 0) {
                          handleActionSelect(actions[0].id);
                        }
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground border-muted/30"
                  >
                    {useCaseStore.getState().selectedRecordings.length > 0 ||
                    selectedSoapIds.length > 0
                      ? "Clear Selection"
                      : "Select All"}
                  </Button>

                  {/* Template Selector */}
                  {actions.filter((action) => action.type === "recording")
                    .length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTemplateId}
                        onValueChange={setSelectedTemplateId}
                      >
                        <SelectTrigger
                          className="w-[180px] bg-primary hover:bg-primary/90 border-muted/50 font-normal text-sm text-white"
                          style={{ color: "white" }} // Force white text color for all states
                        >
                          <SelectValue
                            placeholder="Select Template"
                            className="!text-white white-placeholder"
                            style={{ color: "white" }} // Force white text color
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                          {isLoadingTemplates ? (
                            <SelectItem
                              value="loading"
                              disabled
                              className="text-muted-foreground"
                            >
                              Loading templates...
                            </SelectItem>
                          ) : availableTemplates.length === 0 ? (
                            <SelectItem
                              value="none"
                              disabled
                              className="text-muted-foreground"
                            >
                              No templates available
                            </SelectItem>
                          ) : (
                            availableTemplates.map((template) => (
                              <SelectItem
                                key={template.id}
                                value={template.id.toString()}
                                className="text-card-foreground"
                              >
                                {template.name} ({template.type})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleGenerateFromMultiple}
                        disabled={
                          isGeneratingSoap ||
                          useCaseStore.getState().selectedRecordings.length ===
                            0 ||
                          !selectedTemplateId
                        }
                      >
                        {isGeneratingSoap ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {actions.length > 0 ? (
              <div className="space-y-4">
                {/* Separate Transcriptions and Generations sections */}
                <div className="space-y-6">
                  {/* Transcriptions Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-card-foreground border-b border-muted/30 pb-2">
                      Transcriptions
                    </h3>
                    {actions.filter((action) => action.type === "recording")
                      .length > 0 ? (
                      actions
                        .filter((action) => action.type === "recording")
                        .map((action: CaseAction, index) => {
                          const isSelected = useCaseStore
                            .getState()
                            .selectedRecordings.includes(action.id);
                          const isTranscriptExpanded =
                            expandedTranscripts[action.id] || false;

                          const toggleExpanded = () => {
                            setExpandedTranscripts((prev) => ({
                              ...prev,
                              [action.id]: !prev[action.id],
                            }));
                          };

                          return (
                            <Card
                              key={action.id}
                              className={`bg-muted/20 border-muted/30 ${
                                isSelected ? "ring-2 ring-blue-400" : ""
                              }`}
                            >
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-center w-full">
                                  <div
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={toggleExpanded}
                                  >
                                    <label
                                      htmlFor={`recording-${action.id}`}
                                      className="text-card-foreground font-medium cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Recording {index + 1}
                                    </label>
                                    <Badge className="bg-muted/50 text-muted-foreground border-0">
                                      Transcript
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-1">
                                      <ClientSideDate
                                        timestamp={action.timestamp}
                                      />
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`recording-${action.id}`}
                                      checked={isSelected}
                                      onChange={() => {
                                        useCaseStore
                                          .getState()
                                          .toggleRecordingSelection(action.id);
                                        // Show/hide email button based on selection
                                        if (!isSelected) {
                                          handleActionSelect(action.id);
                                        } else {
                                          handleActionDeselect();
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-muted/70 text-muted-foreground focus:ring-blue-500 mr-3"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpanded();
                                      }}
                                      className="h-8 w-8 p-0 text-card-foreground hover:bg-muted/30"
                                    >
                                      {isTranscriptExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {!isTranscriptExpanded && (
                                  <div
                                    className="text-muted-foreground/80 text-sm mt-2 cursor-pointer line-clamp-1"
                                    onClick={toggleExpanded}
                                  >
                                    {action.content.transcript}
                                  </div>
                                )}
                              </CardHeader>
                              {isTranscriptExpanded && (
                                <CardContent className="p-4 pt-0">
                                  <div
                                    className="text-muted-foreground text-sm mt-2 whitespace-pre-line"
                                    onClick={() => {
                                      // Toggle the recording selection when clicked
                                      useCaseStore
                                        .getState()
                                        .toggleRecordingSelection(action.id);
                                      // Show/hide email button based on selection
                                      if (!isSelected) {
                                        handleActionSelect(action.id);
                                      } else {
                                        handleActionDeselect();
                                      }
                                    }}
                                  >
                                    {action.content.transcript}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Clipboard className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium text-card-foreground mb-1">
                          No Transcriptions Yet
                        </h3>
                        <p className="text-muted-foreground max-w-md text-sm">
                          Record your case notes to create transcripts.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Generations Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-card-foreground border-b border-muted/30 pb-2">
                      Generations
                    </h3>
                    {actions.filter((action) => action.type === "soap").length >
                    0 ? (
                      actions
                        .filter(
                          (action) =>
                            action.type === "soap" && action.content.soap
                        )
                        .map((action: CaseAction, index) => {
                          const isSoapSelected = selectedSoapIds.includes(
                            action.id
                          );
                          const isSoapExpanded =
                            expandedSoaps[action.id] || false;

                          // Try to parse the SOAP note from plan if it's a string containing JSON
                          let parsedSoap = action.content.soap;

                          // Check if plan field contains JSON structure with SOAP fields
                          if (
                            action.content.soap?.plan &&
                            typeof action.content.soap.plan === "string"
                          ) {
                            try {
                              // Check if the plan looks like it contains JSON
                              if (
                                action.content.soap.plan.includes(
                                  '"subjective":'
                                ) ||
                                action.content.soap.plan.includes(
                                  '"objective":'
                                ) ||
                                action.content.soap.plan.includes(
                                  '"assessment":'
                                ) ||
                                action.content.soap.plan.includes('"plan":')
                              ) {
                                const parsedPlan = JSON.parse(
                                  action.content.soap.plan
                                );

                                // If it successfully parsed and has SOAP structure, use it
                                if (
                                  parsedPlan &&
                                  typeof parsedPlan === "object" &&
                                  (parsedPlan.subjective ||
                                    parsedPlan.objective ||
                                    parsedPlan.assessment ||
                                    parsedPlan.plan)
                                ) {
                                  parsedSoap = parsedPlan;
                                }
                              }
                            } catch (e) {
                              console.error(
                                "Failed to parse SOAP JSON from plan field:",
                                e
                              );
                            }
                          }

                          // Determine if this is a SOAP note or another template type
                          const isSoapFormat =
                            parsedSoap &&
                            parsedSoap.subjective &&
                            parsedSoap.objective &&
                            parsedSoap.assessment &&
                            parsedSoap.plan &&
                            !parsedSoap.subjective.startsWith(
                              "Generated using template:"
                            );

                          // Get template name from content if available
                          const templateName =
                            parsedSoap?.subjective?.startsWith(
                              "Generated using template:"
                            )
                              ? parsedSoap.subjective
                                  .replace("Generated using template:", "")
                                  .trim()
                              : "SOAP Notes";
                          return (
                            <Card
                              key={action.id}
                              className={`bg-muted/20 border-muted/30 ${
                                isSoapSelected ? "ring-2 ring-green-400" : ""
                              }`}
                            >
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-center w-full">
                                  <div
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={() =>
                                      toggleSoapExpanded(action.id)
                                    }
                                  >
                                    <label
                                      htmlFor={`soap-${action.id}`}
                                      className="text-card-foreground font-medium cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {templateName} {index + 1}
                                    </label>
                                    <Badge
                                      className={`${isSoapFormat ? "bg-green-700/50 text-green-100" : "bg-purple-700/50 text-purple-100"} border-0`}
                                    >
                                      {isSoapFormat ? "SOAP" : "Template"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-1">
                                      <ClientSideDate
                                        timestamp={action.timestamp}
                                      />
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`soap-${action.id}`}
                                      checked={isSoapSelected}
                                      onChange={() => {
                                        toggleSoapSelection(action.id);
                                        if (!isSoapSelected) {
                                          handleActionSelect(action.id);
                                        } else {
                                          handleActionDeselect();
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-green-700 text-green-600 focus:ring-green-500 mr-3"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleSoapExpanded(action.id)
                                      }
                                      className="h-8 w-8 p-0 text-card-foreground hover:bg-muted/30"
                                    >
                                      {isSoapExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              {isSoapExpanded && (
                                <CardContent className="p-4">
                                  {action.content.soap &&
                                    (isSoapFormat ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-end gap-1 mb-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              // Check if all sections are currently expanded
                                              const allExpanded = Object.values(
                                                expandedSoapSections[
                                                  action.id
                                                ] || {}
                                              ).every((expanded) => expanded);
                                              // Toggle to opposite state
                                              toggleAllSections(
                                                action.id,
                                                !allExpanded
                                              );
                                            }}
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted/20"
                                            title={
                                              Object.values(
                                                expandedSoapSections[
                                                  action.id
                                                ] || {}
                                              ).every((expanded) => expanded)
                                                ? "Collapse all sections"
                                                : "Expand all sections"
                                            }
                                          >
                                            {Object.values(
                                              expandedSoapSections[action.id] ||
                                                {}
                                            ).every((expanded) => expanded) ? (
                                              <>
                                                <ChevronsUp className="h-3 w-3 mr-1" />
                                                Collapse
                                              </>
                                            ) : (
                                              <>
                                                <ChevronsDown className="h-3 w-3 mr-1" />
                                                Expand
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleEditSoap(action)
                                            }
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted/20"
                                            title="Edit SOAP notes"
                                          >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                          </Button>
                                        </div>

                                        {/* Subjective */}
                                        <div className="border border-muted/30 rounded-lg overflow-hidden">
                                          <div
                                            className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSoapSections(
                                                (prev) => ({
                                                  ...prev,
                                                  [action.id]: {
                                                    ...prev[action.id],
                                                    subjective:
                                                      !prev[action.id]
                                                        .subjective,
                                                  },
                                                })
                                              );
                                            }}
                                          >
                                            <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                                              <Badge className="bg-muted text-muted-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                                                S
                                              </Badge>
                                              Subjective
                                            </h4>
                                            <div className="flex items-center">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(
                                                    parsedSoap?.subjective || ""
                                                  );
                                                  toast({
                                                    title: "Copied",
                                                    description:
                                                      "Subjective section copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-card-foreground"
                                              >
                                                {expandedSoapSections[action.id]
                                                  .subjective ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          {expandedSoapSections[action.id]
                                            .subjective && (
                                            <div
                                              className="p-3 text-muted-foreground text-sm"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  parsedSoap?.subjective || "",
                                              }}
                                            />
                                          )}
                                        </div>

                                        {/* Objective */}
                                        <div className="border border-muted/30 rounded-lg overflow-hidden">
                                          <div
                                            className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSoapSections(
                                                (prev) => ({
                                                  ...prev,
                                                  [action.id]: {
                                                    ...prev[action.id],
                                                    objective:
                                                      !prev[action.id]
                                                        .objective,
                                                  },
                                                })
                                              );
                                            }}
                                          >
                                            <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                                              <Badge className="bg-green-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                                                O
                                              </Badge>
                                              Objective
                                            </h4>
                                            <div className="flex items-center">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(
                                                    parsedSoap?.objective || ""
                                                  );
                                                  toast({
                                                    title: "Copied",
                                                    description:
                                                      "Objective section copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-card-foreground"
                                              >
                                                {expandedSoapSections[action.id]
                                                  .objective ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          {expandedSoapSections[action.id]
                                            .objective && (
                                            <div
                                              className="p-3 text-muted-foreground text-sm"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  parsedSoap?.objective || "",
                                              }}
                                            />
                                          )}
                                        </div>

                                        {/* Assessment */}
                                        <div className="border border-muted/30 rounded-lg overflow-hidden">
                                          <div
                                            className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSoapSections(
                                                (prev) => ({
                                                  ...prev,
                                                  [action.id]: {
                                                    ...prev[action.id],
                                                    assessment:
                                                      !prev[action.id]
                                                        .assessment,
                                                  },
                                                })
                                              );
                                            }}
                                          >
                                            <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                                              <Badge className="bg-purple-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                                                A
                                              </Badge>
                                              Assessment
                                            </h4>
                                            <div className="flex items-center">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(
                                                    parsedSoap?.assessment || ""
                                                  );
                                                  toast({
                                                    title: "Copied",
                                                    description:
                                                      "Assessment section copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-card-foreground"
                                              >
                                                {expandedSoapSections[action.id]
                                                  .assessment ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          {expandedSoapSections[action.id]
                                            .assessment && (
                                            <div
                                              className="p-3 text-muted-foreground text-sm"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  parsedSoap?.assessment || "",
                                              }}
                                            />
                                          )}
                                        </div>

                                        {/* Plan */}
                                        <div className="border border-muted/30 rounded-lg overflow-hidden">
                                          <div
                                            className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSoapSections(
                                                (prev) => ({
                                                  ...prev,
                                                  [action.id]: {
                                                    ...prev[action.id],
                                                    plan: !prev[action.id].plan,
                                                  },
                                                })
                                              );
                                            }}
                                          >
                                            <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                                              <Badge className="bg-amber-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                                                P
                                              </Badge>
                                              Plan
                                            </h4>
                                            <div className="flex items-center">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-muted-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(
                                                    parsedSoap?.plan || ""
                                                  );
                                                  toast({
                                                    title: "Copied",
                                                    description:
                                                      "Plan section copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-card-foreground"
                                              >
                                                {expandedSoapSections[action.id]
                                                  .plan ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          {expandedSoapSections[action.id]
                                            .plan && (
                                            <div
                                              className="p-3 text-muted-foreground text-sm"
                                              dangerouslySetInnerHTML={{
                                                __html: parsedSoap?.plan || "",
                                              }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-end gap-1 mb-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-xs text-muted-foreground"
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                parsedSoap?.plan || ""
                                              );
                                              toast({
                                                title: "Copied",
                                                description:
                                                  "Content copied to clipboard",
                                              });
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy
                                          </Button>
                                        </div>
                                        <div className="border border-muted/30 rounded-lg overflow-hidden">
                                          <div className="p-3 text-muted-foreground text-sm whitespace-pre-wrap">
                                            {parsedSoap?.plan || ""}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </CardContent>
                              )}
                            </Card>
                          );
                        })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Clipboard className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium text-card-foreground mb-1">
                          No Generations Yet
                        </h3>
                        <p className="text-muted-foreground max-w-md text-sm">
                          Select one or more transcripts and generate SOAP
                          notes.
                        </p>
                      </div>
                    )}
                  </div>

                  {actions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Clipboard className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-xl font-medium text-card-foreground mb-2">
                        No Case Actions Yet
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Record your case notes to create transcripts and
                        generate SOAP notes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clipboard className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium text-card-foreground mb-2">
                  No Case Actions Yet
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Record your case notes to create transcripts and generate SOAP
                  notes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Summary Card */}
        {actions.length > 0 && (
          <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
            <CardHeader
              className="border-b border-border bg-muted/20 cursor-pointer"
              onClick={() => {
                // Add state for case summary collapse
                setCaseSummaryCollapsed(!caseSummaryCollapsed);
              }}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-card-foreground flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-card-foreground" />
                  Case Summary
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-card-foreground hover:bg-muted/30"
                >
                  {caseSummaryCollapsed ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {!caseSummaryCollapsed && (
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted/30 backdrop-blur-sm border-muted/20 rounded-xl p-4 shadow-md shadow-muted/20">
                    <div className="flex items-center">
                      <div className="rounded-full bg-muted/30 p-2 mr-2">
                        <Clock className="h-5 w-5 text-card-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground/90">
                        Recording Time
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-card-foreground">
                        {formatTime(
                          actions.filter(
                            (action) => action.type === "recording"
                          ).length * 60
                        )}
                      </span>
                      <p className="text-xs text-muted-foreground/90 mt-1">
                        Total recording duration
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/30 backdrop-blur-sm border-muted/20 rounded-xl p-4 shadow-md shadow-muted/20">
                    <div className="flex items-center">
                      <div className="rounded-full bg-muted/30 p-2 mr-2">
                        <FileText className="h-5 w-5 text-card-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground/90">
                        Case Actions
                      </span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-card-foreground">
                        {actions.length}
                      </span>
                      <p className="text-xs text-muted-foreground/90 mt-1">
                        <span className="font-medium">
                          {
                            actions.filter(
                              (action) => action.type === "recording"
                            ).length
                          }
                        </span>{" "}
                        transcripts,{" "}
                        <span className="font-medium">
                          {
                            actions.filter((action) => action.type === "soap")
                              .length
                          }
                        </span>{" "}
                        SOAP notes
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/30 backdrop-blur-sm border-muted/20 rounded-xl p-4 shadow-md shadow-muted/20">
                    <div className="flex items-center">
                      <div className="rounded-full bg-muted/30 p-2 mr-2">
                        <ClipboardCheck className="h-5 w-5 text-card-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground/90">
                        SOAP Progress
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center">
                        {actions.filter((action) => action.type === "soap")
                          .length > 0 ? (
                          <>
                            <span className="text-2xl font-bold text-card-foreground">
                              Complete
                            </span>
                            <Badge className="ml-2 bg-success/40 text-success-foreground border-muted/30">
                              {
                                actions.filter(
                                  (action) => action.type === "soap"
                                ).length
                              }{" "}
                              generated
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-card-foreground">
                              Pending
                            </span>
                            <Badge className="ml-2 bg-warning/40 text-warning-foreground border-muted/30">
                              0 generated
                            </Badge>
                          </>
                        )}
                      </div>
                      <Progress
                        value={
                          actions.filter((action) => action.type === "soap")
                            .length > 0
                            ? 100
                            : 0
                        }
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* SOAP Notes Editor Modal */}
      {editingSoapId && editingSoapData && (
        <SoapNotesEditor
          soapNotes={editingSoapData.action.content.soap!}
          transcript={editingSoapData.transcript}
          onClose={handleCloseSoapEditor}
          onUpdate={handleUpdateSoapNotes}
          actionId={editingSoapId}
        />
      )}

      {/* Add the floating email button */}
      {showEmailButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={handleEmailClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      )}

      {/* Add email dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Send Email
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send the selected case action by email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="from"
                className="text-sm font-medium text-muted-foreground"
              >
                From Email
              </label>
              <Input
                id="from"
                type="email"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder="clinic@example.com"
                className="bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="to"
                className="text-sm font-medium text-muted-foreground"
              >
                To Email
              </label>
              <Input
                id="to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="owner@example.com"
                className="bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEmailDialog(false);
              }}
              className="text-muted-foreground hover:text-muted-foreground/90 hover:bg-muted/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailTo || !emailFrom}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
