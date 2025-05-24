# Email Service Documentation

This document outlines the email service integration using Resend in the OdisAI application.

## Overview

OdisAI uses [Resend](https://resend.com) as its email service provider. Resend provides a modern, developer-friendly API for sending transactional emails with high deliverability.

## Setup and Configuration

### Environment Variables

Add the following environment variables to your `.env.local` file:

```
RESEND_API_KEY=your-resend-api-key
RESEND_DEFAULT_FROM=no-reply@odisai.com
```

### Installation

The Resend SDK is already included in the project dependencies. If you need to install it manually, run:

```bash
npm install resend
# or
yarn add resend
# or
pnpm add resend
```

## Usage

### Basic Email Sending

To send a simple email:

```typescript
import { simpleSendEmail } from "@/app/actions";

// Inside a server action or API route
await simpleSendEmail(
  "recipient@odisai.net",
  "Email Subject",
  "<p>HTML email content</p>"
);
```

### Template-based Emails

To send an email using a template:

```typescript
import { sendEmailWithTemplate } from "@/app/actions";

// Inside a server action or API route
await sendEmailWithTemplate({
  to: "recipient@odisai.net",
  templateId: "template-id-from-database",
  templateData: {
    userName: "John Doe",
    appointmentDate: "2025-05-01",
    // Other variables used in the template
  }
});
```

## Template System

Email templates are stored in the database with the template type "email". Templates can contain variables that will be replaced with actual data when sending.

### Template Variables

Variables in templates use the format `{{ variableName }}`. For example:

```html
<h1>Welcome, {{ userName }}!</h1>
<p>Your appointment is scheduled for {{ appointmentDate }}.</p>
```

## Service Architecture

- `app/actions/email/service.ts` - Low-level email sending functionality using Resend
- `app/actions/email/actions.ts` - Higher-level email actions (like template-based emails)
- `lib/email.ts` - Email-related constants and utility functions

## Error Handling

All email functions return a result object with the following structure:

```typescript
{
  success: boolean;
  data?: any;  // Resend API response on success
  error?: string;  // Error message on failure
}
```

Always check the `success` property to determine if the email was sent successfully.

## Testing

You can test email sending by setting up a test Resend account and using test email addresses. Resend provides a dashboard where you can view sent emails.

## Common Email Templates

- Welcome email
- Password reset
- Appointment reminder
- SOAP note completed notification