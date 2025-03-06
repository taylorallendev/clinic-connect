"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import { RichTextEditor } from "./rich-text-editor";
import { SoapResponse } from "@/store/use-case-store";

interface SoapNotesEditorProps {
  soapNotes: SoapResponse;
  onClose: () => void;
  onUpdate: (updatedSoap: SoapResponse) => void;
  transcript?: string;
}

export function SoapNotesEditor({
  soapNotes,
  onClose,
  onUpdate,
  transcript,
}: SoapNotesEditorProps) {
  const [soap, setSoap] = useState<SoapResponse>({
    subjective: soapNotes.subjective || "",
    objective: soapNotes.objective || "",
    assessment: soapNotes.assessment || "",
    plan: soapNotes.plan || "",
  });

  const handleUpdateSection = (section: keyof SoapResponse, value: string) => {
    setSoap((prev) => ({
      ...prev,
      [section]: value,
    }));

    // Call onUpdate with the updated SOAP notes
    onUpdate({
      ...soap,
      [section]: value,
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-background border-l shadow-xl z-50 overflow-y-auto">
      <Card className="border-0 h-full flex flex-col">
        <CardHeader className="sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <CardTitle>Edit SOAP Notes</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6 pb-16">
          {transcript && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Original Transcript</h3>
              <div className="bg-muted/20 rounded-md p-3 text-sm text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-line">
                {transcript}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-medium text-blue-500 mb-2">
              Subjective
            </h3>
            <RichTextEditor
              value={soap.subjective}
              onChange={(value) => handleUpdateSection("subjective", value)}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium text-green-500 mb-2">
              Objective
            </h3>
            <RichTextEditor
              value={soap.objective}
              onChange={(value) => handleUpdateSection("objective", value)}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium text-yellow-500 mb-2">
              Assessment
            </h3>
            <RichTextEditor
              value={soap.assessment}
              onChange={(value) => handleUpdateSection("assessment", value)}
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium text-red-500 mb-2">Plan</h3>
            <RichTextEditor
              value={soap.plan}
              onChange={(value) => handleUpdateSection("plan", value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
