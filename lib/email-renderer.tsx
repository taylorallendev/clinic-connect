import { ReactElement } from "react";
import WelcomeEmail from "@/emails/WelcomeEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
// Import the React Email render function instead of react-dom/server
import { render } from "@react-email/components";

/**
 * Renders the Welcome Email template
 */
export async function renderWelcomeEmail({
  userName,
}: {
  userName: string;
}): Promise<string> {
  // Create the email component
  const emailComponent = <WelcomeEmail userName={userName} />;
  return renderEmailToString(emailComponent);
}

/**
 * Renders the Password Reset Email template
 */
export async function renderPasswordResetEmail({
  resetLink,
}: {
  resetLink: string;
}): Promise<string> {
  // Create the email component
  const emailComponent = <PasswordResetEmail resetLink={resetLink} />;
  return renderEmailToString(emailComponent);
}

/**
 * Helper function to render React element to HTML string
 * Using @react-email/components render function which is compatible with Next.js Server Components
 */
function renderEmailToString(element: ReactElement): string {
  // Use React Email's render function which is compatible with Next.js Server Components
  return render(element);
}
