import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DeepgramContextProvider } from "@/context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "@/context/MicrophoneContextProvider";
import { EmailButtonProvider } from "../context/EmailButtonContext";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OdisAI",
  description: "AI-Powered Veterinary Platform",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="max-h-screen w-screen flex flex-col">
            <EmailButtonProvider>
              <MicrophoneContextProvider>
                <DeepgramContextProvider>
                  <div className="flex flex-col">{children}</div>
                  <Toaster />
                </DeepgramContextProvider>
              </MicrophoneContextProvider>
            </EmailButtonProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
