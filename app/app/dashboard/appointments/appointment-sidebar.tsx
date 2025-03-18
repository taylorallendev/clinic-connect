"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, FileText, Copy, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppointmentData, CaseAction } from "@/store/use-case-store";

interface AppointmentSidebarProps {
  appointment: AppointmentData;
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentSidebar({
  appointment,
  isOpen = true,
  onClose,
}: AppointmentSidebarProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Function to copy individual SOAP section to clipboard
  const copySoapSection = async (
    action: CaseAction,
    section: "subjective" | "objective" | "assessment" | "plan"
  ) => {
    if (action.type !== "soap" || !action.content.soap) return;

    const soap = parseSoapNotes(action);
    if (!soap) return;

    const sectionContent = soap[section] || "N/A";
    const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
    const textToCopy = `${sectionTitle}: ${sectionContent}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(`${action.id}-${section}`);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Filter to only show SOAP notes
  const soapActions =
    appointment.case_actions?.filter((action) => action.type === "soap") || [];

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "block" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-blue-950/95 shadow-xl">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-blue-800/30 px-4 py-3">
            <h2 className="text-lg font-semibold text-blue-50">
              Appointment Details
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-blue-800/30"
            >
              <X className="h-5 w-5 text-blue-200" />
            </button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Compact info grid layout */}
              <div className="grid grid-cols-2 gap-3 bg-blue-900/30 p-3 rounded-lg border border-blue-800/30">
                <div>
                  <h3 className="text-xs font-medium text-blue-400 mb-1">Date & Time</h3>
                  <p className="text-sm text-blue-50">{appointment.date} at {appointment.time}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-blue-400 mb-1">Patient</h3>
                  <p className="text-sm text-blue-50">{appointment.patients?.name || "Unknown Patient"}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-blue-400 mb-1">Provider</h3>
                  <p className="text-sm text-blue-50">{appointment.users?.name || "Unassigned"}</p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xs font-medium text-blue-400 mb-1">Status</h3>
                  <Badge className={`capitalize ${getStatusColor(appointment.status)} text-white text-xs`}>
                    {appointment.status?.replace("_", " ") || "Scheduled"}
                  </Badge>
                </div>
                
                <div className="col-span-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-blue-400 mb-1">Type</h3>
                    <Badge variant="outline" className="capitalize text-blue-100 border-blue-700/50 text-xs">
                      {appointment.type?.replace("_", " ") || "General"}
                    </Badge>
                  </div>
                </div>
              </div>

              {soapActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-blue-400 bg-blue-900/50 py-2 px-3 rounded-t-lg flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    SOAP Notes
                  </h3>
                  <div className="space-y-3 border border-blue-800/30 p-3 rounded-b-lg bg-blue-950/50">
                    {soapActions.map((action) => {
                      const parsedSoap = parseSoapNotes(action);
                      
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
                        <div
                          key={action.id}
                          className="bg-blue-900/30 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-3 border-b border-blue-800/30">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-400" />
                              <span className="text-sm font-medium text-blue-100">
                                {templateName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-400">
                                {formatDistanceToNow(new Date(action.timestamp), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          {action.content.soap && (
                            <div className="p-3">
                              {isSoapFormat ? (
                                <div className="text-sm text-blue-200">
                                  {/* Compact tabbed layout for SOAP notes */}
                                  <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                    {/* SOAP sections in separate boxes */}
                                    <div className="space-y-3 p-3">
                                      <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-blue-900/40 px-3 py-2">
                                          <h4 className="text-blue-100 flex items-center text-xs font-medium">
                                            <div className="bg-blue-600 text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              S
                                            </div>
                                            Subjective
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "subjective")}
                                            className="text-blue-300 hover:text-blue-100 transition-colors"
                                            title="Copy Subjective"
                                          >
                                            {copiedId === `${action.id}-subjective` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-blue-950/30">
                                          {truncateText(parsedSoap?.subjective || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-blue-900/40 px-3 py-2">
                                          <h4 className="text-blue-100 flex items-center text-xs font-medium">
                                            <div className="bg-green-600 text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              O
                                            </div>
                                            Objective
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "objective")}
                                            className="text-blue-300 hover:text-blue-100 transition-colors"
                                            title="Copy Objective"
                                          >
                                            {copiedId === `${action.id}-objective` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-blue-950/30">
                                          {truncateText(parsedSoap?.objective || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-blue-900/40 px-3 py-2">
                                          <h4 className="text-blue-100 flex items-center text-xs font-medium">
                                            <div className="bg-purple-600 text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              A
                                            </div>
                                            Assessment
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "assessment")}
                                            className="text-blue-300 hover:text-blue-100 transition-colors"
                                            title="Copy Assessment"
                                          >
                                            {copiedId === `${action.id}-assessment` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-blue-950/30">
                                          {truncateText(parsedSoap?.assessment || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-blue-800/30 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-blue-900/40 px-3 py-2">
                                          <h4 className="text-blue-100 flex items-center text-xs font-medium">
                                            <div className="bg-amber-600 text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              P
                                            </div>
                                            Plan
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "plan")}
                                            className="text-blue-300 hover:text-blue-100 transition-colors"
                                            title="Copy Plan"
                                          >
                                            {copiedId === `${action.id}-plan` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-blue-950/30">
                                          {truncateText(parsedSoap?.plan || "", 300)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-blue-200">
                                  {truncateText(parsedSoap?.plan || "", 200)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-blue-800/30">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
              <Link href={`/app/dashboard/case/${appointment.id}?from=appointments`}>
                View Full Case
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
