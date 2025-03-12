'use client'
import { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailButtonContextType {
  showEmailButton: boolean;
  setShowEmailButton: (show: boolean) => void;
  selectedActionId: string | null;
  setSelectedActionId: (id: string | null) => void;
}

const EmailButtonContext = createContext<EmailButtonContextType | undefined>(undefined);

export function useEmailButton() {
  const context = useContext(EmailButtonContext);
  if (!context) {
    throw new Error('useEmailButton must be used within an EmailButtonProvider');
  }
  return context;
}

interface EmailButtonProviderProps {
  children: ReactNode;
}

export function EmailButtonProvider({ children }: EmailButtonProviderProps) {
  const [showEmailButton, setShowEmailButton] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const handleEmailClick = () => {
    // TODO: Implement email functionality
    console.log('Email button clicked for action:', selectedActionId);
  };

  return (
    <EmailButtonContext.Provider 
      value={{ 
        showEmailButton, 
        setShowEmailButton, 
        selectedActionId, 
        setSelectedActionId 
      }}
    >
      {children}
      {showEmailButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={handleEmailClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      )}
    </EmailButtonContext.Provider>
  );
} 