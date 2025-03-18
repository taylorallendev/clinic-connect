"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useCaseStore } from "../simplified-store";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognitionType =
  | typeof window.SpeechRecognition
  | typeof window.webkitSpeechRecognition;

// Add these interfaces for the event types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
  isFinal?: boolean;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognitionType | null>(
    null
  );
  
  const fullTranscriptRef = useRef("");
  const { toast } = useToast();
  const { addCaseAction } = useCaseStore();

  // Initialize speech recognition when component mounts
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      // Use the appropriate constructor with proper type casting
      const SpeechRecognitionAPI = (window.SpeechRecognition ||
        window.webkitSpeechRecognition) as SpeechRecognitionType;
      const recognitionInstance = new SpeechRecognitionAPI();

      // Configure recognition
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      // Set up event handlers
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        // Use continuous mode approach - build the complete transcript in real-time
        let transcript = "";

        // Process all results currently available in this session
        for (let i = 0; i < event.results.length; i++) {
          // Get the transcribed text from this result segment
          const result = event.results[i][0].transcript;

          // Add it to our complete transcript
          transcript += result + " ";
        }

        // Store and display the complete transcript
        fullTranscriptRef.current = transcript.trim();
        setTranscriptText(fullTranscriptRef.current);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
    }

    // Clean up
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [toast]);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  // Function to toggle recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);

      if (recognition) {
        recognition.stop();
      }

      // Save the transcript to the case store
      if (fullTranscriptRef.current.trim()) {
        const action = {
          id: crypto.randomUUID(),
          type: "recording" as const,
          content: {
            transcript: fullTranscriptRef.current,
          },
          timestamp: Date.now(),
        };
        addCaseAction(action);
      }

      // Reset for next recording
      setRecordingTime(0);
      fullTranscriptRef.current = "";
      setTranscriptText("");
      setIsProcessing(false);
    } else {
      // Start recording
      setIsRecording(true);
      setTranscriptText("");
      fullTranscriptRef.current = "";

      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.error("Error starting speech recognition:", error);
          toast({
            title: "Error",
            description: "Failed to start speech recognition",
            variant: "destructive",
          });
          setIsRecording(false);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return {
    isRecording,
    recordingTime,
    isProcessing,
    transcriptText,
    toggleRecording,
    formatTime,
    recognition
  };
}