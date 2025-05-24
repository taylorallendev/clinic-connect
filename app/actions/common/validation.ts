/**
 * Common validation schemas and utilities for server actions
 */

import { z } from "zod";
import { Constants, Enums } from "@/database.types";

/**
 * Schema for creating a new case that maps to our database structure
 */
export const createCaseSchema = z.object({
  name: z.string().min(1),
  dateTime: z.string().min(1),
  assignedTo: z.string(),
  type: z.enum(
    Constants.public.Enums.CaseType as unknown as [string, ...string[]]
  ),
  status: z
    .enum(Constants.public.Enums.CaseStatus as unknown as [string, ...string[]])
    .default("ongoing"),
  visibility: z
    .enum(
      Constants.public.Enums.CaseVisibility as unknown as [string, ...string[]]
    )
    .default("private"),
});

/**
 * Schema for updating a case
 */
export const updateCaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z
    .enum(Constants.public.Enums.CaseStatus as unknown as [string, ...string[]])
    .optional(),
  visibility: z
    .enum(
      Constants.public.Enums.CaseVisibility as unknown as [string, ...string[]]
    )
    .optional(),
});

/**
 * Schema for case actions sent from the client
 */
export const caseActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["recording", "soap", "unknown"]),
  content: z.object({
    transcript: z.string().optional(),
    soap: z
      .object({
        subjective: z.string(),
        objective: z.string(),
        assessment: z.string(),
        plan: z.string(),
      })
      .optional(),
  }),
  timestamp: z.number(),
});

/**
 * TypeScript interface for client-side case actions
 */
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

/**
 * TypeScript interface for creating a new case
 * Using the Enums from database.types.ts for type safety
 */
export interface CreateCaseInput {
  name: string;
  dateTime: string;
  assignedTo: string;
  type: Enums<"CaseType">;
  status?: Enums<"CaseStatus">;
  visibility?: Enums<"CaseVisibility">;
  actions?: ClientCaseAction[];
}
