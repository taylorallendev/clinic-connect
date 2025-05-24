import * as React from 'react';
import { BaseEmail } from './components/BaseEmail';

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ resetLink }) => {
  return (
    <BaseEmail previewText="Reset your OdisAI password">
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>
        We received a request to reset your password for your OdisAI account.
      </p>
      <p>
        Please click the button below to reset your password:
      </p>
      <a href={resetLink} className="button">
        Reset Password
      </a>
      <p>
        This link will expire in 24 hours.
      </p>
      <p>
        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      </p>
      <p>
        Best regards,<br />
        The OdisAI Team
      </p>
    </BaseEmail>
  );
};

export default PasswordResetEmail;