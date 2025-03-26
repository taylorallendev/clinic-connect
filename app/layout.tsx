import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DeepgramContextProvider } from "@/context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "@/context/MicrophoneContextProvider";
import { EmailButtonProvider } from "../context/EmailButtonContext";
import { ClerkProvider } from "@clerk/nextjs";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Clinic Connect",
  description: "Connect with your clinic",
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
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className={geistSans.className} suppressHydrationWarning>
        <body className="bg-background text-foreground">
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
    </ClerkProvider>
  );
}
