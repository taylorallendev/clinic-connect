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
      title: "SOAP notes updated",
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
        className="fixed inset-0 bg-black/30 z-40"
        onClick={handleClickOutside}
      />
      
      {/* Editor panel */}
      <div className="fixed inset-0 right-0 left-auto w-3/5 h-screen bg-blue-950 border-l border-blue-800/30 shadow-xl z-50 overflow-y-auto">
        <Card className="border-0 h-full flex flex-col bg-transparent">
          <CardHeader className="sticky top-0 bg-blue-950 z-10 flex flex-row items-center justify-between border-b border-blue-800/30">
            <div className="flex items-center gap-2">
              <CardTitle className="text-blue-50">Edit SOAP Notes</CardTitle>
              {actionId && (
                <Badge className="bg-blue-800/50 text-blue-200 border-0">
                  ID: {actionId.substring(0, 8)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
                className="h-8 w-8 text-blue-300 hover:text-blue-100 hover:bg-blue-800/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6 pb-16 pt-6">
          {transcript && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 text-blue-300">Original Transcript</h3>
              <div className="bg-blue-900/30 border border-blue-800/30 rounded-md p-3 text-sm text-blue-100 max-h-40 overflow-y-auto whitespace-pre-line">
                {transcript}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center mb-2">
              <Badge className="bg-blue-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">S</Badge>
              <h3 className="text-base font-medium text-blue-300">
                Subjective
              </h3>
            </div>
            <RichTextEditor
              value={soap.subjective}
              onChange={(value) => handleUpdateSection("subjective", value)}
              className="bg-blue-900/20 border-blue-800/30"
            />
          </div>

          <Separator className="border-blue-800/30" />

          <div>
            <div className="flex items-center mb-2">
              <Badge className="bg-green-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">O</Badge>
              <h3 className="text-base font-medium text-green-300">
                Objective
              </h3>
            </div>
            <RichTextEditor
              value={soap.objective}
              onChange={(value) => handleUpdateSection("objective", value)}
              className="bg-blue-900/20 border-blue-800/30"
            />
          </div>

          <Separator className="border-blue-800/30" />

          <div>
            <div className="flex items-center mb-2">
              <Badge className="bg-purple-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">A</Badge>
              <h3 className="text-base font-medium text-purple-300">
                Assessment
              </h3>
            </div>
            <RichTextEditor
              value={soap.assessment}
              onChange={(value) => handleUpdateSection("assessment", value)}
              className="bg-blue-900/20 border-blue-800/30"
            />
          </div>

          <Separator className="border-blue-800/30" />

          <div>
            <div className="flex items-center mb-2">
              <Badge className="bg-amber-600 text-white mr-2 h-5 w-5 flex items-center justify-center p-0">P</Badge>
              <h3 className="text-base font-medium text-amber-300">Plan</h3>
            </div>
            <RichTextEditor
              value={soap.plan}
              onChange={(value) => handleUpdateSection("plan", value)}
              className="bg-blue-900/20 border-blue-800/30"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t border-blue-800/30 bg-blue-950/95 sticky bottom-0 py-3">
          <div className="flex justify-end w-full gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="border-blue-700/30 text-blue-300 hover:text-blue-100 hover:bg-blue-800/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
