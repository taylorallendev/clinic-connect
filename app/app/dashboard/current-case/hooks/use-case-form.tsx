"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { createCase, updateCase, getCase } from "../actions";
import { caseFormSchema } from "../case-form";
export type FormValues = {
  name: string;
  dateTime: string;
  assignedTo: string;
  type: string;
  status: string;
  visibility: string;
};

export function useCaseForm(initialCaseId: string | null) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(!initialCaseId);
  const [savedCaseData, setSavedCaseData] = useState<FormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      name: "",
      dateTime: new Date().toISOString().slice(0, 16),
      assignedTo: "",
      type: "checkup",
      status: "ongoing",
      visibility: "private",
    },
  });

  // Load case data
  const loadCaseData = async (caseId: string) => {
    try {
      const result = await getCase(parseInt(caseId));

      if (result.success && result.data) {
        // Format the data to match the form structure
        const caseData: FormValues = {
          name: result.data.name,
          dateTime: new Date(result.data.dateTime)
            .toISOString()
            .slice(0, 16),
          assignedTo: result.data.assignedTo || "",
          type: result.data.type,
          status: result.data.status || "ongoing",
          visibility: result.data.visibility || "private",
        };

        // Update form with existing data
        form.reset(caseData);

        // Save to view state
        setSavedCaseData(caseData);

        // Set to view mode since we're loading an existing case
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error loading case data:", error);
      toast({
        title: "Error loading case",
        description: "Failed to load case data",
        variant: "destructive",
      });
    }
  };

  // Handle form submission (create new case)
  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const values = form.getValues();
      const result = await createCase(values);

      if (result.success && result.caseId) {
        toast({
          title: "Case created",
          description: "Your case has been created successfully",
        });

        // Update saved data
        setSavedCaseData(values);

        // Switch to view mode
        setIsEditMode(false);

        // Navigate to the new case
        router.push(`/app/dashboard/case/${result.caseId}`);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating case:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the case",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle case update
  const handleUpdateCase = async () => {
    if (!initialCaseId) return;

    setIsSaving(true);
    try {
      const values = form.getValues();
      const result = await updateCase(parseInt(initialCaseId), values);

      if (result.success) {
        toast({
          title: "Case updated",
          description: "Your case has been updated successfully",
        });

        // Update saved data
        setSavedCaseData(values);

        // Switch to view mode
        setIsEditMode(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating case:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the case",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isEditMode,
    setIsEditMode,
    savedCaseData,
    setSavedCaseData,
    loadCaseData,
    handleSubmit,
    handleUpdateCase,
    isSaving,
  };
}