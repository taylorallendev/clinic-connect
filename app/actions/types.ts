// Export types from various action files
// This file does NOT have "use server" directive

// Define the types needed by components without importing from server files
export interface Case {
  id: string;
  name: string;
  patient: string;
  type: string;
  date: string;
  assignedTo: string;
  status: string;
  time?: string;
}

export type CaseStatus = "draft" | "in_progress" | "completed";
export type CaseType = "checkup" | "emergency" | "surgery" | "follow_up";

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Template {
  id: number;
  name: string;
  type: string;
  content: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCaseInput {
  name: string;
  dateTime: string;
  assignedTo: string;
  type: string;
  status?: string;
  visibility?: string;
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