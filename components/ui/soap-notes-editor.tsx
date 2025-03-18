"use client";

import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./card";
import { Separator } from "./separator";
import { RichTextEditor } from "./rich-text-editor";
import { SoapResponse } from "@/store/use-case-store";
import { Badge } from "./badge";
import { useToast } from "./use-toast";

interface SoapNotesEditorProps {
  soapNotes: SoapResponse;
  onClose: () => void;
  onUpdate: (updatedSoap: SoapResponse) => void;
  onSave?: () => void;
  transcript?: string;
  actionId?: string;
}

export function SoapNotesEditor({
  soapNotes,
  onClose,
  onUpdate,
  onSave,
  transcript,
  actionId,
}: SoapNotesEditorProps) {
  const { toast } = useToast();
  const [soap, setSoap] = useState<SoapResponse>({
    subjective: soapNotes.subjective || "",
    objective: soapNotes.objective || "",
    assessment: soapNotes.assessment || "",
    plan: soapNotes.plan || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Determine template type from the subjective field
  const isTemplateGenerated = soap.subjective.startsWith("Generated using template:");
  // Extract template name from subjective field if it's a generated template
  const templateName = isTemplateGenerated
    ? soap.subjective.replace("Generated using template:", "").trim()
    : "SOAP Notes";
  // Use objective field to determine template type
  const templateType = soap.objective || "";
  // Check if this is a standard SOAP note or another template type
  const isSoapFormat = !isTemplateGenerated || templateType.toLowerCase() === "soap_notes";

  const handleUpdateSection = (section: keyof SoapResponse, value: string) => {
    setSoap((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);

    // Call onUpdate with the updated SOAP notes
    onUpdate(soap);

    if (onSave) {
      onSave();
    }

    toast({
      title: isSoapFormat ? "SOAP notes updated" : `${templateType} content updated`,
      description: "Your changes have been saved successfully",
    });

    setIsSaving(false);
  };

  // Function to handle clicking outside
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay
    if (e.target === e.currentTarget) {
      handleSave();
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for clicking outside */}
      <div
        className="fixed inset-0 top-0 bottom-0 left-0 right-0 bg-black/30 z-[100]"
        onClick={handleClickOutside}
        style={{margin: 0, padding: 0}}
      />

      {/* Editor panel */}
      <div className="fixed top-0 bottom-0 right-0 left-auto w-3/5 h-screen bg-background border-l border-border shadow-xl z-[101] overflow-y-auto" style={{margin: 0, padding: 0}}>
        <Card className="border-0 h-full flex flex-col bg-transparent">
          <CardHeader className="sticky top-0 bg-background z-10 flex flex-row items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <CardTitle className="text-foreground">
                {isSoapFormat ? "Edit SOAP Notes" : `Edit ${templateType} Content`}
              </CardTitle>
              {actionId && (
                <Badge className="bg-muted text-muted-foreground border-0">
                  ID: {actionId.substring(0, 8)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-6 pb-16 pt-6">
            {transcript && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                  Original Transcript
                </h3>
                <div className="bg-muted/30 border border-border rounded-md p-3 text-sm text-foreground max-h-40 overflow-y-auto whitespace-pre-line">
                  {transcript}
                </div>
              </div>
            )}

            {isSoapFormat ? (
              // Standard SOAP layout with 4 sections
              <>
                <div>
                  <div className="flex items-center mb-2">
                    <Badge className="bg-primary text-primary-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                      S
                    </Badge>
                    <h3 className="text-base font-medium text-foreground">
                      Subjective
                    </h3>
                  </div>
                  <RichTextEditor
                    value={soap.subjective}
                    onChange={(value) => handleUpdateSection("subjective", value)}
                    className="bg-muted/20 border-border [&_.ProseMirror]:!text-card-foreground"
                  />
                </div>

                <Separator className="border-border" />

                <div>
                  <div className="flex items-center mb-2">
                    <Badge className="bg-success text-success-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                      O
                    </Badge>
                    <h3 className="text-base font-medium text-foreground">
                      Objective
                    </h3>
                  </div>
                  <RichTextEditor
                    value={soap.objective}
                    onChange={(value) => handleUpdateSection("objective", value)}
                    className="bg-muted/20 border-border [&_.ProseMirror]:!text-card-foreground"
                  />
                </div>

                <Separator className="border-border" />

                <div>
                  <div className="flex items-center mb-2">
                    <Badge className="bg-info text-info-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                      A
                    </Badge>
                    <h3 className="text-base font-medium text-foreground">
                      Assessment
                    </h3>
                  </div>
                  <RichTextEditor
                    value={soap.assessment}
                    onChange={(value) => handleUpdateSection("assessment", value)}
                    className="bg-muted/20 border-border [&_.ProseMirror]:!text-card-foreground"
                  />
                </div>

                <Separator className="border-border" />

                <div>
                  <div className="flex items-center mb-2">
                    <Badge className="bg-accent text-accent-foreground mr-2 h-5 w-5 flex items-center justify-center p-0">
                      P
                    </Badge>
                    <h3 className="text-base font-medium text-foreground">Plan</h3>
                  </div>
                  <RichTextEditor
                    value={soap.plan}
                    onChange={(value) => handleUpdateSection("plan", value)}
                    className="bg-muted/20 border-border [&_.ProseMirror]:!text-card-foreground"
                  />
                </div>
              </>
            ) : (
              // Single content editor for other template types
              <div>
                <div className="flex items-center mb-2">
                  <Badge 
                    className="bg-purple-600 text-white mr-2 h-5 flex items-center justify-center px-2 py-0.5"
                  >
                    {templateType}
                  </Badge>
                  <h3 className="text-base font-medium text-foreground">
                    {templateName}
                  </h3>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Edit the generated content below.
                </div>
                <RichTextEditor
                  value={soap.plan}
                  onChange={(value) => handleUpdateSection("plan", value)}
                  className="bg-muted/20 border-border [&_.ProseMirror]:!text-card-foreground min-h-[300px]"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border bg-background/95 sticky bottom-0 py-3">
            <div className="flex justify-end w-full gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
