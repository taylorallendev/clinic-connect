"use server";

/**
 * React-based email templates using Resend
 */

import { Resend } from "resend";
import { getCurrentUserId } from "../common/auth";
import { EmailResponse } from "../types";
import { EMAIL_CONFIG } from "@/src/lib/email";
import { isValidEmail } from "@/src/lib/email";
import {
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from "@/src/lib/email-renderer";

// Initialize Resend with API key
let resendInstance: Resend | null = null;

/**
 * Gets or creates a Resend instance
 */
function getResendInstance(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Send a welcome email
 */
export async function sendWelcomeEmail({
  to,
  userName,
  from,
}: {
  to: string;
  userName: string;
  from?: string;
}): Promise<EmailResponse> {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate email addresses
    if (!isValidEmail(to)) {
      throw new Error("Invalid recipient email address");
    }

    // Get default sender
    const defaultSender =
      process.env.RESEND_DEFAULT_FROM || EMAIL_CONFIG.DEFAULT_FROM;

    // Initialize Resend client
    const resend = getResendInstance();

    // Get the rendered email HTML from our helper
    const emailHtml = await renderWelcomeEmail({ userName });

    // Send the email
    const result = await resend.emails.send({
      from: from || defaultSender,
      to: [to],
      subject: `Welcome to OdisAI, ${userName}!`,
      html: emailHtml,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send welcome email",
    };
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail({
  to,
  resetLink,
  from,
}: {
  to: string;
  resetLink: string;
  from?: string;
}): Promise<EmailResponse> {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate email addresses
    if (!isValidEmail(to)) {
      throw new Error("Invalid recipient email address");
    }

    // Get default sender
    const defaultSender =
      process.env.RESEND_DEFAULT_FROM || EMAIL_CONFIG.DEFAULT_FROM;

    // Initialize Resend client
    const resend = getResendInstance();

    // Get the rendered email HTML from our helper
    const emailHtml = await renderPasswordResetEmail({ resetLink });

    // Send the email
    const result = await resend.emails.send({
      from: from || defaultSender,
      to: [to],
      subject: `Reset Your OdisAI Password`,
      html: emailHtml,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send password reset email",
    };
  }
}
