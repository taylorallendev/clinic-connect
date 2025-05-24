"use server";

/**
 * Email template helpers and defaults
 */

import { getCurrentUserId } from "../common/auth";
import { createClient } from "@/utils/supabase/server";
import { EMAIL_CONFIG } from "@/lib/email";
import { EmailResponse } from "../types";

/**
 * Creates default email templates if they don't exist
 */
export async function ensureDefaultEmailTemplates(): Promise<EmailResponse> {
  try {
    // Authenticate the user making the request
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const supabase = await createClient();
    
    // Define default templates
    const defaultTemplates = [
      {
        name: "Welcome Email",
        description: "Sent to new users after registration",
        type: "email",
        key: EMAIL_CONFIG.TEMPLATES.WELCOME,
        content: `
          <h1>Welcome to OdisAI!</h1>
          <p>Hello {{ userName }},</p>
          <p>Thank you for joining OdisAI. We're excited to help you streamline your clinical workflow.</p>
          <p>To get started, explore our dashboard and set up your first case.</p>
          <p>If you need any assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The OdisAI Team</p>
        `,
        prompt: "",
        model: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: "Password Reset",
        description: "Sent when a user requests a password reset",
        type: "email",
        key: EMAIL_CONFIG.TEMPLATES.PASSWORD_RESET,
        content: `
          <h1>Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset your password for your OdisAI account.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="{{ resetLink }}">Reset Password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The OdisAI Team</p>
        `,
        prompt: "",
        model: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: "Appointment Reminder",
        description: "Sent to remind about upcoming appointments",
        type: "email",
        key: EMAIL_CONFIG.TEMPLATES.APPOINTMENT_REMINDER,
        content: `
          <h1>Appointment Reminder</h1>
          <p>Hello {{ patientName }},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <ul>
            <li><strong>Date:</strong> {{ appointmentDate }}</li>
            <li><strong>Time:</strong> {{ appointmentTime }}</li>
            <li><strong>Provider:</strong> {{ providerName }}</li>
          </ul>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
          <p>Best regards,<br>The OdisAI Team</p>
        `,
        prompt: "",
        model: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: "SOAP Note Completed",
        description: "Sent when a SOAP note has been completed",
        type: "email",
        key: EMAIL_CONFIG.TEMPLATES.SOAP_NOTE_COMPLETED,
        content: `
          <h1>SOAP Note Completed</h1>
          <p>Hello {{ recipientName }},</p>
          <p>A SOAP note has been completed for:</p>
          <ul>
            <li><strong>Patient:</strong> {{ patientName }}</li>
            <li><strong>Date:</strong> {{ visitDate }}</li>
            <li><strong>Provider:</strong> {{ providerName }}</li>
          </ul>
          <p>You can view the full note in your OdisAI dashboard.</p>
          <p>Best regards,<br>The OdisAI Team</p>
        `,
        prompt: "",
        model: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Check if templates exist
    for (const template of defaultTemplates) {
      const { data: existingTemplate } = await supabase
        .from("templates")
        .select("id")
        .eq("key", template.key)
        .eq("type", "email")
        .single();

      // If template doesn't exist, create it
      if (!existingTemplate) {
        await supabase.from("templates").insert(template);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to ensure default email templates:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to ensure default email templates",
    };
  }
}