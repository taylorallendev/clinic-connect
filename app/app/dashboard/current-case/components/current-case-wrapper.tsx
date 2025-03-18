"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "../simplified-store";
import { useEmailButton } from "@/context/EmailButtonContext";

// Import our custom hooks
import { useCaseForm } from "../hooks/use-case-form";
import { useSpeechRecognition } from "../hooks/use-speech-recognition";
import { useTemplateGeneration } from "../hooks/use-template-generation";
import { useEmail } from "../hooks/use-email";

// Import our components
import { CaseHeader } from "./case-header";
import { CaseInformationForm } from "./case-information-form";
import { VoiceRecording } from "./voice-recording";
import { EmailDialog } from "./email-dialog";
import { SoapNotesEditor } from "@/components/ui/soap-notes-editor";

import { SoapResponse } from "../simplified-store";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface CurrentCaseWrapperProps {
  initialCaseId?: string;
}

export function CurrentCaseWrapper({ initialCaseId }: CurrentCaseWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setShowEmailButton: setContextEmailButton } = useEmailButton();
  const [expandedTranscripts, setExpandedTranscripts] = useState<
    Record<string, boolean>
  >({});
  const [expandedSoaps, setExpandedSoaps] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedSoapSections, setExpandedSoapSections] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [selectedSoapIds, setSelectedSoapIds] = useState<string[]>([]);
  const [caseSummaryCollapsed, setCaseSummaryCollapsed] = useState(false);
  const [editingSoapId, setEditingSoapId] = useState<string | null>(null);
  const [editingSoapData, setEditingSoapData] = useState<{
    action: any;
    transcript: string;
  } | null>(null);

  // Use our custom hooks
  const {
    form,
    isEditMode,
    setIsEditMode,
    savedCaseData,
    setSavedCaseData,
    loadCaseData,
    handleSubmit,
    handleUpdateCase,
    isSaving,
  } = useCaseForm(initialCaseId || null);

  const {
    isRecording,
    recordingTime,
    isProcessing,
    transcriptText,
    toggleRecording,
    formatTime,
  } = useSpeechRecognition();

  const {
    selectedTemplateId,
    setSelectedTemplateId,
    availableTemplates,
    isLoadingTemplates,
    isGeneratingSoap,
    handleGenerateFromTemplate,
    handleGenerateFromMultiple,
  } = useTemplateGeneration();

  const {
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
  } = useEmail();

  // Access the store with useStore hook to get updated state
  const actions = useCaseStore((state) => state.actions);
  const resetCaseStore = useCaseStore((state) => state.resetCaseStore);

  // Reset all state and forms
  const handleReset = () => {
    resetCaseStore();
    form.reset({
      name: "",
      dateTime: new Date().toISOString().slice(0, 16),
      assignedTo: "",
      type: "checkup",
      status: "ongoing",
      visibility: "private",
    });
    setIsEditMode(true);
    setSavedCaseData(null);
    setSelectedTemplateId("");
    setShowEmailDialog(false);
    setExpandedTranscripts({});
    setExpandedSoaps({});
    setExpandedSoapSections({});
    setSelectedSoapIds([]);
    setEditingSoapId(null);
    setEditingSoapData(null);

    toast({
      title: "Case Reset",
      description: "All case data has been cleared",
    });
  };

  // Save handler
  const handleSave = async () => {
    if (initialCaseId) {
      await handleUpdateCase();
    } else {
      await handleSubmit();
    }
  };

  // Function to handle editing SOAP notes
  const handleEditSoap = (action: any) => {
    if (action.type === "soap" && action.content.soap) {
      setEditingSoapId(action.id);
      setEditingSoapData({
        action,
        transcript: action.content.transcript || "",
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
          soap: updatedSoap,
        },
      });

      // Close the editor
      handleCloseSoapEditor();

      // Update local state
      toast({
        title: "SOAP notes updated",
        description: "Your changes have been saved",
      });
    }
  };

  // Load case data on initial load
  useEffect(() => {
    if (initialCaseId) {
      loadCaseData(initialCaseId);
    }
  }, [initialCaseId]);

  // Set email button in context
  useEffect(() => {
    setContextEmailButton(showEmailButton);

    return () => {
      setContextEmailButton(false);
    };
  }, [showEmailButton, setContextEmailButton]);

  // Initialize expanded sections for SOAP notes
  useEffect(() => {
    if (!actions) return;

    const initialExpandedSections: Record<string, Record<string, boolean>> = {};

    actions.forEach((action) => {
      if (action.type === "soap") {
        initialExpandedSections[action.id] = {
          subjective: false,
          objective: false,
          assessment: false,
          plan: false,
        };
      }
    });

    setExpandedSoapSections((prev) => ({
      ...prev,
      ...initialExpandedSections,
    }));
  }, [actions]);

  return (
    <div className="flex flex-col space-y-6 p-6 bg-white light current-case-page">
      {/* Header Section */}
      <CaseHeader
        currentCaseId={initialCaseId || null}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        actionsLength={actions?.length || 0}
      />

      {/* Top Grid with Case Info and Voice Recording side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Case Information Form */}
        <CaseInformationForm
          form={form}
          isEditMode={isEditMode}
          savedCaseData={savedCaseData}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          onSubmit={handleSave}
        />

        {/* Voice Recording Section */}
        <VoiceRecording
          isRecording={isRecording}
          isProcessing={isProcessing}
          recordingTime={recordingTime}
          transcriptText={transcriptText}
          formatTime={formatTime}
          onToggleRecording={toggleRecording}
        />
      </div>
      
      {/* Case Actions Section - Full Width Below */}
      <div className="mt-6">
        {/* This will be a full-width Card for case actions */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-[#E2E8F0] bg-[#F8F9FA] px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-[#1A202C]">Case Actions</h3>
            {actions?.length > 0 ? (
              <span className="text-sm text-[#718096]">{actions.length} actions recorded</span>
            ) : (
              <span className="text-sm text-[#718096]">No actions yet</span>
            )}
          </div>
          <div className="p-6">
            {actions?.length > 0 ? (
              <div className="space-y-4">
                <p className="text-[#1A202C]">
                  Your recordings and SOAP notes will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-[#1A202C] font-medium">No Case Actions Yet</p>
                <p className="text-[#718096] text-sm mt-2 max-w-md">
                  Start by recording patient information using the microphone above, then generate SOAP notes from your recordings.
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* Email Dialog */}
      <EmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        emailTo={emailTo}
        emailFrom={emailFrom}
        setEmailTo={setEmailTo}
        setEmailFrom={setEmailFrom}
        isSending={isSendingEmail}
        savedCaseData={savedCaseData}
        onSend={() => handleSendEmail(savedCaseData)}
      />

      {/* Add the floating email button */}
      {showEmailButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={handleEmailClick}
            className="flex items-center gap-2 bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      )}
    </div>
  );
}
