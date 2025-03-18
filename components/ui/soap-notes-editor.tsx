"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";

interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SoapNotesEditorProps {
  soapNotes: SoapResponse;
  transcript: string;
  onClose: () => void;
  onUpdate: (updatedSoap: SoapResponse) => void;
  actionId: string;
}

export function SoapNotesEditor({
  soapNotes,
  transcript,
  onClose,
  onUpdate,
  actionId,
}: SoapNotesEditorProps) {
  // Parse the SOAP notes if they're in JSON string format
  const [parsedSoap, setParsedSoap] = useState<SoapResponse>(soapNotes);

  useEffect(() => {
    // Try to parse the SOAP notes if they appear to be in JSON format
    try {
      // Check if any field contains JSON
      if (
        typeof soapNotes.plan === "string" &&
        (soapNotes.plan.includes('"subjective":') ||
          soapNotes.plan.includes('"objective":') ||
          soapNotes.plan.includes('"assessment":') ||
          soapNotes.plan.includes('"plan":'))
      ) {
        const parsed = JSON.parse(soapNotes.plan);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.subjective ||
            parsed.objective ||
            parsed.assessment ||
            parsed.plan)
        ) {
          setParsedSoap(parsed);
          return;
        }
      }

      // If we couldn't parse JSON or it wasn't in JSON format, use the original
      setParsedSoap(soapNotes);
    } catch (e) {
      console.error("Failed to parse SOAP JSON:", e);
      setParsedSoap(soapNotes);
    }
  }, [soapNotes]);

  // Initialize state with the parsed SOAP notes
  const [editedSoap, setEditedSoap] = useState<SoapResponse>({
    subjective: parsedSoap.subjective || "",
    objective: parsedSoap.objective || "",
    assessment: parsedSoap.assessment || "",
    plan: parsedSoap.plan || "",
  });

  // Update edited soap when parsed soap changes
  useEffect(() => {
    setEditedSoap({
      subjective: parsedSoap.subjective || "",
      objective: parsedSoap.objective || "",
      assessment: parsedSoap.assessment || "",
      plan: parsedSoap.plan || "",
    });
  }, [parsedSoap]);

  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
  });

  // Determine if this is a standard SOAP note or another template type
  const isSoapFormat =
    !parsedSoap.subjective?.startsWith("Generated using template:") &&
    parsedSoap.subjective &&
    parsedSoap.objective &&
    parsedSoap.assessment &&
    parsedSoap.plan;

  // Handle saving the edited SOAP notes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call the onUpdate callback with the edited SOAP notes
      onUpdate(editedSoap);
    } catch (error) {
      console.error("Error saving SOAP notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle changes to the SOAP notes
  const handleChange = (section: keyof SoapResponse, value: string) => {
    setEditedSoap((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  // Toggle section expansion
  const toggleSection = (section: keyof SoapResponse) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format helper functions
  const addFormatting = (section: keyof SoapResponse, format: string) => {
    const textarea = document.getElementById(
      `${section}-textarea`
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${text.substring(start, end)}**`;
        break;
      case "italic":
        formattedText = `*${text.substring(start, end)}*`;
        break;
      case "underline":
        formattedText = `<u>${text.substring(start, end)}</u>`;
        break;
      case "bullet":
        formattedText = `\n- ${text.substring(start, end)}`;
        break;
      case "number":
        formattedText = `\n1. ${text.substring(start, end)}`;
        break;
      default:
        return;
    }

    const newText =
      text.substring(0, start) + formattedText + text.substring(end);
    handleChange(section, newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length
      );
    }, 0);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center">
            Edit {isSoapFormat ? "SOAP Notes" : "Generated Content"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isSoapFormat
              ? "Edit the Subjective, Objective, Assessment, and Plan sections."
              : "Edit the generated content."}
          </DialogDescription>
        </DialogHeader>

        {/* Original transcript for reference */}
        {transcript && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Original Transcript
            </h3>
            <div className="bg-muted/20 border border-muted/30 rounded-lg p-3 text-muted-foreground text-sm max-h-[150px] overflow-y-auto">
              {transcript}
            </div>
          </div>
        )}

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-4 border-b border-muted/30 pb-2">
          <Toggle
            size="sm"
            aria-label="Bold"
            onClick={() => {
              const activeSection = document.activeElement?.id?.split(
                "-"
              )[0] as keyof SoapResponse;
              if (
                activeSection &&
                Object.keys(editedSoap).includes(activeSection)
              ) {
                addFormatting(activeSection, "bold");
              }
            }}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            aria-label="Italic"
            onClick={() => {
              const activeSection = document.activeElement?.id?.split(
                "-"
              )[0] as keyof SoapResponse;
              if (
                activeSection &&
                Object.keys(editedSoap).includes(activeSection)
              ) {
                addFormatting(activeSection, "italic");
              }
            }}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            aria-label="Underline"
            onClick={() => {
              const activeSection = document.activeElement?.id?.split(
                "-"
              )[0] as keyof SoapResponse;
              if (
                activeSection &&
                Object.keys(editedSoap).includes(activeSection)
              ) {
                addFormatting(activeSection, "underline");
              }
            }}
          >
            <Underline className="h-4 w-4" />
          </Toggle>
          <div className="h-4 w-px bg-muted/50 mx-1" />
          <Toggle
            size="sm"
            aria-label="Bullet List"
            onClick={() => {
              const activeSection = document.activeElement?.id?.split(
                "-"
              )[0] as keyof SoapResponse;
              if (
                activeSection &&
                Object.keys(editedSoap).includes(activeSection)
              ) {
                addFormatting(activeSection, "bullet");
              }
            }}
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            aria-label="Numbered List"
            onClick={() => {
              const activeSection = document.activeElement?.id?.split(
                "-"
              )[0] as keyof SoapResponse;
              if (
                activeSection &&
                Object.keys(editedSoap).includes(activeSection)
              ) {
                addFormatting(activeSection, "number");
              }
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        {isSoapFormat ? (
          <div className="space-y-4">
            {/* Subjective Section */}
            <div className="border border-muted/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between bg-muted/10 p-2 cursor-pointer"
                onClick={() => toggleSection("subjective")}
              >
                <div className="flex items-center">
                  <Badge className="bg-muted text-muted-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                    S
                  </Badge>
                  <span className="font-medium">Subjective</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {expandedSections.subjective ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              {expandedSections.subjective && (
                <div className="p-3">
                  <Textarea
                    id="subjective-textarea"
                    value={editedSoap.subjective}
                    onChange={(e) => handleChange("subjective", e.target.value)}
                    placeholder="Enter subjective notes..."
                    className="min-h-[100px] bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* Objective Section */}
            <div className="border border-muted/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between bg-muted/10 p-2 cursor-pointer"
                onClick={() => toggleSection("objective")}
              >
                <div className="flex items-center">
                  <Badge className="bg-green-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                    O
                  </Badge>
                  <span className="font-medium">Objective</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {expandedSections.objective ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              {expandedSections.objective && (
                <div className="p-3">
                  <Textarea
                    id="objective-textarea"
                    value={editedSoap.objective}
                    onChange={(e) => handleChange("objective", e.target.value)}
                    placeholder="Enter objective notes..."
                    className="min-h-[100px] bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* Assessment Section */}
            <div className="border border-muted/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between bg-muted/10 p-2 cursor-pointer"
                onClick={() => toggleSection("assessment")}
              >
                <div className="flex items-center">
                  <Badge className="bg-purple-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                    A
                  </Badge>
                  <span className="font-medium">Assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {expandedSections.assessment ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              {expandedSections.assessment && (
                <div className="p-3">
                  <Textarea
                    id="assessment-textarea"
                    value={editedSoap.assessment}
                    onChange={(e) => handleChange("assessment", e.target.value)}
                    placeholder="Enter assessment notes..."
                    className="min-h-[100px] bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* Plan Section */}
            <div className="border border-muted/30 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between bg-muted/10 p-2 cursor-pointer"
                onClick={() => toggleSection("plan")}
              >
                <div className="flex items-center">
                  <Badge className="bg-amber-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">
                    P
                  </Badge>
                  <span className="font-medium">Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {expandedSections.plan ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              {expandedSections.plan && (
                <div className="p-3">
                  <Textarea
                    id="plan-textarea"
                    value={editedSoap.plan}
                    onChange={(e) => handleChange("plan", e.target.value)}
                    placeholder="Enter plan notes..."
                    className="min-h-[100px] bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          // For non-SOAP template content, just show a single editor
          <div>
            <Textarea
              id="plan-textarea"
              value={editedSoap.plan}
              onChange={(e) => handleChange("plan", e.target.value)}
              placeholder="Enter content..."
              className="min-h-[400px] bg-muted/20 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-muted/20 border-muted/30 text-card-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
