"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, CheckCircle, ClipboardCheck } from "lucide-react";
import { useAppointment } from "@/hooks/use-appointment";
import { MarkdownRenderer } from "@/components/ui/markdown";

interface CaseViewProps {
  appointmentId: string;
}

// Define interfaces for the new data structure
interface SoapNote {
  id: string;
  created_at: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface Transcription {
  id: string;
  created_at: string;
  transcript: string;
}

export function CaseView({ appointmentId }: CaseViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSoapSections, setExpandedSoapSections] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const { appointment, isLoading, error } = useAppointment(appointmentId);

  // Initialize expanded state for SOAP sections when appointment loads
  useEffect(() => {
    if (appointment && appointment.rawData?.soap_notes) {
      const soapNotes = appointment.rawData.soap_notes || [];

      const initialExpandedState: Record<string, Record<string, boolean>> = {};
      soapNotes.forEach((note: SoapNote) => {
        initialExpandedState[note.id] = {
          subjective: true,
          objective: true,
          assessment: true,
          plan: true,
        };
      });

      setExpandedSoapSections(initialExpandedState);
    }
  }, [appointment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-card-foreground">
        <ClipboardCheck className="h-8 w-8 mr-2 animate-pulse text-muted-foreground" />
        <span>Loading case details...</span>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <ClipboardCheck className="h-8 w-8 mb-2 text-muted-foreground" />
        <span>Error loading case details</span>
        <p className="text-sm text-muted-foreground mt-2">
          {error?.message || "The requested case could not be found."}
        </p>
      </div>
    );
  }

  // Helper function to truncate text
  function truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  // Helper function to get status color
  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-600 hover:bg-green-700";
      case "ongoing":
        return "bg-blue-600 hover:bg-blue-700";
      case "reviewed":
        return "bg-amber-600 hover:bg-amber-700";
      default:
        return "bg-slate-600 hover:bg-slate-700";
    }
  }

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Get transcriptions and soap notes from the raw data
  const transcriptions: Transcription[] =
    appointment.rawData?.transcriptions || [];
  const soapNotes: SoapNote[] = appointment.rawData?.soap_notes || [];

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                {appointment.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  className={`${getStatusColor(
                    appointment.status
                  )} text-white border-0`}
                >
                  {appointment.status}
                </Badge>
                <Badge className="bg-muted text-muted-foreground border-0">
                  {appointment.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {appointment.date} at {appointment.time}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Patient
              </h3>
              <p className="text-card-foreground">
                {appointment.patients?.name || "Unknown Patient"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Provider
              </h3>
              <p className="text-card-foreground">
                {appointment.users?.name || "Unknown Provider"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcriptions Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-card-foreground flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              Transcriptions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {transcriptions.length > 0 ? (
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
                            copyToClipboard(
                              transcription.transcript || "",
                              transcription.id
                            )
                          }
                        >
                          {copiedId === transcription.id ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
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
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Transcriptions</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                There are no transcriptions available for this case.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOAP Notes Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-card-foreground flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-muted-foreground" />
              SOAP Notes
            </CardTitle>
            <div className="flex items-center gap-2">
              {soapNotes.length > 0 && (
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {soapNotes.length > 0 ? (
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
                            <MarkdownRenderer content={note.assessment} />
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
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No SOAP Notes</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                There are no SOAP notes available for this case.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
