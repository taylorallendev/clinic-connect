// Create a new file: hooks/use-transcription.ts
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useDeepgram,
  SOCKET_STATES,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
} from "@/context/DeepgramContextProvider";
import {
  useMicrophone,
  MicrophoneEvents,
  MicrophoneState,
} from "@/context/MicrophoneContextProvider";

interface UseTranscriptionOptions {
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

export function useTranscription(options?: UseTranscriptionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string>("");

  const {
    connection,
    connectToDeepgram,
    disconnectFromDeepgram,
    connectionState,
    isConnecting,
  } = useDeepgram();

  const {
    microphone,
    setupMicrophone,
    startMicrophone,
    stopMicrophone,
    microphoneState,
  } = useMicrophone();

  // Set up transcription listener with improved handling
  useEffect(() => {
    if (!connection) return;

    const handleTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal } = data;
      const transcriptText = data.channel?.alternatives?.[0]?.transcript ?? "";

      if (!transcriptText || !transcriptText.trim()) return;

      // Generate a unique ID for this message that includes more context
      const messageId = `${Date.now()}-${transcriptText.substring(0, 20)}`;

      // Skip if we've already processed this exact message
      if (messageId === lastMessageIdRef.current) return;
      lastMessageIdRef.current = messageId;

      if (isFinal) {
        // For final results, we need to be careful about duplicates
        const cleanedText = transcriptText.trim();

        // If our final transcript already ends with this text, don't add it again
        if (!finalTranscriptRef.current.endsWith(cleanedText)) {
          // If there's some overlap, try to find where the overlap starts
          const words = cleanedText.split(" ");
          let overlap = false;

          // Check for overlapping phrases (up to 5 words)
          for (let i = 1; i < Math.min(words.length, 5); i++) {
            const phrase = words.slice(0, i).join(" ");
            if (finalTranscriptRef.current.endsWith(phrase)) {
              // Found overlap, only add the non-overlapping part
              finalTranscriptRef.current += " " + words.slice(i).join(" ");
              overlap = true;
              break;
            }
          }

          // If no overlap found, just append with a space
          if (!overlap) {
            finalTranscriptRef.current +=
              (finalTranscriptRef.current ? " " : "") + cleanedText;
          }
        }

        // Clear interim text since we have a final result
        interimTranscriptRef.current = "";

        // Update the displayed transcript
        setTranscript(finalTranscriptRef.current);

        // Call the optional callback
        options?.onTranscriptUpdate?.(finalTranscriptRef.current);
      } else {
        // For interim results, replace the current interim text
        interimTranscriptRef.current = transcriptText.trim();

        // Combine final and interim for display
        const displayText =
          finalTranscriptRef.current +
          (finalTranscriptRef.current ? " " : "") +
          interimTranscriptRef.current;

        setTranscript(displayText);

        // Call the optional callback
        options?.onTranscriptUpdate?.(displayText);
      }
    };

    const handleError = (err: any) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Deepgram error:", error);
      setError(error);
      options?.onError?.(error);
    };

    // First, ensure we remove any existing listeners
    // This is crucial to prevent duplicate listeners
    connection.removeAllListeners(LiveTranscriptionEvents.Transcript);
    connection.removeAllListeners(LiveTranscriptionEvents.Error);

    // Then add our listeners
    connection.addListener(
      LiveTranscriptionEvents.Transcript,
      handleTranscript
    );
    // connection.addListener(LiveTranscriptionEvents.Error, handleError);

    // Clean up all listeners when component unmounts or connection changes
    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        handleTranscript
      );
      // connection.removeListener(LiveTranscriptionEvents.Error, handleError);
    };
  }, [connection, options]);

  // Handle microphone audio data
  useEffect(() => {
    if (!microphone || !connection) return;

    const handleAudioData = (event: BlobEvent) => {
      if (event.data.size > 0 && connection) {
        connection.send(event.data);
      }
    };

    // Add event listener for audio data
    microphone.addEventListener(
      MicrophoneEvents.DataAvailable,
      handleAudioData
    );

    // Clean up
    return () => {
      microphone.removeEventListener(
        MicrophoneEvents.DataAvailable,
        handleAudioData
      );
    };
  }, [microphone, connection]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    // Clean up on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRecording]);

  // Start recording function
  const startRecording = useCallback(async () => {
    if (isRecording || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Reset transcript
      setTranscript("");
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      setElapsedTime(0);

      // Set up microphone if needed
      if (microphoneState === MicrophoneState.NotSetup) {
        await setupMicrophone();
      }

      // Connect to Deepgram
      await connectToDeepgram({
        model: "nova-3",
        interim_results: true,
        smart_format: true,
        punctuate: true,
        language: "en",
        encoding: "linear16",
        channels: 1,
        sample_rate: 16000,
      });

      // Start the microphone
      startMicrophone();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Update state
      setIsRecording(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to start recording:", error);
      setError(error);
      options?.onError?.(error);

      // Clean up on error
      try {
        stopMicrophone();
        disconnectFromDeepgram();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      } catch (cleanupErr) {
        console.error("Error during cleanup:", cleanupErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isRecording,
    isLoading,
    microphoneState,
    setupMicrophone,
    connectToDeepgram,
    startMicrophone,
    stopMicrophone,
    disconnectFromDeepgram,
    options,
  ]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    try {
      // Stop microphone and disconnect from Deepgram
      stopMicrophone();
      disconnectFromDeepgram();

      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Update state
      setIsRecording(false);

      // Return the final transcript
      return finalTranscriptRef.current;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error stopping recording:", error);
      setError(error);
      options?.onError?.(error);
    }
  }, [isRecording, stopMicrophone, disconnectFromDeepgram, options]);

  // Reset function
  const reset = useCallback(() => {
    if (isRecording) {
      stopMicrophone();
      disconnectFromDeepgram();
    }

    setIsRecording(false);
    setIsLoading(false);
    setTranscript("");
    setError(null);
    setElapsedTime(0);

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isRecording, stopMicrophone, disconnectFromDeepgram]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    isRecording,
    isLoading,
    transcript,
    error,
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    startRecording,
    stopRecording,
    reset,
    connectionState,
    microphoneState,
    isConnecting,
  };
}
