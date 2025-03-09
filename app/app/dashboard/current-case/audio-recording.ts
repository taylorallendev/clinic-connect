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

    // Store the last interim text to avoid UI flicker
    const lastInterimTextRef = useRef<string>("");

    // Single listener for transcript events
    const transcriptListener = (data: LiveTranscriptionEvent) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";
      const isFinal = data.is_final;

      if (!transcript || !transcript.trim()) return;

      if (isFinal) {
        // For final results, handle potential overlaps
        const cleanedText = transcript.trim();
        const currentText = accumulatedTranscriptRef.current;

        // If our accumulated transcript already ends with this text, don't add it again
        if (!currentText.endsWith(cleanedText)) {
          // Check for partial overlaps
          const words = cleanedText.split(" ");
          let overlap = false;

          // Check for overlapping phrases (up to 5 words)
          for (let i = 1; i < Math.min(words.length, 5); i++) {
            const phrase = words.slice(0, i).join(" ");
            if (currentText.endsWith(phrase)) {
              // Found overlap, only add the non-overlapping part
              accumulatedTranscriptRef.current +=
                " " + words.slice(i).join(" ");
              overlap = true;
              break;
            }
          }

          // If no overlap found, just append with a space
          if (!overlap) {
            accumulatedTranscriptRef.current +=
              (currentText ? " " : "") + cleanedText;
          }
        }

        // Clear last interim text since we have a final result
        lastInterimTextRef.current = "";
        
        // Update the UI with the accumulated transcript
        setTranscriptText(accumulatedTranscriptRef.current);
      } else {
        // For interim results, update smoothly without flashing
        const interimText = transcript.trim();
        
        // Only update if the interim text is different from the last one
        // This prevents constant re-rendering when receiving the same interim text
        if (interimText !== lastInterimTextRef.current) {
          lastInterimTextRef.current = interimText;
          
          const displayText =
            accumulatedTranscriptRef.current +
            (accumulatedTranscriptRef.current ? " " : "") +
            interimText;

          // Update the UI immediately without changing the accumulated ref
          setTranscriptText(displayText);
        }
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
            punctuate: true,
            diarize: false,
            utterance_end_ms: 500,    // Reduced from 1000ms to 500ms for more frequent final results
            vad_turnoff: 300,         // Reduced from 500ms to 300ms for more responsive voice activity detection
            interim_results_freq: 2,  // Get interim results more frequently (approx every 2 utterances)
          });

          startMicrophone();
          setIsRecording(true);
          setMicrophoneState(MicrophoneState.Ready);

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
