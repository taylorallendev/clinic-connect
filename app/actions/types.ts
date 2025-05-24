// Export types from various action files
// This file does NOT have "use server" directive
import { Tables, Enums, TablesInsert, TablesUpdate } from "@/database.types";

// Use Supabase enums directly
export type CaseStatus = Enums<"CaseStatus">;
export type CaseType = Enums<"CaseType">;
export type CaseVisibility = Enums<"CaseVisibility">;

// Client-specific extensions and utility types
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Use the generated Case type directly and extend it with client-specific fields
export type Case = Tables<"cases">;

// Extend the Supabase generated types for client use
export interface ClientCase extends Tables<"cases"> {
  // Add client-specific fields not in the database
  name: string;
  patient: string;
  assignedTo: string;
  date: string;
  time?: string;
}

// Use the generated Template type directly
export type Template = Tables<"templates">;
export type TemplateInsert = Omit<TablesInsert<"templates">, "created_at" | "updated_at">;
export type TemplateUpdate = Omit<TablesUpdate<"templates">, "created_at" | "updated_at">;

// Email specific types
export interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Input types for actions
export interface CreateCaseInput {
  name: string;
  dateTime: string;
  assignedTo: string;
  type: CaseType;
  status?: CaseStatus;
  visibility?: CaseVisibility;
  actions?: ClientCaseAction[];
}

export interface ClientCaseAction {
  id: string;
  type: "recording" | "soap" | "unknown";
  content: {
    transcript?: string;
    soap?: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
  };
  timestamp: number;
}
