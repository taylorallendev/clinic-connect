"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../hooks/use-case-form";

interface CaseInformationFormProps {
  form: UseFormReturn<FormValues>;
  isEditMode: boolean;
  savedCaseData: FormValues | null;
  onEditModeToggle: () => void;
  onSubmit: () => void;
}

export function CaseInformationForm({
  form,
  isEditMode,
  savedCaseData,
  onEditModeToggle,
  onSubmit,
}: CaseInformationFormProps) {
  return (
    <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="border-b border-[#E2E8F0] bg-[#F8F9FA]">
        <div className="flex justify-between items-center">
          <CardTitle className="text-[#1A202C]">
            {savedCaseData ? "Case Details" : "New Case"}
          </CardTitle>
          {savedCaseData && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#718096] hover:text-[#1A202C] hover:bg-[#F8F9FA]"
              onClick={onEditModeToggle}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? "Cancel" : "Edit"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Case Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">Case Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter case name"
                        {...field}
                        className={
                          isEditMode
                            ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                            : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                        }
                        disabled={!isEditMode}
                      />
                    </FormControl>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">
                      Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className={
                          isEditMode
                            ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                            : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                        }
                        disabled={!isEditMode}
                      />
                    </FormControl>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />

              {/* Assigned To */}
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">
                      Assigned To
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Provider name"
                        {...field}
                        className={
                          isEditMode
                            ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                            : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                        }
                        disabled={!isEditMode}
                      />
                    </FormControl>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />

              {/* Case Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">Case Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={
                            isEditMode
                              ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                              : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                          }
                        >
                          <SelectValue placeholder="Select a case type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-[#E2E8F0]">
                        <SelectItem value="checkup">Check-up</SelectItem>
                        <SelectItem value="consultation">
                          Consultation
                        </SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="dental">Dental</SelectItem>
                        <SelectItem value="routine">Routine Visit</SelectItem>
                        <SelectItem value="grooming">Grooming</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={
                            isEditMode
                              ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                              : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                          }
                        >
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-[#E2E8F0]">
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="exported">Exported</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />

              {/* Visibility */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A202C]">Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={
                            isEditMode
                              ? "bg-white border-[#E2E8F0] text-[#1A202C]"
                              : "bg-[#F8F9FA] border-[#E2E8F0] text-[#1A202C]"
                          }
                        >
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-[#E2E8F0]">
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#E76F51]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button - Only show when in edit mode */}
            {isEditMode && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white"
                >
                  {savedCaseData ? "Update Information" : "Save Information"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
