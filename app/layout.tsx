import "./globals.css";
import { Providers } from "@/src/providers/providers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OdisAI",
  description: "AI-Powered Veterinary Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap"
        />
      </head>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <main className="max-h-screen w-screen flex flex-col">
            <div className="flex flex-col">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
