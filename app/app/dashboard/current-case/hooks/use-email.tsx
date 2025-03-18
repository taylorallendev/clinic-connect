"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "../simplified-store";
import { simpleSendEmail } from "../email-actions";
import { FormValues } from "./use-case-form";

export function useEmail() {
  const [showEmailButton, setShowEmailButton] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const { toast } = useToast();
  const { actions } = useCaseStore();

  const handleActionSelect = (actionId: string) => {
    setSelectedActionId(actionId);
    setShowEmailButton(true);
  };

  const handleActionDeselect = () => {
    // Hide the email button if no more recordings are selected
    const anySelected = useCaseStore.getState().selectedRecordings.length > 0;
    if (!anySelected) {
      setShowEmailButton(false);
    }
  };

  const handleEmailClick = () => {
    // Open email dialog
    setShowEmailDialog(true);
  };

  const handleSendEmail = async (savedCaseData: FormValues | null) => {
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
        
        // Close dialog and reset fields
        setShowEmailDialog(false);
      } else {
        toast({
          title: "Email Failed",
          description: result.error || "Failed to send email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "An error occurred while sending the email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return {
    showEmailButton,
    selectedActionId,
    showEmailDialog,
    setShowEmailDialog,
    emailTo,
    setEmailTo,
    emailFrom,
    setEmailFrom,
    isSendingEmail,
    handleActionSelect,
    handleActionDeselect,
    handleEmailClick,
    handleSendEmail,
  };
}