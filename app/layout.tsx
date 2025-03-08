import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DeepgramContextProvider } from "@/context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "@/context/MicrophoneContextProvider";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
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
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen w-screen flex flex-col">
            <MicrophoneContextProvider>
              <DeepgramContextProvider>
                <div className="flex flex-col">{children}</div>
                <Toaster />
              </DeepgramContextProvider>
            </MicrophoneContextProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
