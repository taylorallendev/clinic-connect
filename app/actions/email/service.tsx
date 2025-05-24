"use server";

/**
 * Email service using Resend
 * https://resend.com/docs
 */

import { Resend } from "resend";
import { getCurrentUserId } from "../common/auth";
import { EmailResponse } from "../types";
import { EMAIL_CONFIG } from "@/lib/email";

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
 * Sends an email using Resend
 */
export async function sendEmail({
  to,
  from,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailResponse> {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate email addresses
    if (typeof to === "string" && !isValidEmail(to)) {
      throw new Error("Invalid recipient email address");
    } else if (Array.isArray(to)) {
      const invalidEmails = to.filter((email) => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        throw new Error(
          `Invalid recipient email addresses: ${invalidEmails.join(", ")}`
        );
      }
    }

    // Get default sender from environment variables or config
    const defaultSender =
      process.env.RESEND_DEFAULT_FROM || EMAIL_CONFIG.DEFAULT_FROM;

    // Initialize Resend client
    const resend = getResendInstance();

    // Send the email
    const result = await resend.emails.send({
      from: from || defaultSender,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text:
        text ||
        (html ? undefined : "Email content not available in text format"),
      reply_to: replyTo,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Simple email sending function with minimal parameters
 */
export async function simpleSendEmail(
  to: string,
  subject: string,
  content: string,
  from?: string
): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject,
    html: content,
    from,
  });
}
