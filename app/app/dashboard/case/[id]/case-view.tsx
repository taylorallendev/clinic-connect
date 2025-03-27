"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Copy,
  CheckCircle,
  ClipboardCheck,
  Clipboard,
} from "lucide-react";
import { AppointmentData, CaseAction } from "@/store/use-case-store";
import { useAppointment } from "@/hooks/use-appointment";
import { MarkdownRenderer } from "@/components/ui/markdown";

interface CaseViewProps {
  appointmentId: string;
}

export function CaseView({ appointmentId }: CaseViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSoapSections, setExpandedSoapSections] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const { appointment, isLoading, error } = useAppointment(appointmentId);

  // Initialize expanded state for SOAP sections when appointment loads
  useEffect(() => {
    if (appointment && appointment.case_actions) {
      const soapActions = appointment.case_actions.filter(
        (action) => action.type === "soap"
      );

      const initialExpandedState: Record<string, Record<string, boolean>> = {};
      soapActions.forEach((action) => {
        initialExpandedState[action.id] = {
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

  // Helper function to parse SOAP notes that might be stored as JSON strings
  function parseSoapNotes(action: CaseAction) {
    if (action.type !== "soap" || !action.content.soap)
      return action.content.soap;

    const soap = action.content.soap;

    // If the plan field contains a JSON string with SOAP structure, parse it
    if (
      typeof soap.plan === "string" &&
      (soap.plan.includes('"subjective":') ||
        soap.plan.includes('"objective":') ||
        soap.plan.includes('"assessment":') ||
        soap.plan.includes('"plan":'))
    ) {
      try {
        const parsedPlan = JSON.parse(soap.plan);

        // If it has SOAP structure, use it
        if (
          parsedPlan &&
          typeof parsedPlan === "object" &&
          (parsedPlan.subjective ||
            parsedPlan.objective ||
            parsedPlan.assessment ||
            parsedPlan.plan)
        ) {
          return {
            subjective: parsedPlan.subjective || soap.subjective || "",
            objective: parsedPlan.objective || soap.objective || "",
            assessment: parsedPlan.assessment || soap.assessment || "",
            plan: parsedPlan.plan || "",
          };
        }
      } catch (e) {
        console.error("Failed to parse SOAP JSON from plan field:", e);
      }
    }

    // Return the original SOAP if parsing failed or wasn't needed
    return soap;
  }

  // Helper function to truncate text
  function truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  // Helper function to get status color
  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/80 hover:bg-green-500";
      case "ongoing":
        return "bg-blue-500/80 hover:bg-blue-500";
      case "exported":
        return "bg-purple-500/80 hover:bg-purple-500";
      case "reviewed":
        return "bg-yellow-500/80 hover:bg-yellow-500";
      case "scheduled":
        return "bg-gray-500/80 hover:bg-gray-500";
      default:
        return "bg-gray-500/80 hover:bg-gray-500";
    }
  }

  // Function to copy all SOAP notes to clipboard
  const copyToClipboard = async (action: CaseAction) => {
    if (action.type !== "soap" || !action.content.soap) return;

    const soap = parseSoapNotes(action);
    if (!soap) return;

    const soapText = `# SOAP Notes\n\n## Subjective\n${soap.subjective || "N/A"}\n\n## Objective\n${
      soap.objective || "N/A"
    }\n\n## Assessment\n${soap.assessment || "N/A"}\n\n## Plan\n${
      soap.plan || "N/A"
    }`;

    try {
      await navigator.clipboard.writeText(soapText);
      setCopiedId(`${action.id}-all`);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const soapActions =
    appointment.case_actions?.filter((action) => action.type === "soap") || [];

  return (
    <div className="flex flex-col space-y-6 py-6 bg-background">
      <div className="space-y-6">
        {/* Case Details Card */}
        <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-card-foreground flex items-center">
              <FileText className="h-5 w-5 mr-2 text-card-foreground" />
              Case Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-1">
                    Date & Time
                  </h3>
                  <p className="text-card-foreground text-lg">
                    {appointment.date} at {appointment.time}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-1">
                    Patient
                  </h3>
                  <p className="text-card-foreground text-lg">
                    {appointment.patients?.name || "Unknown Patient"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-1">
                    Provider
                  </h3>
                  <p className="text-card-foreground text-lg">
                    {appointment.users?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-1">
                    Type
                  </h3>
                  <Badge
                    variant="outline"
                    className="capitalize text-foreground border-border text-xs"
                  >
                    {appointment.type?.replace("_", " ") || "General"}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-1">
                    Status
                  </h3>
                  <Badge
                    className={`capitalize text-white text-xs ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status?.replace("_", " ") || "Scheduled"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SOAP Notes History Card */}
        <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-card-foreground flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-card-foreground" />
                SOAP Notes History
              </CardTitle>
              {soapActions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Check if at least one section is collapsed
                    const allExpanded = soapActions.every((action) => {
                      const sections = expandedSoapSections[action.id];
                      return (
                        sections &&
                        sections.subjective &&
                        sections.objective &&
                        sections.assessment &&
                        sections.plan
                      );
                    });

                    // Toggle all sections
                    const newExpandedState: Record<
                      string,
                      Record<string, boolean>
                    > = {};
                    soapActions.forEach((action) => {
                      newExpandedState[action.id] = {
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
                  {soapActions.every((action) => {
                    const sections = expandedSoapSections[action.id];
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
          </CardHeader>
          <CardContent className="p-6">
            {soapActions.length > 0 ? (
              <div className="space-y-4">
                {soapActions.map((action, index) => {
                  const parsedSoap = parseSoapNotes(action);
                  if (!parsedSoap) return null;

                  const isSoapFormat =
                    parsedSoap.subjective &&
                    parsedSoap.objective &&
                    parsedSoap.assessment &&
                    parsedSoap.plan;

                  return (
                    <Card
                      key={action.id}
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
                              {formatDistanceToNow(new Date(action.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(action)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted/20"
                              title="Copy all SOAP notes"
                            >
                              {copiedId === `${action.id}-all` ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy All
                                </>
                              )}
                            </Button>
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
                                  [action.id]: {
                                    ...prev[action.id],
                                    subjective: !prev[action.id]?.subjective,
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
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      `## Subjective\n${parsedSoap.subjective || ""}`
                                    );
                                    setCopiedId(`${action.id}-subjective`);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="h-6 text-xs text-muted-foreground"
                                >
                                  {copiedId === `${action.id}-subjective` ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Copy className="h-3 w-3 mr-1" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                            </div>
                            {expandedSoapSections[action.id]?.subjective && (
                              <div className="p-3 text-muted-foreground text-sm">
                                <MarkdownRenderer
                                  content={parsedSoap.subjective || ""}
                                  className="text-muted-foreground"
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
                                  [action.id]: {
                                    ...prev[action.id],
                                    objective: !prev[action.id]?.objective,
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
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      `## Objective\n${parsedSoap.objective || ""}`
                                    );
                                    setCopiedId(`${action.id}-objective`);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="h-6 text-xs text-muted-foreground"
                                >
                                  {copiedId === `${action.id}-objective` ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Copy className="h-3 w-3 mr-1" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                            </div>
                            {expandedSoapSections[action.id]?.objective && (
                              <div className="p-3 text-muted-foreground text-sm">
                                <MarkdownRenderer
                                  content={parsedSoap.objective || ""}
                                  className="text-muted-foreground"
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
                                  [action.id]: {
                                    ...prev[action.id],
                                    assessment: !prev[action.id]?.assessment,
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
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      `## Assessment\n${parsedSoap.assessment || ""}`
                                    );
                                    setCopiedId(`${action.id}-assessment`);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="h-6 text-xs text-muted-foreground"
                                >
                                  {copiedId === `${action.id}-assessment` ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Copy className="h-3 w-3 mr-1" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                            </div>
                            {expandedSoapSections[action.id]?.assessment && (
                              <div className="p-3 text-muted-foreground text-sm">
                                <MarkdownRenderer
                                  content={parsedSoap.assessment || ""}
                                  className="text-muted-foreground"
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
                                  [action.id]: {
                                    ...prev[action.id],
                                    plan: !prev[action.id]?.plan,
                                  },
                                }));
                              }}
                            >
                              <h4 className="text-muted-foreground flex items-center text-sm font-medium">
                                <Badge className="bg-accent text-accent-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                                  P
                                </Badge>
                                Plan
                              </h4>
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      `## Plan\n${parsedSoap.plan || ""}`
                                    );
                                    setCopiedId(`${action.id}-plan`);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="h-6 text-xs text-muted-foreground"
                                >
                                  {copiedId === `${action.id}-plan` ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Copy className="h-3 w-3 mr-1" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                            </div>
                            {expandedSoapSections[action.id]?.plan && (
                              <div className="p-3 text-muted-foreground text-sm">
                                <MarkdownRenderer
                                  content={parsedSoap.plan || ""}
                                  className="text-muted-foreground"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clipboard className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-card-foreground mb-1">
                  No SOAP Notes
                </h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  There are no SOAP notes associated with this case.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
