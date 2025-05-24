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
npm install resend @react-email/components
# or
yarn add resend @react-email/components
# or
pnpm add resend @react-email/components
```

## Usage

### Basic Email Sending

To send a simple email:

```typescript
import { simpleSendEmail } from "@/app/actions";

// Inside a server action or API route
await simpleSendEmail(
  "recipient@odisai.com",
  "Email Subject",
  "<p>HTML email content</p>"
);
```

### Template-based Emails (Database Templates)

To send an email using a database-stored template:

```typescript
import { sendEmailWithTemplate } from "@/app/actions";

// Inside a server action or API route
await sendEmailWithTemplate({
  to: "recipient@odisai.com",
  templateId: "template-id-from-database",
  templateData: {
    userName: "John Doe",
    appointmentDate: "2025-05-01",
    // Other variables used in the template
  }
});
```

### React-based Email Templates

We also support React-based email templates for more complex scenarios:

```typescript
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/app/actions";

// Send welcome email
await sendWelcomeEmail({
  to: "new-user@odisai.com",
  userName: "John Doe"
});

// Send password reset email
await sendPasswordResetEmail({
  to: "user@odisai.com",
  resetLink: "https://app.odisai.com/reset-password?token=123456"
});
```

## Email Template Structure

### Database Templates

Email templates are stored in the database with the template type "email". Templates can contain variables that will be replaced with actual data when sending.

Variables in templates use the format `{{ variableName }}`. For example:

```html
<h1>Welcome, {{ userName }}!</h1>
<p>Your appointment is scheduled for {{ appointmentDate }}.</p>
```

### React Templates

React templates are located in the `/emails` directory and use React components for structuring emails. This provides a more maintainable and type-safe way to create complex email templates.

To create a new React-based email template:

1. Create a new file in the `/emails` directory (e.g., `AppointmentReminder.tsx`)
2. Extend the BaseEmail component
3. Add a new method in `/app/actions/email/react.ts` to send this type of email
4. Export the method through `/app/actions/index.ts`

## Service Architecture

- `app/actions/email/service.ts` - Low-level email sending functionality using Resend
- `app/actions/email/actions.ts` - Database template-based emails
- `app/actions/email/react.ts` - React-based email templates
- `app/actions/email/templates.ts` - Email template management
- `lib/email.ts` - Email-related constants and utility functions
- `emails/` - React-based email templates

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