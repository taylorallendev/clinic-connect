"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "@/store/use-case-store";
import { createCase, generateSoapNotes, updateCase, getCase } from "./actions";
import { caseFormSchema } from "./case-form";
import { ClientSideDate } from "./client-side-dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

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

  // Access case store
  const {
    caseActions: actions,
    addCaseAction: addAction,
    currentCaseId,
  } = useCaseStore();

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      name: "",
      dateTime: new Date().toISOString().slice(0, 16),
      assignedTo: "",
      visibility: "private",
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
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscriptText((prev) => prev + " " + transcript);
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

  return (
    <div className="flex flex-col space-y-6 p-6 bg-gradient-to-br from-blue-950 to-indigo-950">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-blue-50">Current Case</h1>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-blue-900/30 text-blue-200 border-blue-700/30 px-3 py-1"
          >
            {currentCaseId ? `Case ID: ${currentCaseId}` : "New Case"}
          </Badge>

          {/* Save button moved to top right */}
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

          <Button
            variant="ghost"
            className="text-blue-100 hover:bg-blue-800/30 hover:text-blue-50"
            onClick={() => form.reset()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
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
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-200">
                            Visibility
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-blue-900/20 border-blue-700/30 text-blue-50 focus:ring-blue-500">
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-blue-900 border-blue-700 text-blue-50">
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="public">Public</SelectItem>
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
                        Visibility
                      </h3>
                      <p className="text-blue-50 text-lg capitalize">
                        {savedCaseData.visibility}
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

            {actions.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium text-blue-50">
                  Saved Recordings
                </h3>
                {actions.map((action: CaseAction, index) => (
                  <Card
                    key={action.id}
                    className="bg-blue-900/20 border-blue-700/30"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Badge className="bg-blue-700/50 text-blue-100 border-0">
                              Recording {index + 1}
                            </Badge>
                            <span className="text-xs text-blue-300 ml-2">
                              <ClientSideDate timestamp={action.timestamp} />
                            </span>
                          </div>

                          <div className="mt-3 text-blue-50 text-sm">
                            {action.content.transcript}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-700/30 text-blue-100 hover:bg-blue-800/30 hover:text-blue-50"
                          onClick={() =>
                            handleGenerateSoap(
                              action.id,
                              action.content.transcript || ""
                            )
                          }
                          disabled={isGeneratingSoap || !!action.content.soap}
                        >
                          {isGeneratingSoap ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Processing
                            </>
                          ) : action.content.soap ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-2" />
                              SOAP Generated
                            </>
                          ) : (
                            <>
                              <Clipboard className="h-3 w-3 mr-2" />
                              Generate SOAP
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SOAP Notes Section */}
        <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
            <CardTitle className="text-blue-50 flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-blue-300" />
              SOAP Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {soapNotes ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-blue-50 flex items-center">
                    <Badge className="bg-blue-600 text-white mr-2">S</Badge>
                    Subjective
                  </h3>
                  <Textarea
                    value={soapNotes.subjective || ""}
                    readOnly
                    className="bg-blue-900/20 border-blue-700/30 text-blue-50 min-h-24"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-blue-50 flex items-center">
                    <Badge className="bg-green-600 text-white mr-2">O</Badge>
                    Objective
                  </h3>
                  <Textarea
                    value={soapNotes.objective || ""}
                    readOnly
                    className="bg-blue-900/20 border-blue-700/30 text-blue-50 min-h-24"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-blue-50 flex items-center">
                    <Badge className="bg-purple-600 text-white mr-2">A</Badge>
                    Assessment
                  </h3>
                  <Textarea
                    value={soapNotes.assessment || ""}
                    readOnly
                    className="bg-blue-900/20 border-blue-700/30 text-blue-50 min-h-24"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-blue-50 flex items-center">
                    <Badge className="bg-amber-600 text-white mr-2">P</Badge>
                    Plan
                  </h3>
                  <Textarea
                    value={soapNotes.plan || ""}
                    readOnly
                    className="bg-blue-900/20 border-blue-700/30 text-blue-50 min-h-24"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clipboard className="h-16 w-16 text-blue-700/50 mb-4" />
                <h3 className="text-xl font-medium text-blue-50 mb-2">
                  No SOAP Notes Yet
                </h3>
                <p className="text-blue-300 max-w-md">
                  Record your case notes and generate SOAP notes from a
                  recording.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Summary Card */}
        {actions.length > 0 && (
          <Card className="bg-blue-950/40 backdrop-blur-xl border-blue-800/30 shadow-lg shadow-blue-950/30 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-blue-800/30 bg-blue-900/20">
              <CardTitle className="text-blue-50 flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-blue-300" />
                Case Summary
              </CardTitle>
            </CardHeader>
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
                      {formatTime(actions.length * 60)}
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
                    <span className="text-xs text-blue-300/90">Recordings</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-blue-50">
                      {actions.length}
                    </span>
                    <p className="text-xs text-blue-300/90 mt-1">
                      Total recordings made
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
                      <span className="text-2xl font-bold text-blue-50">
                        {soapNotes ? "Complete" : "Pending"}
                      </span>
                      <Badge
                        className={`ml-2 ${soapNotes ? "bg-green-800/40 text-green-300" : "bg-amber-800/40 text-amber-300"} border-blue-700/30`}
                      >
                        {soapNotes ? "100%" : "0%"}
                      </Badge>
                    </div>
                    <Progress
                      value={soapNotes ? 100 : 0}
                      className="h-2 mt-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
