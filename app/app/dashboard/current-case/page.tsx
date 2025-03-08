"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Copy, Edit, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  useDeepgram,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@/context/DeepgramContextProvider";
import {
  useMicrophone,
  MicrophoneEvents,
  MicrophoneState,
} from "@/context/MicrophoneContextProvider";
import { useCaseStore } from "@/store/use-case-store";
import { ClientSideDate } from "./client-side-dates";
import { useCaseForm } from "./case-form";
import { SoapNotesEditor } from "@/components/ui/soap-notes-editor";
import { Label as UILabel } from "@/components/ui/label";
import { useTranscription } from "@/hooks/use-transcription";

export default function Home() {
  // Use the new transcription hook
  const { transcriptText, setTranscriptText, resetTranscript } =
    useTranscription();

  // Use the case form hook for SOAP notes handling
  const {
    form,
    isSubmittingCase,
    isGeneratingNotes,
    soapEditorState,
    onSubmit,
    handleGenerateSoapNotes: handleGenerate,
    handleSoapUpdate,
    closeSoapEditor,
    openSoapEditor,
  } = useCaseForm();

  const {
    isRecording,
    timer,
    caseActions,
    selectedRecordings,
    setIsRecording,
    setTimer,
    setIsLoading,
    setMicrophoneState,
    handleRecordingFinished,
    toggleRecordingSelection,
  } = useCaseStore();

  // Transcription hooks - keep these for connection management
  const { connection, connectToDeepgram, disconnectFromDeepgram } =
    useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone } =
    useMicrophone();

  // Add useEffect hooks for transcription setup
  useEffect(() => {
    const initMicrophone = async () => {
      try {
        await setupMicrophone();
        console.log("Microphone setup complete");
      } catch (error) {
        console.error("Microphone setup failed:", error);
        toast("Failed to initialize microphone. Please check permissions.");
      }
    };

    void initMicrophone();
  }, []);

  // Handle microphone audio data
  useEffect(() => {
    if (!microphone || !connection) {
      console.log("Audio data handler: missing microphone or connection");
      return;
    }

    console.log("Setting up audio data handler");

    const onAudioData = (e: BlobEvent) => {
      if (e.data.size > 0 && connection) {
        console.log("Sending audio data to Deepgram, size:", e.data.size);
        connection.send(e.data);
      } else {
        console.log("Audio data issue:", {
          dataSize: e.data?.size || 0,
          connectionExists: !!connection,
        });
      }
    };

    // Add listener for audio data
    microphone.addEventListener(MicrophoneEvents.DataAvailable, onAudioData);
    console.log("Added microphone data available listener");

    return () => {
      microphone.removeEventListener(
        MicrophoneEvents.DataAvailable,
        onAudioData
      );
      console.log("Removed microphone data available listener");
    };
  }, [microphone, connection]);

  // Local timer state to ensure we have a reliable timer
  const [localTimer, setLocalTimer] = useState<number>(0);

  // Timer effect using local state first, then updating the store
  useEffect(() => {
    console.log("Timer effect triggered, isRecording:", isRecording);

    if (isRecording) {
      // Reset local timer
      setLocalTimer(0);
      console.log("Local timer reset to 0");

      // Start interval
      const timerInterval = setInterval(() => {
        setLocalTimer((prev) => {
          const newValue = prev + 1;
          console.log("Local timer tick:", prev, "->", newValue);

          // Update the store timer as well
          setTimer(newValue);

          return newValue;
        });
      }, 1000);

      return () => {
        console.log("Clearing timer interval");
        clearInterval(timerInterval);
      };
    } else {
      // Reset when not recording
      setLocalTimer(0);
    }
  }, [isRecording]); // Only depend on isRecording state

  // Keep global timer in sync
  useEffect(() => {
    if (localTimer !== timer && typeof localTimer === "number") {
      console.log("Syncing global timer with local:", localTimer);
      setTimer(localTimer);
    }
  }, [localTimer]);

  // Modify recording toggle to use the new resetTranscript function
  const handleRecordingToggle = async () => {
    try {
      if (!isRecording) {
        console.log("Starting recording...");
        // Start recording
        setIsLoading(true);

        // Reset the transcript using the new hook function
        resetTranscript();

        await connectToDeepgram({
          model: "nova-3",
          interim_results: true,
          smart_format: true,
          filler_words: true,
          utterance_end_ms: 1000,
        });

        startMicrophone();
        setIsRecording(true);
        setMicrophoneState(MicrophoneState.Open);

        console.log("Recording started successfully");
        toast("Your microphone is now active.");
      } else {
        console.log("Stopping recording...");
        // Stop recording
        stopMicrophone();
        disconnectFromDeepgram();

        // Stop recording and reset timers
        setIsRecording(false);
        setMicrophoneState(MicrophoneState.Ready);

        // Reset both timers
        setLocalTimer(0);
        setTimer(0);
        console.log("Both timers reset to 0 after stopping recording");

        // Save the transcript - this will use the transcriptText from our hook
        handleRecordingFinished();

        console.log("Recording stopped successfully");
        toast("Transcription saved.");
      }
    } catch (error) {
      console.error("Error in microphone handling:", error);

      // Clean up even on error
      if (isRecording) {
        // If error during stopping, still try to cleanup
        try {
          stopMicrophone();
          disconnectFromDeepgram();
          setIsRecording(false);
          setMicrophoneState(MicrophoneState.Ready);
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      }

      // Reset both timers on error
      setLocalTimer(0);
      setTimer(0);

      toast("Failed to toggle recording. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this state for the email dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currentSoapAction, setCurrentSoapAction] = useState<any>(null);

  // Add this function to handle sending the email
  const handleSendEmail = async (actionId: string) => {
    const action = caseActions.find(
      (a) => a.id === actionId && a.type === "soap"
    );
    if (!action) return;

    setCurrentSoapAction(action);
    setEmailDialogOpen(true);
  };

  // Add this function to submit the email
  const submitEmailRequest = async () => {
    if (!currentSoapAction || !emailRecipient) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/emails/soap-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Veterinarian", // You might want to get the actual name from user profile
          email: emailRecipient,
          soapNotes: currentSoapAction.content.soap,
          patientName: form.getValues().name || "Patient",
          caseDate: new Date().toLocaleDateString(),
          caseType: form.getValues().type || "Checkup",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast("SOAP notes have been emailed successfully.");
        setEmailDialogOpen(false);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast("Failed to send email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={`space-y-6 ${soapEditorState.isOpen ? "pr-1/2" : ""}`}>
      {/* Render the SOAP editor when it is open */}
      {soapEditorState.isOpen && soapEditorState.soapNotes && (
        <SoapNotesEditor
          soapNotes={soapEditorState.soapNotes}
          onClose={closeSoapEditor}
          onUpdate={handleSoapUpdate}
          transcript={soapEditorState.transcript}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Current Case</h1>
          <p className="text-sm text-gray-400">
            Manage your active veterinary case
          </p>
        </div>
        <Button
          onClick={onSubmit}
          className="bg-gradient-to-r from-blue-500 to-cyan-500"
          disabled={isSubmittingCase}
        >
          {isSubmittingCase ? "Creating Case..." : "Create Case"}
        </Button>
      </div>

      {/* Case Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter case name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          className="[color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={"Dr. Johnson"}>
                            Dr. Johnson
                          </SelectItem>
                          <SelectItem value={"Dr. Black"}>Dr. Black</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recording Button */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={handleRecordingToggle}
            className={`flex-1 h-24 transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg font-semibold">
                {isRecording ? "Stop Recording" : "Start New Recording"}
              </span>
              {isRecording && (
                <span className="text-sm opacity-80">
                  {`${Math.floor(localTimer / 60)}:${(localTimer % 60)
                    .toString()
                    .padStart(2, "0")}`}
                </span>
              )}
            </div>
          </Button>
        </div>

        {/* Transcription Textarea */}
        <div className="relative">
          <Textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Transcription will appear here..."
            className={`min-h-[200px] resize-none p-4 text-base ${
              isRecording
                ? "bg-primary/5 border-primary text-primary-foreground"
                : "bg-secondary/10 text-secondary-foreground border-secondary/20"
            }`}
          />
          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs text-primary">Recording...</span>
            </div>
          )}
        </div>
      </div>

      {/* Case Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Case Actions</CardTitle>
            <CardDescription>
              {caseActions.length} actions recorded
              {selectedRecordings.length > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedRecordings.length} item
                  {selectedRecordings.length > 1 ? "s" : ""} selected)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              {/* Show Email button when at least one SOAP note is selected */}
              {selectedRecordings.some((id) =>
                caseActions.find(
                  (action) => action.id === id && action.type === "soap"
                )
              ) && (
                <Button
                  onClick={() => {
                    // Get the first selected SOAP note
                    const soapId = selectedRecordings.find((id) =>
                      caseActions.find(
                        (action) => action.id === id && action.type === "soap"
                      )
                    );
                    if (soapId) handleSendEmail(soapId);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Email SOAP Notes
                </Button>
              )}

              {/* Show Generate SOAP Notes button when recordings are selected */}
              {(selectedRecordings.some((id) =>
                caseActions.find(
                  (action) => action.id === id && action.type === "recording"
                )
              ) ||
                (transcriptText && !isRecording)) && (
                <Button
                  onClick={() => handleGenerate()}
                  disabled={
                    isGeneratingNotes ||
                    (!transcriptText.trim() &&
                      !selectedRecordings.some((id) =>
                        caseActions.find(
                          (action) =>
                            action.id === id && action.type === "recording"
                        )
                      ))
                  }
                  size="sm"
                >
                  {isGeneratingNotes ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Generate SOAP Notes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Select All button - only shown when there are unselected items */}
            {caseActions.length > 0 &&
              selectedRecordings.length < caseActions.length && (
                <Button
                  onClick={() => {
                    // Select all case actions
                    const allActionIds = caseActions.map((action) => action.id);
                    // Clear current selection and add all IDs
                    useCaseStore.getState().clearSelectedRecordings();
                    allActionIds.forEach((id) =>
                      useCaseStore.getState().toggleRecordingSelection(id)
                    );
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  Select All
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {caseActions.map((action) => {
              // Check if action is selected
              const isSelected = selectedRecordings.includes(action.id);

              return (
                <div key={action.id} className="flex items-center gap-3">
                  <Card
                    className={`flex-1 ${isSelected ? "border-2 border-primary" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium">
                          {action.type === "recording"
                            ? "Recording"
                            : "SOAP Notes"}{" "}
                          <ClientSideDate timestamp={action.timestamp} />
                        </CardTitle>

                        {/* Edit button for SOAP notes moved to the header */}
                        {action.type === "soap" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => openSoapEditor(action.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {action.type === "recording" ? (
                        <div className="space-y-4">
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            <AccordionItem
                              value={`${action.id}-transcript`}
                              className="border-b-0"
                            >
                              <AccordionTrigger className="py-2 text-purple-500 font-medium">
                                <div className="flex justify-between w-full">
                                  <span>Transcript</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2 flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        action.content.transcript || ""
                                      );
                                      toast("Transcript copied to clipboard");
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm whitespace-pre-line">
                                  {action.content.transcript}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Complete SOAP Notes Accordion */}
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            {/* Subjective Section */}
                            <AccordionItem
                              value={`${action.id}-subjective`}
                              className="border-b border-muted"
                            >
                              <AccordionTrigger className="py-2 text-blue-500 font-medium">
                                <div className="flex justify-between w-full">
                                  <span>Subjective</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2 flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        action.content.soap?.subjective || ""
                                      );
                                      toast(
                                        "Subjective notes copied to clipboard"
                                      );
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm whitespace-pre-line">
                                  {action.content.soap?.subjective}
                                </p>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Objective Section */}
                            <AccordionItem
                              value={`${action.id}-objective`}
                              className="border-b border-muted"
                            >
                              <AccordionTrigger className="py-2 text-green-500 font-medium">
                                <div className="flex justify-between w-full">
                                  <span>Objective</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2 flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        action.content.soap?.objective || ""
                                      );
                                      toast(
                                        "Objective notes copied to clipboard"
                                      );
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm whitespace-pre-line">
                                  {action.content.soap?.objective}
                                </p>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Assessment Section */}
                            <AccordionItem
                              value={`${action.id}-assessment`}
                              className="border-b border-muted"
                            >
                              <AccordionTrigger className="py-2 text-amber-500 font-medium">
                                <div className="flex justify-between w-full">
                                  <span>Assessment</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2 flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        action.content.soap?.assessment || ""
                                      );
                                      toast(
                                        "Assessment notes copied to clipboard"
                                      );
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm whitespace-pre-line">
                                  {action.content.soap?.assessment}
                                </p>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Plan Section */}
                            <AccordionItem
                              value={`${action.id}-plan`}
                              className="border-b-0"
                            >
                              <AccordionTrigger className="py-2 text-red-500 font-medium">
                                <div className="flex justify-between w-full">
                                  <span>Plan</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2 flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        action.content.soap?.plan || ""
                                      );
                                      toast("Plan notes copied to clipboard");
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                  </Button>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm whitespace-pre-line">
                                  {action.content.soap?.plan}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Checkbox container with vertical centering */}
                  <div className="flex items-center self-stretch">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                      checked={isSelected}
                      onChange={() => toggleRecordingSelection(action.id)}
                      id={`action-${action.id}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Email SOAP Notes</DialogTitle>
            <DialogDescription>
              Send these SOAP notes to a veterinarian or colleague.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <UILabel htmlFor="email" className="text-right">
                Email
              </UILabel>
              <Input
                id="email"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={submitEmailRequest}
              disabled={!emailRecipient || isSendingEmail}
            >
              {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
