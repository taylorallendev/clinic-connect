"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Loader2, Trash2 } from "lucide-react";

interface CaseHeaderProps {
  currentCaseId: string | null;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  actionsLength: number;
}

export function CaseHeader({ 
  currentCaseId, 
  isSaving, 
  onSave, 
  onReset,
  actionsLength
}: CaseHeaderProps) {

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-[#1A202C]">Current Case</h1>
      <div className="flex items-center gap-3">
        {/* Reset button - with confirmation dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-[#E76F51]/10 text-[#E76F51] border-[#E76F51]/30 hover:bg-[#E76F51]/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border-[#E2E8F0]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#1A202C]">
                Reset Case
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#718096]">
                This will clear all recordings and notes. Are you sure you want to reset?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-[#718096] border-[#E2E8F0] hover:bg-[#F8F9FA] hover:text-[#1A202C]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#E76F51] text-white hover:bg-[#E76F51]/90"
                onClick={onReset}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save Button */}
        <Button 
          className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
          onClick={onSave}
          disabled={isSaving || actionsLength === 0}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {currentCaseId ? "Update Case" : "Save Case"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}