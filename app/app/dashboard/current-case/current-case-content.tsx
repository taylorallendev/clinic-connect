"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "@/store/use-case-store";
import { createCase, generateSoapNotes, updateCase, getCase, diagnoseDatabaseSchema } from "./actions";
import { caseFormSchema } from "./case-form";
import { ClientSideDate } from "./client-side-dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Play,
  Pause,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Clipboard,
  ClipboardCheck,
  Loader2,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  Maximize2,
  CornerLeftUp,
  CornerRightDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { SoapNotesEditor } from "@/components/ui/soap-notes-editor";

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
    } & { length: number };
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
  const [soapNotes, setSoapNotes] = useState<SoapResponse | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [savedCaseData, setSavedCaseData] = useState<FormValues | null>(null);
  const router = useRouter();
  const [recognition, setRecognition] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Add state for expanded transcripts and SOAP sections
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [expandedSoapSections, setExpandedSoapSections] = useState<Record<string, Record<string, boolean>>>({});
  const [editingSoapId, setEditingSoapId] = useState<string | null>(null);
  const [editingSoapData, setEditingSoapData] = useState<{action: CaseAction, transcript: string} | null>(null);
  const [caseSummaryCollapsed, setCaseSummaryCollapsed] = useState<boolean>(false);
  
  // Access case store
  const {
    caseActions: actions,
    addCaseAction: addAction,
    currentCaseId,
  } = useCaseStore();
  
  // Initialize SOAP section states when actions change
  useEffect(() => {
    // Initialize section states for any new SOAP actions
    actions.forEach(action => {
      if (action.type === "soap" && action.content.soap && !expandedSoapSections[action.id]) {
        setExpandedSoapSections(prev => ({
          ...prev,
          [action.id]: {
            subjective: true,
            objective: true,
            assessment: true,
            plan: true
          }
        }));
      }
    });
  }, [actions, expandedSoapSections]);
  
  // Function to toggle all sections for a SOAP note
  const toggleAllSections = (actionId: string, expand: boolean) => {
    setExpandedSoapSections(prev => ({
      ...prev,
      [actionId]: {
        subjective: expand,
        objective: expand,
        assessment: expand,
        plan: expand
      }
    }));
  };
  
  // Function to handle editing SOAP notes
  const handleEditSoap = (action: CaseAction) => {
    if (action.type === "soap" && action.content.soap) {
      setEditingSoapId(action.id);
      setEditingSoapData({
        action,
        transcript: action.content.transcript || ""
      });
    }
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
          soap: updatedSoap
        }
      });
      
      // Update local state
      toast({
        title: "SOAP notes updated",
        description: "Your changes have been saved"
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
          // You would need to implement this server action
          const result = await getCase(parseInt(currentCaseId));

          if (result.success && result.data) {
            // Format the data to match the form structure
            const caseData: FormValues = {
              name: result.data.name,
              dateTime: new Date(result.data.dateTime)
                .toISOString()
                .slice(0, 16),
              assignedTo: result.data.assignedTo || "",
              visibility: result.data.visibility,
              type: result.data.type,
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

      const result = await updateCase({
        ...data,
        id: parseInt(currentCaseId),
        actions: [], // We're not updating actions here
      });

      if (result.success) {
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

  // Handle generating SOAP notes for a specific recording
  const handleGenerateSoap = async (actionId: string, transcript: string) => {
    if (isGeneratingSoap) return;

    setIsGeneratingSoap(true);
    try {
      // Call the server action to generate SOAP notes
      const result = await generateSoapNotes([transcript]);

      if (result.success && result.soapNotes) {
        // Update the action with the generated SOAP notes
        const updatedAction = actions.find((action) => action.id === actionId);

        if (updatedAction) {
          // Create a properly typed SOAP response
          const soapData: SoapResponse = {
            subjective: result.soapNotes.subjective || "",
            objective: result.soapNotes.objective || "",
            assessment: result.soapNotes.assessment || "",
            plan: result.soapNotes.plan || "",
          };

          // Update the action with properly typed data
          useCaseStore.getState().updateCaseAction(actionId, {
            ...updatedAction,
            content: {
              ...updatedAction.content,
              soap: soapData,
            },
          });

          // Update the SOAP notes in local state with properly typed data
          setSoapNotes(soapData);
        }

        toast({
          title: "SOAP notes generated",
          description: "SOAP notes have been generated successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate SOAP notes");
      }
    } catch (error) {
      console.error("Error generating SOAP notes:", error);
      toast({
        title: "Error",
        description: "Failed to generate SOAP notes",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);
    }
  };
  
  // Handle generating SOAP notes from multiple selected transcripts
  const handleGenerateMultipleSoap = async () => {
    const selectedRecordingIds = useCaseStore.getState().selectedRecordings;
    
    if (selectedRecordingIds.length === 0 || isGeneratingSoap) return;
    
    setIsGeneratingSoap(true);
    try {
      // Get all the selected recordings
      const selectedRecordings = actions.filter(
        action => action.type === "recording" && selectedRecordingIds.includes(action.id)
      );
      
      // Sort recordings by timestamp to ensure chronological order
      selectedRecordings.sort((a, b) => a.timestamp - b.timestamp);
      
      // Extract transcripts from the selected recordings
      const transcripts = selectedRecordings.map(
        action => action.content.transcript || ""
      ).filter(transcript => transcript.trim() !== "");
      
      if (transcripts.length === 0) {
        throw new Error("No valid transcripts selected");
      }
      
      // Log the number of transcripts being processed and their content for debugging
      console.log(`Processing ${transcripts.length} transcripts for SOAP notes generation`);
      console.log('Transcript contents:', JSON.stringify(transcripts));
      
      // Call the server action to generate SOAP notes from multiple transcripts
      // The transcripts array is passed directly to ensure all content is processed
      const result = await generateSoapNotes(transcripts);
      
      if (result.success && result.soapNotes) {
        // Create a properly typed SOAP response
        const soapData: SoapResponse = {
          subjective: result.soapNotes.subjective || "",
          objective: result.soapNotes.objective || "",
          assessment: result.soapNotes.assessment || "",
          plan: result.soapNotes.plan || "",
        };
        
        // Create a combined transcript with clear separation between selections
        const combinedTranscript = selectedRecordings.map((recording, index) => 
          `Recording ${index + 1} (${new Date(recording.timestamp).toLocaleString()}):\n${recording.content.transcript}`
        ).join('\n\n---\n\n');
        
        // Create a new SOAP action to store the generated notes
        const soapAction: CaseAction = {
          id: crypto.randomUUID(),
          type: "soap",
          content: {
            transcript: combinedTranscript,
            soap: soapData,
          },
          timestamp: Date.now(),
        };
        
        // Add the new SOAP action to the case
        useCaseStore.getState().addCaseAction(soapAction);
        
        // Update the SOAP notes in local state
        setSoapNotes(soapData);
        
        // Clear the selected recordings
        useCaseStore.getState().clearSelectedRecordings();
        
        toast({
          title: "SOAP notes generated",
          description: `SOAP notes generated from ${transcripts.length} selected transcripts.`,
        });
      } else {
        throw new Error(result.error || "Failed to generate SOAP notes");
      }
    } catch (error) {
      console.error("Error generating SOAP notes from multiple transcripts:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate SOAP notes",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSoap(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-gradient-to-br from-blue-950 to-indigo-950">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-blue-50">Current Case</h1>
        <div className="flex items-center gap-3">
          {/* Database diagnosis button */}
          <Button 
            variant="ghost"
            className="text-green-100 hover:bg-green-800/30 hover:text-green-50"
            onClick={async () => {
              try {
                await diagnoseDatabaseSchema();
                toast({
                  title: "Diagnosis Complete",
                  description: "Check browser console for database schema details"
                });
              } catch (err) {
                console.error("Diagnosis failed:", err);
                toast({
                  title: "Diagnosis Failed",
                  description: "Check browser console for errors",
                  variant: "destructive"
                });
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Diagnose DB
          </Button>
                
          {/* Reset button moved to the left */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-blue-100 hover:bg-blue-800/30 hover:text-blue-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-blue-950 border-blue-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-blue-50">Reset case?</AlertDialogTitle>
                <AlertDialogDescription className="text-blue-200">
                  This will clear all case information, transcripts, and SOAP notes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-blue-900 text-blue-100 border-blue-700 hover:bg-blue-800">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    // Reset without saving
                    useCaseStore.getState().reset();
                    form.reset({
                      name: "",
                      dateTime: new Date().toISOString().slice(0, 16),
                      assignedTo: "",
                      type: "checkup",
                    });
                    
                    // Ensure we're in edit mode
                    setIsEditMode(true);
                    
                    toast({
                      title: "Case reset",
                      description: "All case data has been cleared"
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={async () => {
              // If there's a current case or unsaved changes, save them first
              if (actions.length > 0 || form.formState.isDirty) {
                await form.handleSubmit(currentCaseId ? handleUpdateCase : onSubmit)();
              }
              
              // Reset store and form to start fresh
              useCaseStore.getState().reset();
              form.reset({
                name: "",
                dateTime: new Date().toISOString().slice(0, 16),
                assignedTo: "",
                type: "checkup",
              });
              
              // Ensure we're ready for a new case
              setIsEditMode(true);
              
              toast({
                title: "New case created",
                description: "You can now start working on a new case"
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
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <CardTitle className="text-blue-50 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-300" />
                Case Information
              </div>
              {!isEditMode && savedCaseData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-700/30 text-blue-50 hover:bg-blue-800/40"
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
                          <FormLabel className="text-blue-200">
                            Case Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter case name"
                              {...field}
                              className="bg-blue-900/20 border-blue-700/30 text-blue-50 placeholder:text-blue-400/50 focus-visible:ring-blue-500"
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
                          <FormLabel className="text-blue-200">
                            Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-blue-900/20 border-blue-700/30 text-blue-50 focus-visible:ring-blue-500"
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
                          <FormLabel className="text-blue-200">
                            Case Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-blue-900/20 border-blue-700/30 text-blue-50 focus:ring-blue-500">
                                <SelectValue placeholder="Select case type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-blue-900 border-blue-700 text-blue-50">
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
                          <FormLabel className="text-blue-200">
                            Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-blue-900/20 border-blue-700/30 text-blue-50 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-blue-900 border-blue-700 text-blue-50">
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
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
                      <h3 className="text-sm font-medium text-blue-300 mb-1">
                        Case Name
                      </h3>
                      <p className="text-blue-50 text-lg">
                        {savedCaseData.name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-1">
                        Date & Time
                      </h3>
                      <p className="text-blue-50 text-lg">
                        <ClientSideDate
                          timestamp={new Date(savedCaseData.dateTime).getTime()}
                        />
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-1">
                        Case Type
                      </h3>
                      <p className="text-blue-50 text-lg capitalize">
                        {savedCaseData.type.replace("_", " ")}
                      </p>
                    </div>


                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-1">
                        Status
                      </h3>
                      <p className="text-blue-50 text-lg">
                        {savedCaseData.status ? savedCaseData.status.replace('_', ' ') : 'SCHEDULED'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Recording Section */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <CardTitle className="text-blue-50">
              <Mic className="h-5 w-5 mr-2 text-blue-300 inline" />
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

              <div className="text-3xl font-mono text-blue-50 mb-2">
                {formatTime(recordingTime)}
              </div>

              <p className="text-blue-300 text-center max-w-md">
                {isRecording
                  ? "Recording in progress. Click the button to stop recording."
                  : isProcessing
                    ? "Processing your recording..."
                    : "Click the microphone button to start recording your case notes."}
              </p>

              {/* Live transcription display */}
              {isRecording && (
                <div className="mt-6 w-full">
                  <h3 className="text-blue-200 text-sm font-medium mb-2">
                    Live Transcription
                  </h3>
                  <div className="bg-blue-900/30 border border-blue-800/30 rounded-lg p-4 text-blue-50 min-h-[100px] max-h-[200px] overflow-y-auto">
                    {transcriptText || "Listening..."}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Case Actions Section */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-50 flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-blue-300" />
                Case Actions
              </CardTitle>
              {actions.filter(action => action.type === "recording").length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Check if there are any selected recordings
                      const selectedCount = useCaseStore.getState().selectedRecordings.length;
                      const recordingsCount = actions.filter(action => action.type === "recording").length;
                      
                      if (selectedCount > 0) {
                        // Clear all selected recordings if some are selected
                        useCaseStore.getState().clearSelectedRecordings();
                      } else {
                        // Select all recordings if none are selected
                        const recordingIds = actions
                          .filter(action => action.type === "recording")
                          .map(action => action.id);
                        recordingIds.forEach(id => {
                          useCaseStore.getState().toggleRecordingSelection(id);
                        });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                  >
                    {useCaseStore.getState().selectedRecordings.length > 0 ? "Clear Selection" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleGenerateMultipleSoap}
                    disabled={isGeneratingSoap || useCaseStore.getState().selectedRecordings.length === 0}
                  >
                    {isGeneratingSoap ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate SOAP Notes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {actions.length > 0 ? (
              <div className="space-y-4">
                {/* Recordings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-blue-50">Transcripts</h3>
                  {actions
                    .filter(action => action.type === "recording")
                    .map((action: CaseAction, index) => {
                      const isSelected = useCaseStore.getState().selectedRecordings.includes(action.id);
                      const isTranscriptExpanded = expandedTranscripts[action.id] || false;
                      
                      const toggleExpanded = () => {
                        setExpandedTranscripts(prev => ({
                          ...prev,
                          [action.id]: !prev[action.id]
                        }));
                      };
                      
                      return (
                        <Card
                          key={action.id}
                          className={`bg-blue-900/20 border-blue-700/30 ${
                            isSelected ? "ring-2 ring-blue-400" : ""
                          }`}
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2 flex-1">
                                <label
                                  htmlFor={`recording-${action.id}`}
                                  className="text-blue-50 font-medium cursor-pointer"
                                >
                                  Recording {index + 1}
                                </label>
                                <Badge className="bg-blue-700/50 text-blue-100 border-0">
                                  Transcript
                                </Badge>
                                <span className="text-xs text-blue-300 ml-1">
                                  <ClientSideDate timestamp={action.timestamp} />
                                </span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`recording-${action.id}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    useCaseStore.getState().toggleRecordingSelection(action.id);
                                  }}
                                  className="h-4 w-4 rounded border-blue-700 text-blue-600 focus:ring-blue-500 mr-3"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleExpanded}
                                  className="h-8 w-8 p-0 text-blue-200 hover:text-blue-50 hover:bg-blue-800/30"
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
                                className="text-blue-50/80 text-sm mt-2 cursor-pointer line-clamp-1"
                                onClick={toggleExpanded}
                              >
                                {action.content.transcript}
                              </div>
                            )}
                          </CardHeader>
                          {isTranscriptExpanded && (
                            <CardContent className="p-4 pt-0">
                              <div
                                className="text-blue-50 text-sm mt-2 whitespace-pre-line"
                                onClick={() => {
                                  // Toggle the recording selection when clicked
                                  useCaseStore.getState().toggleRecordingSelection(action.id);
                                }}
                              >
                                {action.content.transcript}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                </div>

                {/* SOAP Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-blue-50">SOAP Notes</h3>
                  {actions
                    .filter(action => action.type === "soap" && action.content.soap)
                    .map((action: CaseAction, index) => (
                      <Card key={action.id} className="bg-blue-900/20 border-blue-700/30">
                        <CardHeader className="p-4 pb-0">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-700/50 text-green-100 border-0">
                                SOAP Notes
                              </Badge>
                              <span className="text-xs text-blue-300">
                                <ClientSideDate timestamp={action.timestamp} />
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Combined expand/collapse button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Check if all sections are currently expanded
                                  const allExpanded = Object.values(expandedSoapSections[action.id] || {}).every(expanded => expanded);
                                  // Toggle to opposite state
                                  toggleAllSections(action.id, !allExpanded);
                                }}
                                className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-800/20"
                                title={Object.values(expandedSoapSections[action.id] || {}).every(expanded => expanded) ? "Collapse all sections" : "Expand all sections"}
                              >
                                {Object.values(expandedSoapSections[action.id] || {}).every(expanded => expanded) ? (
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
                                onClick={() => handleEditSoap(action)}
                                className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-800/20"
                                title="Edit SOAP notes"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          {action.content.soap && (() => {
                              // Get current section states
                              const sections = expandedSoapSections[action.id] || {
                                subjective: true,
                                objective: true,
                                assessment: true,
                                plan: true
                              };
                              
                              // Toggle function for sections
                              const toggleSection = (section: string) => {
                                setExpandedSoapSections(prev => ({
                                  ...prev,
                                  [action.id]: {
                                    ...prev[action.id],
                                    [section]: !prev[action.id]?.[section]
                                  }
                                }));
                              };
                              
                              return (
                                <div className="space-y-3">
                                  {/* Subjective */}
                                <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                  <div 
                                    className="flex items-center justify-between bg-blue-900/40 px-3 py-2 cursor-pointer"
                                    onClick={() => toggleSection('subjective')}
                                  >
                                    <h4 className="text-blue-100 flex items-center text-sm font-medium">
                                      <Badge className="bg-blue-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">S</Badge>
                                      Subjective
                                    </h4>
                                    <div className="flex items-center">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          // Stop propagation to prevent toggling when clicking copy
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(action.content.soap?.subjective || "");
                                          toast({
                                            title: "Copied",
                                            description: "Subjective section copied to clipboard",
                                          });
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-blue-200 hover:text-blue-50"
                                      >
                                        {sections.subjective ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {sections.subjective && (
                                    <div 
                                      className="p-3 text-blue-50 text-sm"
                                      dangerouslySetInnerHTML={{ __html: action.content.soap.subjective }}
                                    />
                                  )}
                                </div>

                                {/* Objective */}
                                <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                  <div 
                                    className="flex items-center justify-between bg-blue-900/40 px-3 py-2 cursor-pointer"
                                    onClick={() => toggleSection('objective')}
                                  >
                                    <h4 className="text-blue-100 flex items-center text-sm font-medium">
                                      <Badge className="bg-green-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">O</Badge>
                                      Objective
                                    </h4>
                                    <div className="flex items-center">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          // Stop propagation to prevent toggling when clicking copy
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(action.content.soap?.objective || "");
                                          toast({
                                            title: "Copied",
                                            description: "Objective section copied to clipboard",
                                          });
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-blue-200 hover:text-blue-50"
                                      >
                                        {sections.objective ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {sections.objective && (
                                    <div 
                                      className="p-3 text-blue-50 text-sm"
                                      dangerouslySetInnerHTML={{ __html: action.content.soap.objective }}
                                    />
                                  )}
                                </div>

                                {/* Assessment */}
                                <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                  <div 
                                    className="flex items-center justify-between bg-blue-900/40 px-3 py-2 cursor-pointer"
                                    onClick={() => toggleSection('assessment')}
                                  >
                                    <h4 className="text-blue-100 flex items-center text-sm font-medium">
                                      <Badge className="bg-purple-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">A</Badge>
                                      Assessment
                                    </h4>
                                    <div className="flex items-center">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          // Stop propagation to prevent toggling when clicking copy
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(action.content.soap?.assessment || "");
                                          toast({
                                            title: "Copied",
                                            description: "Assessment section copied to clipboard",
                                          });
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-blue-200 hover:text-blue-50"
                                      >
                                        {sections.assessment ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {sections.assessment && (
                                    <div 
                                      className="p-3 text-blue-50 text-sm"
                                      dangerouslySetInnerHTML={{ __html: action.content.soap.assessment }}
                                    />
                                  )}
                                </div>

                                {/* Plan */}
                                <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                  <div 
                                    className="flex items-center justify-between bg-blue-900/40 px-3 py-2 cursor-pointer"
                                    onClick={() => toggleSection('plan')}
                                  >
                                    <h4 className="text-blue-100 flex items-center text-sm font-medium">
                                      <Badge className="bg-amber-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">P</Badge>
                                      Plan
                                    </h4>
                                    <div className="flex items-center">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={(e) => {
                                          // Stop propagation to prevent toggling when clicking copy
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(action.content.soap?.plan || "");
                                          toast({
                                            title: "Copied",
                                            description: "Plan section copied to clipboard",
                                          });
                                        }}
                                      >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-blue-200 hover:text-blue-50"
                                      >
                                        {sections.plan ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {sections.plan && (
                                    <div 
                                      className="p-3 text-blue-50 text-sm"
                                      dangerouslySetInnerHTML={{ __html: action.content.soap.plan }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ))}

                  {actions.filter(action => action.type === "soap" && action.content.soap).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Clipboard className="h-12 w-12 text-blue-700/50 mb-3" />
                      <h3 className="text-lg font-medium text-blue-50 mb-1">
                        No SOAP Notes Yet
                      </h3>
                      <p className="text-blue-300 max-w-md text-sm">
                        Select one or more transcripts and generate SOAP notes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clipboard className="h-16 w-16 text-blue-700/50 mb-4" />
                <h3 className="text-xl font-medium text-blue-50 mb-2">
                  No Case Actions Yet
                </h3>
                <p className="text-blue-300 max-w-md">
                  Record your case notes to create transcripts and generate SOAP notes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Summary Card */}
        {actions.length > 0 && (
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardHeader 
              className="border-b border-blue-800/30 bg-blue-900/20 cursor-pointer"
              onClick={() => {
                // Add state for case summary collapse
                setCaseSummaryCollapsed(!caseSummaryCollapsed);
              }}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-50 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-blue-300" />
                  Case Summary
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-blue-200 hover:text-blue-50 hover:bg-blue-800/30"
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
                <div className="bg-blue-900/30 backdrop-blur-sm border-blue-800/20 rounded-xl p-4 shadow-md shadow-blue-950/20">
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-700/30 p-2 mr-2">
                      <Clock className="h-5 w-5 text-blue-200" />
                    </div>
                    <span className="text-xs text-blue-300/90">
                      Recording Time
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-blue-50">
                      {formatTime(actions.filter(action => action.type === "recording").length * 60)}
                    </span>
                    <p className="text-xs text-blue-300/90 mt-1">
                      Total recording duration
                    </p>
                  </div>
                </div>
                <div className="bg-blue-900/30 backdrop-blur-sm border-blue-800/20 rounded-xl p-4 shadow-md shadow-blue-950/20">
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-700/30 p-2 mr-2">
                      <FileText className="h-5 w-5 text-blue-200" />
                    </div>
                    <span className="text-xs text-blue-300/90">Case Actions</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-blue-50">
                      {actions.length}
                    </span>
                    <p className="text-xs text-blue-300/90 mt-1">
                      <span className="font-medium">{actions.filter(action => action.type === "recording").length}</span> transcripts,{" "}
                      <span className="font-medium">{actions.filter(action => action.type === "soap").length}</span> SOAP notes
                    </p>
                  </div>
                </div>
                <div className="bg-blue-900/30 backdrop-blur-sm border-blue-800/20 rounded-xl p-4 shadow-md shadow-blue-950/20">
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-700/30 p-2 mr-2">
                      <ClipboardCheck className="h-5 w-5 text-blue-200" />
                    </div>
                    <span className="text-xs text-blue-300/90">
                      SOAP Progress
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center">
                      {actions.filter(action => action.type === "soap").length > 0 ? (
                        <>
                          <span className="text-2xl font-bold text-blue-50">
                            Complete
                          </span>
                          <Badge className="ml-2 bg-green-800/40 text-green-300 border-blue-700/30">
                            {actions.filter(action => action.type === "soap").length} generated
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-blue-50">
                            Pending
                          </span>
                          <Badge className="ml-2 bg-amber-800/40 text-amber-300 border-blue-700/30">
                            0 generated
                          </Badge>
                        </>
                      )}
                    </div>
                    <Progress
                      value={actions.filter(action => action.type === "soap").length > 0 ? 100 : 0}
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
    </div>
  );
}
