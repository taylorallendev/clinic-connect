"use client";

import { useEffect, useState } from "react";
import { CurrentCaseContent } from "../current-case/current-case-content";
import { useAppointment } from "@/hooks/use-appointment";
import { useCaseStore } from "@/store/use-case-store";
import {
  Loader2,
  ArrowLeft,
  FileText,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/ui/markdown";

interface CaseWrapperProps {
  appointmentId?: string;
}

export function CaseWrapper({ appointmentId }: CaseWrapperProps) {
  const [isLoading, setIsLoading] = useState(!!appointmentId);
  const { loadAppointmentData, reset } = useCaseStore();
  const searchParams = useSearchParams();
  const isFromAppointments = searchParams.get("from") === "appointments";
  const [expandedSoapSections, setExpandedSoapSections] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // If an appointmentId is provided, we're in view/edit mode for an existing case
  // If not, we're in creation mode for a new case
  const {
    appointment,
    isLoading: isAppointmentLoading,
    error,
  } = useAppointment(appointmentId || "");

  useEffect(() => {
    if (appointmentId) {
      // We're viewing an existing case
      setIsLoading(true);

      if (appointment && !isAppointmentLoading) {
        // Load the appointment data into the case store
        loadAppointmentData(appointment);
        setIsLoading(false);

        // Initialize expanded state for SOAP sections
        if (appointment.rawData?.soap_notes) {
          const soapNotes = appointment.rawData.soap_notes || [];
          const initialExpandedState: Record<
            string,
            Record<string, boolean>
          > = {};

          soapNotes.forEach((note) => {
            initialExpandedState[note.id] = {
              subjective: true,
              objective: true,
              assessment: true,
              plan: true,
            };
          });

          setExpandedSoapSections(initialExpandedState);
        }
      }
    } else {
      // We're creating a new case, reset the store
      reset();
      setIsLoading(false);
    }
  }, [
    appointmentId,
    appointment,
    isAppointmentLoading,
    loadAppointmentData,
    reset,
  ]);

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (isLoading || isAppointmentLoading) {
    return (
      <div className="flex items-center justify-center h-full text-card-foreground">
        <Loader2 className="w-8 h-8 mr-2 animate-spin" />
        <span>Loading case data...</span>
      </div>
    );
  }

  if (appointmentId && error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <span>Error loading case: {error.message}</span>
      </div>
    );
  }

  // If we're in creation mode or there's no raw data, just show the CurrentCaseContent
  if (!appointmentId || !appointment?.rawData) {
    return (
      <div className="flex flex-col space-y-4">
        {isFromAppointments && appointmentId && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
              asChild
            >
              <Link href="/app/dashboard/appointments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Appointments
              </Link>
            </Button>
          </div>
        )}
        <CurrentCaseContent />
      </div>
    );
  }

  // Extract data from the appointment
  const { rawData } = appointment;
  const transcriptions = rawData.transcriptions || [];
  const soapNotes = rawData.soap_notes || [];
  const generations = rawData.generations || [];

  return (
    <div className="flex flex-col space-y-6">
      {/* Back to Appointments button - only show when coming from appointments page */}
      {isFromAppointments && appointmentId && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
            asChild
          >
            <Link href="/app/dashboard/appointments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Link>
          </Button>
        </div>
      )}

      {/* Render the CurrentCaseContent component for both new and existing cases */}
      <CurrentCaseContent />

      {/* Transcriptions Section */}
      {transcriptions.length > 0 && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-lg font-medium text-card-foreground flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              Transcriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {transcriptions.map((transcription) => (
                  <Card
                    key={transcription.id}
                    className="bg-muted/20 border-muted/30 shadow-sm"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-700/50 text-blue-100 border-0">
                            Transcript
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(transcription.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            copyToClipboard(transcription.transcript || "")
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-card-foreground whitespace-pre-wrap">
                        {transcription.transcript}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* SOAP Notes Section */}
      {soapNotes.length > 0 && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-card-foreground flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-muted-foreground" />
                SOAP Notes
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Toggle all sections for all SOAP notes
                    const allExpanded = soapNotes.every((note) => {
                      const sections = expandedSoapSections[note.id];
                      return (
                        sections &&
                        sections.subjective &&
                        sections.objective &&
                        sections.assessment &&
                        sections.plan
                      );
                    });

                    const newExpandedState = { ...expandedSoapSections };
                    soapNotes.forEach((note) => {
                      newExpandedState[note.id] = {
                        subjective: !allExpanded,
                        objective: !allExpanded,
                        assessment: !allExpanded,
                        plan: !allExpanded,
                      };
                    });

                    setExpandedSoapSections(newExpandedState);
                  }}
                  className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  {soapNotes.every((note) => {
                    const sections = expandedSoapSections[note.id];
                    return (
                      sections &&
                      sections.subjective &&
                      sections.objective &&
                      sections.assessment &&
                      sections.plan
                    );
                  })
                    ? "Collapse All"
                    : "Expand All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {soapNotes.map((note, index) => (
                <Card
                  key={note.id}
                  className="bg-muted/20 border-muted/30 shadow-sm"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-card-foreground font-medium">
                          SOAP Note {index + 1}
                        </span>
                        <Badge className="bg-green-700/50 text-green-100 border-0">
                          SOAP
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-1">
                          {formatDistanceToNow(new Date(note.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Subjective Section */}
                      <div className="border border-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                          onClick={() => {
                            setExpandedSoapSections((prev) => ({
                              ...prev,
                              [note.id]: {
                                ...prev[note.id],
                                subjective: !prev[note.id]?.subjective,
                              },
                            }));
                          }}
                        >
                          <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                            <Badge className="bg-muted text-muted-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                              S
                            </Badge>
                            Subjective
                          </h4>
                        </div>
                        {expandedSoapSections[note.id]?.subjective && (
                          <div className="p-3 bg-card">
                            <MarkdownRenderer
                              content={note.subjective || "No subjective data"}
                            />
                          </div>
                        )}
                      </div>

                      {/* Objective Section */}
                      <div className="border border-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                          onClick={() => {
                            setExpandedSoapSections((prev) => ({
                              ...prev,
                              [note.id]: {
                                ...prev[note.id],
                                objective: !prev[note.id]?.objective,
                              },
                            }));
                          }}
                        >
                          <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                            <Badge className="bg-success text-success-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                              O
                            </Badge>
                            Objective
                          </h4>
                        </div>
                        {expandedSoapSections[note.id]?.objective && (
                          <div className="p-3 bg-card">
                            <MarkdownRenderer
                              content={note.objective || "No objective data"}
                            />
                          </div>
                        )}
                      </div>

                      {/* Assessment Section */}
                      <div className="border border-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                          onClick={() => {
                            setExpandedSoapSections((prev) => ({
                              ...prev,
                              [note.id]: {
                                ...prev[note.id],
                                assessment: !prev[note.id]?.assessment,
                              },
                            }));
                          }}
                        >
                          <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                            <Badge className="bg-info text-info-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                              A
                            </Badge>
                            Assessment
                          </h4>
                        </div>
                        {expandedSoapSections[note.id]?.assessment && (
                          <div className="p-3 bg-card">
                            <MarkdownRenderer
                              content={note.assessment || "No assessment data"}
                            />
                          </div>
                        )}
                      </div>

                      {/* Plan Section */}
                      <div className="border border-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between bg-muted/40 px-3 py-2 cursor-pointer"
                          onClick={() => {
                            setExpandedSoapSections((prev) => ({
                              ...prev,
                              [note.id]: {
                                ...prev[note.id],
                                plan: !prev[note.id]?.plan,
                              },
                            }));
                          }}
                        >
                          <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                            <Badge className="bg-warning text-warning-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                              P
                            </Badge>
                            Plan
                          </h4>
                        </div>
                        {expandedSoapSections[note.id]?.plan && (
                          <div className="p-3 bg-card">
                            <MarkdownRenderer
                              content={note.plan || "No plan data"}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generations Section */}
      {generations.length > 0 && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-lg font-medium text-card-foreground flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-muted-foreground" />
              AI Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {generations.map((generation) => (
                  <Card
                    key={generation.id}
                    className="bg-muted/20 border-muted/30 shadow-sm"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-700/50 text-purple-100 border-0">
                            Generation
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(generation.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            copyToClipboard(generation.content || "")
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {generation.prompt && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Prompt:
                          </h4>
                          <p className="text-sm text-card-foreground bg-muted/30 p-2 rounded-md">
                            {generation.prompt}
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Result:
                        </h4>
                        <MarkdownRenderer content={generation.content || ""} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
