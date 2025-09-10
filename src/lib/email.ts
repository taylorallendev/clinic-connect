/**
 * Email configuration constants and utilities
 */

export const EMAIL_CONFIG = {
  // Default sender email address (fallback if not specified in environment variables)
  DEFAULT_FROM: process.env.RESEND_DEFAULT_FROM || 'no-reply@odisai.net',
  
  // Common email templates
  TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    APPOINTMENT_REMINDER: 'appointment-reminder',
    SOAP_NOTE_COMPLETED: 'soap-note-completed',
  },
};

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}