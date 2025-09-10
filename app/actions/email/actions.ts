"use server";

/**
 * Email-related server actions
 * Provides higher-level email functionality
 */

import { getCurrentUserId } from "../common/auth";
import { sendEmail } from "./service";
import { getTemplateById } from "../templates/actions";
import { EmailResponse } from "../types";
import { isValidEmail } from "@/src/lib/email";

/**
 * Sends an email using a template
 */
export async function sendEmailWithTemplate({
  to,
  from,
  templateId,
  templateData,
  replyTo,
}: {
  to: string | string[];
  from?: string;
  templateId: string;
  templateData?: Record<string, any>;
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

    // Fetch the template
    const result = await getTemplateById(templateId);
    if (!result.success || !result.template) {
      throw new Error(result.error || "Failed to fetch template");
    }

    const template = result.template;

    // Check if this is an email template
    if (template.type !== "email") {
      throw new Error("Template is not an email template");
    }

    // Process template content with variables
    let content = template.content || "";
    let subject = template.name || "No Subject";

    // Replace template variables (simple implementation)
    if (templateData) {
      Object.entries(templateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        content = content.replace(regex, String(value));
        subject = subject.replace(regex, String(value));
      });
    }

    // Send the email
    return sendEmail({
      to,
      from,
      subject,
      html: content,
      replyTo,
    });
  } catch (error) {
    console.error("Failed to send email with template:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send email with template",
    };
  }
}
