"use client";

import { ThemeProvider } from "next-themes";
import { DeepgramContextProvider } from "./DeepgramContextProvider";
import { MicrophoneContextProvider } from "./MicrophoneContextProvider";
import { EmailButtonProvider } from "./EmailButtonContext";
import { Toaster } from "@/src/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <EmailButtonProvider>
        <MicrophoneContextProvider>
          <DeepgramContextProvider>
            {children}
            <Toaster />
          </DeepgramContextProvider>
        </MicrophoneContextProvider>
      </EmailButtonProvider>
    </ThemeProvider>
  );
}
