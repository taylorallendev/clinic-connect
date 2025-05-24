import * as React from 'react';

interface BaseEmailProps {
  previewText?: string;
  children: React.ReactNode;
}

export const BaseEmail: React.FC<BaseEmailProps> = ({
  previewText = '',
  children,
}) => {
  return (
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>OdisAI</title>
        {previewText && <meta name="description" content={previewText} />}
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333333;
              background-color: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .content {
              padding: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px 0;
              font-size: 12px;
              color: #666666;
              border-top: 1px solid #f0f0f0;
            }
            a {
              color: #2563eb;
              text-decoration: none;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #2563eb;
              color: #ffffff !important;
              border-radius: 4px;
              text-decoration: none;
              font-weight: 500;
              margin: 20px 0;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>OdisAI</h1>
          </div>
          <div className="content">
            {children}
          </div>
          <div className="footer">
            <p>© {new Date().getFullYear()} OdisAI. All rights reserved.</p>
            <p>This email was sent automatically. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default BaseEmail;