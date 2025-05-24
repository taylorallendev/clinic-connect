import * as React from 'react';
import { BaseEmail } from './components/BaseEmail';

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName }) => {
  return (
    <BaseEmail previewText={`Welcome to OdisAI, ${userName}!`}>
      <h2>Welcome to OdisAI!</h2>
      <p>Hello {userName},</p>
      <p>
        Thank you for joining OdisAI. We're excited to help you streamline your clinical workflow.
      </p>
      <p>
        To get started, explore our dashboard and set up your first case.
      </p>
      <p>
        If you need any assistance, please don't hesitate to contact our support team.
      </p>
      <a href="https://app.odisai.net/dashboard" className="button">
        Go to Dashboard
      </a>
      <p>
        Best regards,<br />
        The OdisAI Team
      </p>
    </BaseEmail>
  );
};

export default WelcomeEmail;