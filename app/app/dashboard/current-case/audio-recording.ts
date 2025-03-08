"use client";

import { useState, useEffect, useRef } from "react";
import {
  useDeepgram,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@/context/DeepgramContextProvider";
import {
  useMicrophone,
  MicrophoneEvents,
  MicrophoneState,
} from "@/context/MicrophoneContextProvider";
import { useCaseStore } from "@/store/use-case-store";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for handling audio recording and transcription
 *
 * This hook manages the state and interactions for microphone recording and
 * real-time transcription using Deepgram.
 */
export function useAudioRecording() {
  const { toast } = useToast();

  // Reference for accumulated transcript
  const accumulatedTranscriptRef = useRef<string>("");

  // Get state and functions from case store
  const {
    isRecording,
    timer,
    isLoading,
    transcriptText,
    setIsRecording,
    setTimer,
    setIsLoading,
    setTranscriptText,
    setMicrophoneState,
    handleRecordingFinished,
  } = useCaseStore();

  // Transcription hooks
  const { connection, connectToDeepgram, disconnectFromDeepgram } =
    useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone } =
    useMicrophone();

  // Local timer state to ensure we have a reliable timer
  const [localTimer, setLocalTimer] = useState<number>(0);

  // Setup microphone on component mount
  useEffect(() => {
    const initMicrophone = async () => {
      try {
        await setupMicrophone();
        console.log("Microphone setup complete");
      } catch (error) {
        console.error("Microphone setup failed:", error);
        toast({
          title: "Microphone Error",
          description:
            "Failed to initialize microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    void initMicrophone();
  }, []);

  // Add event listener for transcription results
  useEffect(() => {
    if (!connection) return;

    // Single listener for transcript events
    const transcriptListener = (data: LiveTranscriptionEvent) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";

      if (transcript && transcript.trim()) {
        // Get the current accumulated transcript from our ref
        const currentAccumulated = accumulatedTranscriptRef.current;

        // Append new transcript text to accumulated transcript
        const newAccumulated =
          currentAccumulated +
          (currentAccumulated ? " " : "") +
          transcript.trim();

        // Update our local ref with the new accumulated transcript
        accumulatedTranscriptRef.current = newAccumulated;

        // Update the UI with the accumulated transcript
        setTranscriptText(newAccumulated);
      }
    };

    const openListener = () => {
      toast({
        title: "Connected",
        description: "Deepgram connection established",
      });
    };

    const errorListener = (error: any) => {
      console.error("Deepgram connection error:", error);
      toast({
        title: "Error",
        description: "Deepgram connection error",
        variant: "destructive",
      });
    };

    // Set up event listeners
    connection.addListener(
      LiveTranscriptionEvents.Transcript,
      transcriptListener
    );
    connection.addListener(LiveTranscriptionEvents.Open, openListener);
    connection.addListener(LiveTranscriptionEvents.Error, errorListener);

    // Return cleanup function
    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        transcriptListener
      );
      connection.removeListener(LiveTranscriptionEvents.Open, openListener);
      connection.removeListener(LiveTranscriptionEvents.Error, errorListener);
    };
  }, [connection, setTranscriptText]);

  // Handle microphone audio data
  useEffect(() => {
    if (!microphone || !connection) return;

    const onAudioData = (e: BlobEvent) => {
      if (e.data.size > 0 && connection) {
        connection.send(e.data);
      }
    };

    microphone.addEventListener(MicrophoneEvents.DataAvailable, onAudioData);

    return () => {
      microphone.removeEventListener(
        MicrophoneEvents.DataAvailable,
        onAudioData
      );
    };
  }, [microphone, connection]);

  // Timer effect using local state first, then updating the store
  useEffect(() => {
    if (isRecording) {
      // Reset local timer
      setLocalTimer(0);

      // Start interval
      const timerInterval = setInterval(() => {
        setLocalTimer((prev) => {
          const newValue = prev + 1;

          // Update the store timer asynchronously to avoid React warnings
          setTimeout(() => {
            setTimer(newValue);
          }, 0);

          return newValue;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    } else {
      // Reset when not recording
      setLocalTimer(0);
    }
  }, [isRecording]);

  // Function to toggle recording state with better error handling
  const handleRecordingToggle = async () => {
    try {
      if (!isRecording) {
        // Start recording
        setIsLoading(true);

        // Reset the transcript and accumulated transcript ref
        setTranscriptText("");
        accumulatedTranscriptRef.current = "";

        try {
          await connectToDeepgram({
            model: "nova-3",
            interim_results: true,
            smart_format: true,
            filler_words: true,
            utterance_end_ms: 1000,
          });

          startMicrophone();
          setIsRecording(true);
          setMicrophoneState(MicrophoneState.Open);

          toast({
            title: "Recording Started",
            description: "Your microphone is now active.",
          });
        } catch (connectionError) {
          console.error("Failed to connect to Deepgram:", connectionError);
          toast({
            title: "Connection Error",
            description:
              "Failed to connect to transcription service. Please try again.",
            variant: "destructive",
          });
          throw connectionError;
        }
      } else {
        // Stop recording
        stopMicrophone();
        disconnectFromDeepgram();

        // Stop recording and reset timers
        setIsRecording(false);
        setMicrophoneState(MicrophoneState.Ready);

        // Reset both timers
        setLocalTimer(0);
        setTimeout(() => {
          setTimer(0);
        }, 0);

        // Save the transcript
        handleRecordingFinished();

        toast({
          title: "Recording Stopped",
          description: "Transcription saved.",
        });
      }
    } catch (error) {
      console.error("Error in microphone handling:", error);
      toast({
        title: "Error",
        description: "Failed to toggle recording. Please try again.",
        variant: "destructive",
      });

      // Clean up on error
      if (isRecording) {
        try {
          stopMicrophone();
          disconnectFromDeepgram();
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
        setIsRecording(false);
        setMicrophoneState(MicrophoneState.Ready);
      }

      // Reset timers
      setLocalTimer(0);
      setTimeout(() => {
        setTimer(0);
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRecording,
    isLoading,
    timer: localTimer,
    transcriptText,
    handleRecordingToggle,
  };
}
