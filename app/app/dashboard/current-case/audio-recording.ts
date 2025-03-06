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
  const { connection, connectToDeepgram, disconnectFromDeepgram } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone } = useMicrophone();

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
          description: "Failed to initialize microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    void initMicrophone();
  }, []);

  // Add event listener for transcription results
  useEffect(() => {
    if (connection) {
      console.log("Setting up direct transcription listener");

      // First try with the Result event
      connection.addListener(
        LiveTranscriptionEvents.Open,
        (result: LiveTranscriptionEvent) => {
          console.log("Received transcription result:", result);

          if (result.channel?.alternatives?.[0]?.transcript) {
            const transcript = result.channel.alternatives[0].transcript;
            console.log(
              "Processing transcript:",
              transcript,
              "is_final:",
              result.is_final
            );

            if (result.is_final) {
              // Don't use a callback function with prev
              // Instead, use the current transcriptText from your store
              const currentText = transcriptText || "";
              const newText =
                currentText + (currentText ? " " : "") + transcript.trim();
              setTranscriptText(newText);
              console.log("Updated transcript text");
            }
          }
        }
      );

      // Also try with the Transcript event (different API in case the API changed)
      connection.addListener(
        LiveTranscriptionEvents.Transcript,
        (data: LiveTranscriptionEvent) => {
          console.log("Transcript event received:", data);

          const { is_final: isFinal, speech_final: speechFinal } = data;
          const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";

          if (transcript) {
            console.log(
              "Processing transcript from Transcript event:",
              transcript,
              "Current transcriptText:",
              transcriptText
            );

            // Always update the transcript for better real-time feedback
            // This captures the current word or phrase being said
            const currentText = transcriptText || "";
            const newText = currentText + (currentText ? " " : "") + transcript;
            console.log("Updated transcriptText to:", newText);
            setTranscriptText(newText);
          }
        }
      );

      // Add connection state event listeners
      connection.addListener(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection opened");
        toast({
          title: "Connected",
          description: "Deepgram connection established",
        });
      });

      connection.addListener(LiveTranscriptionEvents.Error, (error) => {
        console.error("Deepgram connection error:", error);
        toast({
          title: "Error",
          description: "Deepgram connection error",
          variant: "destructive",
        });
      });

      // Store references to listener functions so we can remove them properly
      const resultListener = (result: LiveTranscriptionEvent) => {
        console.log("Received transcription result:", result);

        if (result.channel?.alternatives?.[0]?.transcript) {
          const transcript = result.channel.alternatives[0].transcript;
          console.log(
            "Processing transcript:",
            transcript,
            "is_final:",
            result.is_final
          );

          if (result.is_final) {
            // Don't use a callback function with prev
            // Instead, use the current transcriptText from your store
            const currentText = transcriptText || "";
            const newText =
              currentText + (currentText ? " " : "") + transcript.trim();
            setTranscriptText(newText);
            console.log("Updated transcript text");
          }
        }
      };

      const transcriptListener = (data: LiveTranscriptionEvent) => {
        console.log("Transcript event received:", data);

        const { is_final: isFinal, speech_final: speechFinal } = data;
        const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";

        if (transcript && transcript.trim()) {
          console.log("Processing transcript:", transcript);

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
          console.log("Setting transcriptText to accumulated:", newAccumulated);
          setTranscriptText(newAccumulated);
        }
      };

      const openListener = () => {
        console.log("Deepgram connection opened");
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

      // Only add transcriptListener for transcript events, not resultListener
      connection.addListener(
        LiveTranscriptionEvents.Transcript,
        transcriptListener
      );
      connection.addListener(LiveTranscriptionEvents.Open, openListener);
      connection.addListener(LiveTranscriptionEvents.Error, errorListener);

      console.log("Added transcript listener:", transcriptListener);

      // Return cleanup function
      return () => {
        // Only remove transcriptListener
        connection.removeListener(
          LiveTranscriptionEvents.Transcript,
          transcriptListener
        );
        connection.removeListener(LiveTranscriptionEvents.Open, openListener);
        connection.removeListener(LiveTranscriptionEvents.Error, errorListener);
        console.log("Removed all transcription listeners");
      };
    }
  }, [connection, setTranscriptText]);

  // Handle microphone audio data
  useEffect(() => {
    if (!microphone || !connection) {
      console.log("Audio data handler: missing microphone or connection");
      return;
    }

    console.log("Setting up audio data handler");

    const onAudioData = (e: BlobEvent) => {
      if (e.data.size > 0 && connection) {
        console.log("Sending audio data to Deepgram, size:", e.data.size);
        connection.send(e.data);
      } else {
        console.log("Audio data issue:", {
          dataSize: e.data?.size || 0,
          connectionExists: !!connection,
        });
      }
    };

    // Add listener for audio data
    microphone.addEventListener(MicrophoneEvents.DataAvailable, onAudioData);
    console.log("Added microphone data available listener");

    return () => {
      microphone.removeEventListener(
        MicrophoneEvents.DataAvailable,
        onAudioData
      );
      console.log("Removed microphone data available listener");
    };
  }, [microphone, connection]);

  // Timer effect using local state first, then updating the store
  useEffect(() => {
    console.log("Timer effect triggered, isRecording:", isRecording);

    if (isRecording) {
      // Reset local timer
      setLocalTimer(0);
      console.log("Local timer reset to 0");

      // Start interval
      const timerInterval = setInterval(() => {
        setLocalTimer((prev) => {
          const newValue = prev + 1;
          console.log("Local timer tick:", prev, "->", newValue);

          // Update the store timer as well
          setTimer(newValue);

          return newValue;
        });
      }, 1000);

      return () => {
        console.log("Clearing timer interval");
        clearInterval(timerInterval);
      };
    } else {
      // Reset when not recording
      setLocalTimer(0);
    }
  }, [isRecording]); // Only depend on isRecording state

  // Keep global timer in sync
  useEffect(() => {
    if (localTimer !== timer && typeof localTimer === "number") {
      console.log("Syncing global timer with local:", localTimer);
      setTimer(localTimer);
    }
  }, [localTimer]);

  // Function to toggle recording state
  const handleRecordingToggle = async () => {
    try {
      if (!isRecording) {
        console.log("Starting recording...");
        // Start recording
        setIsLoading(true);

        // Reset the transcript and accumulated transcript ref at the start of recording
        setTranscriptText("");
        if (accumulatedTranscriptRef) {
          accumulatedTranscriptRef.current = "";
          console.log("Reset accumulated transcript reference");
        }

        await connectToDeepgram({
          model: "nova-3",
          interim_results: true,
          smart_format: true,
          filler_words: true,
          utterance_end_ms: 1000, // Reduced from 3000 for more responsive transcription
        });

        startMicrophone();
        setIsRecording(true);
        setMicrophoneState(MicrophoneState.Open);

        console.log("Recording started successfully");
        toast({
          title: "Recording Started",
          description: "Your microphone is now active.",
        });
      } else {
        console.log("Stopping recording...");
        // Stop recording
        stopMicrophone();
        disconnectFromDeepgram();

        // Stop recording and reset timers
        setIsRecording(false);
        setMicrophoneState(MicrophoneState.Ready);

        // Reset both timers
        setLocalTimer(0);
        setTimer(0);
        console.log("Both timers reset to 0 after stopping recording");

        // Save the transcript
        handleRecordingFinished();

        console.log("Recording stopped successfully");
        toast({
          title: "Recording Stopped",
          description: "Transcription saved.",
        });
      }
    } catch (error) {
      console.error("Error in microphone handling:", error);
      toast({
        title: "Error",
        description: "Failed to toggle recording",
        variant: "destructive",
      });
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