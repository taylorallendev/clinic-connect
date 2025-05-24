"use server";

/**
 * Entry point for server actions
 * Re-exports all actions from domain-specific files
 */

// Import all required types
import type {
  ClientCaseAction,
  CreateCaseInput,
  Case,
  Template,
  CaseStatus,
  CaseType,
  PaginationMeta,
} from "./types";

// Import all actions statically
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  getCurrentUserId as authGetCurrentUserId,
} from "./common/auth";

import {
  createCase as casesCreateCase,
  updateCase as casesUpdateCase,
  getCase as casesGetCase,
  saveActionsToCase as casesSaveActionsToCase,
} from "./cases/actions";

import {
  getAppointments as appointmentsGetAppointments,
  getAppointmentById as appointmentsGetAppointmentById,
  getUpcomingAppointments as appointmentsGetUpcomingAppointments,
  debugListAllCases as appointmentsDebugListAllCases,
} from "./appointments/actions";

import {
  generateContentFromTemplate as generationsGenerateContentFromTemplate,
} from "./generations/actions";

import {
  simpleSendEmail as emailSimpleSendEmail,
} from "./email/service.ts";

import {
  sendEmailWithTemplate as emailSendWithTemplate,
} from "./email/actions";

import {
  ensureDefaultEmailTemplates as emailEnsureDefaultTemplates,
} from "./email/templates";

import {
  sendWelcomeEmail as emailSendWelcomeEmail,
  sendPasswordResetEmail as emailSendPasswordResetEmail,
} from "./email/react";

import {
  getEmailTemplates as templatesGetEmailTemplates,
  getTemplates as templatesGetTemplates,
  ensureDefaultTemplates as templatesEnsureDefaultTemplates,
  createTemplate as templatesCreateTemplate,
  updateTemplate as templatesUpdateTemplate,
  deleteTemplate as templatesDeleteTemplate,
} from "./templates/actions";

// Auth actions
export async function signIn(formData: FormData) {
  return authSignIn(formData);
}

export async function signUp(formData: FormData) {
  return authSignUp(formData);
}

export async function signOut() {
  return authSignOut();
}

export async function resetPassword(formData: FormData) {
  return authResetPassword(formData);
}

export async function updatePassword(formData: FormData) {
  return authUpdatePassword(formData);
}

export async function getCurrentUserId() {
  return authGetCurrentUserId();
}

// Case actions
export async function createCase(data: CreateCaseInput) {
  return casesCreateCase(data);
}

export async function updateCase(
  data: Partial<Case> & { id: string; name: string }
) {
  return casesUpdateCase(data);
}

export async function getCase(id: string) {
  return casesGetCase(id);
}

export async function saveActionsToCase(
  caseId: string,
  actions: ClientCaseAction[]
) {
  return casesSaveActionsToCase(caseId, actions);
}

// Appointment actions
export async function getAppointments(params: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  dateFilter?: string;
  timestamp?: number;
  forceRefresh?: boolean;
}) {
  return appointmentsGetAppointments(params);
}

export async function getAppointmentById(id: string) {
  return appointmentsGetAppointmentById(id);
}

export async function getUpcomingAppointments() {
  return appointmentsGetUpcomingAppointments();
}

export async function debugListAllCases() {
  return appointmentsDebugListAllCases();
}

// Generation actions
export async function generateContentFromTemplate(
  transcriptions: string | string[],
  templateData: { templateId: string; caseId: string }
) {
  return generationsGenerateContentFromTemplate(transcriptions, templateData);
}

// Email actions
export async function simpleSendEmail(
  to: string,
  subject: string,
  content: string,
  from?: string
) {
  return emailSimpleSendEmail(to, subject, content, from);
}

export async function sendEmailWithTemplate(params: {
  to: string | string[];
  from?: string;
  templateId: string;
  templateData?: Record<string, any>;
  replyTo?: string;
}) {
  return emailSendWithTemplate(params);
}

export async function ensureDefaultEmailTemplates() {
  return emailEnsureDefaultTemplates();
}

export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  from?: string;
}) {
  return emailSendWelcomeEmail(params);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
  from?: string;
}) {
  return emailSendPasswordResetEmail(params);
}

// Template actions
export async function getEmailTemplates() {
  return templatesGetEmailTemplates();
}

export async function getTemplates() {
  return templatesGetTemplates();
}

export async function ensureDefaultTemplates() {
  return templatesEnsureDefaultTemplates();
}

export async function createTemplate(
  data: Omit<Template, "id" | "created_at" | "updated_at">
) {
  return templatesCreateTemplate(data);
}

export async function updateTemplate(id: string, data: Partial<Template>) {
  return templatesUpdateTemplate(id, data);
}

export async function deleteTemplate(id: string) {
  return templatesDeleteTemplate(id);
}

// Diagnose actions (use generations for SOAP notes)
export async function generateSoapNotes(
  transcriptions: string | string[],
  templateData: { templateId: string; caseId: string }
) {
  return generationsGenerateContentFromTemplate(transcriptions, templateData);
}

// Don't re-export types from a "use server" file
// Import types from ./types.ts instead
