"use server";

/**
 * Entry point for server actions
 * Re-exports all actions from domain-specific files using async wrappers
 */

// Auth actions
export async function signIn(formData: FormData) {
  const { signIn: authSignIn } = await import("./common/auth");
  return authSignIn(formData);
}

export async function signUp(formData: FormData) {
  const { signUp: authSignUp } = await import("./common/auth");
  return authSignUp(formData);
}

export async function signOut() {
  const { signOut: authSignOut } = await import("./common/auth");
  return authSignOut();
}

export async function resetPassword(formData: FormData) {
  const { resetPassword: authResetPassword } = await import("./common/auth");
  return authResetPassword(formData);
}

export async function updatePassword(formData: FormData) {
  const { updatePassword: authUpdatePassword } = await import("./common/auth");
  return authUpdatePassword(formData);
}

export async function getCurrentUserId() {
  const { getCurrentUserId: authGetCurrentUserId } = await import("./common/auth");
  return authGetCurrentUserId();
}

// Case actions
export async function createCase(data: any) {
  const { createCase: casesCreateCase } = await import("./cases/actions");
  return casesCreateCase(data);
}

export async function updateCase(data: any) {
  const { updateCase: casesUpdateCase } = await import("./cases/actions");
  return casesUpdateCase(data);
}

export async function getCase(id: number) {
  const { getCase: casesGetCase } = await import("./cases/actions");
  return casesGetCase(id);
}

export async function saveActionsToCase(caseId: number, actions: any[]) {
  const { saveActionsToCase: casesSaveActionsToCase } = await import("./cases/actions");
  return casesSaveActionsToCase(caseId, actions);
}

// Appointment actions
export async function getAppointments(params: any) {
  const { getAppointments: appointmentsGetAppointments } = await import("./appointments/actions");
  return appointmentsGetAppointments(params);
}

export async function getAppointmentById(id: string) {
  const { getAppointmentById: appointmentsGetAppointmentById } = await import("./appointments/actions");
  return appointmentsGetAppointmentById(id);
}

export async function getUpcomingAppointments() {
  const { getUpcomingAppointments: appointmentsGetUpcomingAppointments } = await import("./appointments/actions");
  return appointmentsGetUpcomingAppointments();
}

export async function debugListAllCases() {
  const { debugListAllCases: appointmentsDebugListAllCases } = await import("./appointments/actions");
  return appointmentsDebugListAllCases();
}

// Generation actions
export async function generateContentFromTemplate(transcriptions: string | string[], templateData?: { templateId: string }) {
  const { generateContentFromTemplate: generationsGenerateContentFromTemplate } = await import("./generations/actions");
  return generationsGenerateContentFromTemplate(transcriptions, templateData);
}

// Email actions (simpleSendEmail is in generations/actions.ts)
export async function simpleSendEmail(to: string, subject: string, content: string, from?: string) {
  const { simpleSendEmail: emailSimpleSendEmail } = await import("./generations/actions");
  return emailSimpleSendEmail(to, subject, content, from);
}

// Template actions
export async function getEmailTemplates() {
  const { getEmailTemplates: templatesGetEmailTemplates } = await import("./templates/actions");
  return templatesGetEmailTemplates();
}

export async function getTemplates(type?: string) {
  const { getTemplates: templatesGetTemplates } = await import("./templates/actions");
  return templatesGetTemplates(type);
}

export async function ensureDefaultTemplates() {
  const { ensureDefaultTemplates: templatesEnsureDefaultTemplates } = await import("./templates/actions");
  return templatesEnsureDefaultTemplates();
}

export async function createTemplate(data: any) {
  const { createTemplate: templatesCreateTemplate } = await import("./templates/actions");
  return templatesCreateTemplate(data);
}

export async function updateTemplate(id: number, data: any) {
  const { updateTemplate: templatesUpdateTemplate } = await import("./templates/actions");
  return templatesUpdateTemplate(id, data);
}

export async function deleteTemplate(id: number) {
  const { deleteTemplate: templatesDeleteTemplate } = await import("./templates/actions");
  return templatesDeleteTemplate(id);
}


// Diagnose actions (use generations for SOAP notes)
export async function generateSoapNotes(transcriptions: string | string[], templateData?: any) {
  const { generateContentFromTemplate: generationsGenerateContentFromTemplate } = await import("./generations/actions");
  return generationsGenerateContentFromTemplate(transcriptions, templateData);
}

// Re-export types from a separate file (not under "use server" directive)
export type { 
  Case, CaseStatus, CaseType, PaginationMeta, Template, CreateCaseInput, ClientCaseAction
} from "./types";