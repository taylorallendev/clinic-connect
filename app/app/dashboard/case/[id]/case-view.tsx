"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, CheckCircle } from "lucide-react";
import { AppointmentData, CaseAction } from "@/store/use-case-store";
import { useAppointment } from "@/hooks/use-appointment"; // You'll need to create this hook

interface CaseViewProps {
  appointmentId: string;
}

export function CaseView({ appointmentId }: CaseViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { appointment, isLoading, error } = useAppointment(appointmentId);

  if (isLoading) {
    return <div className="p-8 text-center">Loading case details...</div>;
  }

  if (error || !appointment) {
    return <div className="p-8 text-center">Error loading case details</div>;
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

  // Function to copy SOAP notes to clipboard
  const copyToClipboard = async (action: CaseAction) => {
    if (action.type !== "soap" || !action.content.soap) return;

    const soap = parseSoapNotes(action);
    if (!soap) return;

    const soapText = `Subjective: ${soap.subjective || "N/A"}\n\nObjective: ${
      soap.objective || "N/A"
    }\n\nAssessment: ${soap.assessment || "N/A"}\n\nPlan: ${
      soap.plan || "N/A"
    }`;

    try {
      await navigator.clipboard.writeText(soapText);
      setCopiedId(action.id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const soapActions =
    appointment.case_actions?.filter((action) => action.type === "soap") || [];

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-950/95 p-6 rounded-lg">
          <div>
            <h2 className="text-2xl font-semibold text-blue-50 mb-6">
              Case Details
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-blue-400">
                  Date & Time
                </h3>
                <p className="text-blue-50 mt-1">
                  {appointment.date} at {appointment.time}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400">Patient</h3>
                <p className="text-blue-50 mt-1">
                  {appointment.patients?.name || "Unknown Patient"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-400">Provider</h3>
                <p className="text-blue-50 mt-1">
                  {appointment.users?.name || "Unassigned"}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-blue-400">Type</h3>
              <Badge
                variant="outline"
                className="mt-1 capitalize text-blue-100 border-blue-700/50"
              >
                {appointment.type?.replace("_", " ") || "General"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-400">Status</h3>
              <Badge
                className={`mt-1 capitalize ${getStatusColor(
                  appointment.status
                )} text-white`}
              >
                {appointment.status?.replace("_", " ") || "Scheduled"}
              </Badge>
            </div>
          </div>
        </div>

        {soapActions.length > 0 && (
          <div className="bg-blue-950/95 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-50 mb-4">
              SOAP Notes History
            </h3>
            <div className="space-y-4">
              {soapActions.map((action) => (
                <div key={action.id} className="bg-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="font-medium text-blue-100">
                        SOAP Note
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-blue-400">
                        {formatDistanceToNow(new Date(action.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      <button
                        onClick={() => copyToClipboard(action)}
                        className="text-blue-300 hover:text-blue-100 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === action.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {action.content.soap && (
                    <div className="text-sm text-blue-200 space-y-2">
                      {(() => {
                        const parsedSoap = parseSoapNotes(action);
                        if (!parsedSoap) return null;

                        return (
                          <>
                            <div>
                              <span className="font-medium">Subjective:</span>
                              <p className="mt-1">{parsedSoap.subjective}</p>
                            </div>
                            {parsedSoap.objective && (
                              <div>
                                <span className="font-medium">Objective:</span>
                                <p className="mt-1">{parsedSoap.objective}</p>
                              </div>
                            )}
                            {parsedSoap.assessment && (
                              <div>
                                <span className="font-medium">Assessment:</span>
                                <p className="mt-1">{parsedSoap.assessment}</p>
                              </div>
                            )}
                            {parsedSoap.plan && (
                              <div>
                                <span className="font-medium">Plan:</span>
                                <p className="mt-1">{parsedSoap.plan}</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
