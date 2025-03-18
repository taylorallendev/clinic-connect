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
        return "bg-[#38A169]/80 hover:bg-[#38A169]";
      case "ongoing":
        return "bg-[#2A9D8F]/80 hover:bg-[#2A9D8F]";
      case "exported":
        return "bg-[#264653]/80 hover:bg-[#264653]";
      case "reviewed":
        return "bg-[#E9C46A]/80 hover:bg-[#E9C46A]";
      case "scheduled":
        return "bg-[#718096]/80 hover:bg-[#718096]";
      default:
        return "bg-[#718096]/80 hover:bg-[#718096]";
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
    <div className={`fixed inset-0 z-50 ${isOpen ? "block" : "hidden"} light`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#F8F9FA] shadow-xl">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
            <h2 className="text-lg font-semibold text-[#1A202C]">
              Appointment Details
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-[#E2E8F0]"
            >
              <X className="h-5 w-5 text-[#718096]" />
            </button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Compact info grid layout */}
              <div className="grid grid-cols-2 gap-3 bg-[#E2E8F0] p-3 rounded-lg border border-[#E2E8F0]">
                <div>
                  <h3 className="text-xs font-medium text-[#718096] mb-1">Date & Time</h3>
                  <p className="text-sm text-[#1A202C]">{appointment.date} at {appointment.time}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-[#718096] mb-1">Patient</h3>
                  <p className="text-sm text-[#1A202C]">{appointment.patients?.name || "Unknown Patient"}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium text-[#718096] mb-1">Provider</h3>
                  <p className="text-sm text-[#1A202C]">{appointment.users?.name || "Unassigned"}</p>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xs font-medium text-[#718096] mb-1">Status</h3>
                  <Badge className={`capitalize ${getStatusColor(appointment.status)} text-white text-xs`}>
                    {appointment.status?.replace("_", " ") || "Scheduled"}
                  </Badge>
                </div>
                
                <div className="col-span-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-[#718096] mb-1">Type</h3>
                    <Badge variant="outline" className="capitalize text-[#1A202C] border-[#E2E8F0] text-xs">
                      {appointment.type?.replace("_", " ") || "General"}
                    </Badge>
                  </div>
                </div>
              </div>

              {soapActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#1A202C] bg-[#E2E8F0] py-2 px-3 rounded-t-lg flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    SOAP Notes
                  </h3>
                  <div className="space-y-3 border border-[#E2E8F0] p-3 rounded-b-lg bg-white">
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
                          className="bg-[#E2E8F0]/50 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-3 border-b border-[#E2E8F0]">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-[#718096]" />
                              <span className="text-sm font-medium text-[#1A202C]">
                                {templateName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#718096]">
                                {formatDistanceToNow(new Date(action.timestamp), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          {action.content.soap && (
                            <div className="p-3">
                              {isSoapFormat ? (
                                <div className="text-sm text-[#1A202C]">
                                  {/* Compact tabbed layout for SOAP notes */}
                                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                    {/* SOAP sections in separate boxes */}
                                    <div className="space-y-3 p-3">
                                      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-[#E2E8F0] px-3 py-2">
                                          <h4 className="text-[#1A202C] flex items-center text-xs font-medium">
                                            <div className="bg-[#2A9D8F] text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              S
                                            </div>
                                            Subjective
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "subjective")}
                                            className="text-[#718096] hover:text-[#1A202C] transition-colors"
                                            title="Copy Subjective"
                                          >
                                            {copiedId === `${action.id}-subjective` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-[#F8F9FA]">
                                          {truncateText(parsedSoap?.subjective || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-[#E2E8F0] px-3 py-2">
                                          <h4 className="text-[#1A202C] flex items-center text-xs font-medium">
                                            <div className="bg-[#38A169] text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              O
                                            </div>
                                            Objective
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "objective")}
                                            className="text-[#718096] hover:text-[#1A202C] transition-colors"
                                            title="Copy Objective"
                                          >
                                            {copiedId === `${action.id}-objective` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-[#F8F9FA]">
                                          {truncateText(parsedSoap?.objective || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-[#E2E8F0] px-3 py-2">
                                          <h4 className="text-[#1A202C] flex items-center text-xs font-medium">
                                            <div className="bg-[#264653] text-white mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              A
                                            </div>
                                            Assessment
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "assessment")}
                                            className="text-[#718096] hover:text-[#1A202C] transition-colors"
                                            title="Copy Assessment"
                                          >
                                            {copiedId === `${action.id}-assessment` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-[#F8F9FA]">
                                          {truncateText(parsedSoap?.assessment || "", 300)}
                                        </div>
                                      </div>
                                      
                                      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between bg-[#E2E8F0] px-3 py-2">
                                          <h4 className="text-[#1A202C] flex items-center text-xs font-medium">
                                            <div className="bg-[#E9C46A] text-[#433409] mr-2 h-4 w-4 rounded flex items-center justify-center text-[10px]">
                                              P
                                            </div>
                                            Plan
                                          </h4>
                                          <button
                                            onClick={() => copySoapSection(action, "plan")}
                                            className="text-[#718096] hover:text-[#1A202C] transition-colors"
                                            title="Copy Plan"
                                          >
                                            {copiedId === `${action.id}-plan` ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="p-3 text-xs bg-[#F8F9FA]">
                                          {truncateText(parsedSoap?.plan || "", 300)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-[#1A202C]">
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

          <div className="p-4 border-t border-[#E2E8F0]">
            <Button className="w-full bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white" asChild>
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
