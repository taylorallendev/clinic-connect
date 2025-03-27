// hooks/use-transcription.ts
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useDeepgram,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
} from "@/context/DeepgramContextProvider";
import {
  useMicrophone,
  MicrophoneEvents,
  MicrophoneState,
} from "@/context/MicrophoneContextProvider";
import { LiveSchema } from "@deepgram/sdk";
import { DEEPGRAM_CONFIG } from "@/lib/constants";

interface UseTranscriptionOptions {
  onTranscriptUpdate?: (
    transcript: string,
    speakers?: Record<string, string>
  ) => void;
  onError?: (error: Error) => void;
}

export function useTranscription(options?: UseTranscriptionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speakerSegments, setSpeakerSegments] = useState<
    Record<string, string>
  >({});

  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const speakerSegmentsRef = useRef<Record<string, string>>({});
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

  // Get optimized Deepgram settings for veterinary use case
  const getDeepgramSettings = useCallback((): LiveSchema => {
    return DEEPGRAM_CONFIG;
  }, []);

  // Set up transcription listener with improved handling for speaker diarization
  useEffect(() => {
    if (!connection) return;
    const handleTranscript = (data: LiveTranscriptionEvent) => {
      // Extract key information from the event
      const { is_final: isFinal } = data;
      const transcriptText = data.channel?.alternatives?.[0]?.transcript ?? "";
      const confidence = data.channel?.alternatives?.[0]?.confidence ?? 0;

      // Skip processing if transcript is empty
      if (!transcriptText || !transcriptText.trim()) return;

      // Log the full response for debugging (useful during development)
      console.log(
        "Deepgram Response:",
        JSON.stringify(
          {
            is_final: isFinal,
            transcript: transcriptText,
            confidence: confidence,
            // Include additional useful data without logging the entire payload
            metadata: {
              start_time: data.start,
              duration: data.duration,
              num_channels: data.channel?.alternatives?.length ?? 0,
            },
          },
          null,
          2
        )
      );

      // Generate a unique ID for this message to prevent duplicate processing
      const messageId = `${Date.now()}-${transcriptText.substring(0, 20)}`;

      // Skip if we've already processed this exact message
      if (messageId === lastMessageIdRef.current) return;
      lastMessageIdRef.current = messageId;

      // Extract and process word-level information with speaker diarization
      const words = data.channel?.alternatives?.[0]?.words || [];

      // Log diarization data
      if (words.length > 0) {
        console.log("===== Speaker Diarization Data =====");

        // Group words by speaker for better visualization
        const speakerUtterances: Record<string, string[]> = {};

        words.forEach((word) => {
          const speakerKey =
            word.speaker !== undefined
              ? `speaker_${word.speaker}`
              : "unknown_speaker";

          if (!speakerUtterances[speakerKey]) {
            speakerUtterances[speakerKey] = [];
          }

          speakerUtterances[speakerKey].push(word.word);

          console.log(
            `Word: "${word.word}", Speaker: ${word.speaker}, Confidence: ${word.confidence?.toFixed(2)}, Time: ${word.start}s - ${word.end}s`
          );
        });

        // Log grouped utterances by speaker
        console.log("\n===== Speaker Utterances =====");
        Object.entries(speakerUtterances).forEach(([speaker, utterances]) => {
          console.log(`${speaker}: "${utterances.join(" ")}"`);
        });
        console.log("================================");
      }

      // Process speaker segments from word-level data
      // This builds up a more complete picture of what each speaker has said
      if (words.length > 0) {
        // Track current speaker for contiguous utterances
        let currentSpeaker: string | null = null;
        let currentUtterance: string[] = [];

        words.forEach((word) => {
          const speakerKey =
            word.speaker !== undefined
              ? `speaker_${word.speaker}`
              : "unknown_speaker";

          // If we've changed speakers, store the previous utterance
          if (
            currentSpeaker !== null &&
            currentSpeaker !== speakerKey &&
            currentUtterance.length > 0
          ) {
            // Add the completed utterance to this speaker's transcript
            if (!speakerSegmentsRef.current[currentSpeaker]) {
              speakerSegmentsRef.current[currentSpeaker] =
                currentUtterance.join(" ");
            } else {
              // Check if this utterance is already at the end of the speaker's transcript to avoid duplication
              const existingText = speakerSegmentsRef.current[currentSpeaker];
              const newUtterance = currentUtterance.join(" ");

              if (!existingText.endsWith(newUtterance)) {
                speakerSegmentsRef.current[currentSpeaker] +=
                  ` ${newUtterance}`;
              }
            }

            // Reset for the new speaker
            currentUtterance = [];
          }

          // Update current speaker and add word to current utterance
          currentSpeaker = speakerKey;
          currentUtterance.push(word.word);
        });

        // Don't forget to add the last utterance
        if (currentSpeaker !== null && currentUtterance.length > 0) {
          if (!speakerSegmentsRef.current[currentSpeaker]) {
            speakerSegmentsRef.current[currentSpeaker] =
              currentUtterance.join(" ");
          } else {
            const existingText = speakerSegmentsRef.current[currentSpeaker];
            const newUtterance = currentUtterance.join(" ");

            if (!existingText.endsWith(newUtterance)) {
              speakerSegmentsRef.current[currentSpeaker] += ` ${newUtterance}`;
            }
          }
        }

        // Update the speaker segments state
        setSpeakerSegments({ ...speakerSegmentsRef.current });
      }

      // Process the main transcript based on whether it's final or interim
      if (isFinal) {
        // For final results, handle potential duplicates carefully
        const cleanedText = transcriptText.trim();

        // Check if our final transcript already contains this text
        if (!finalTranscriptRef.current.endsWith(cleanedText)) {
          // Check for partial overlaps to avoid duplication
          const words = cleanedText.split(" ");
          let overlap = false;

          // Try to detect partial overlaps (up to 5 words)
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

        // Log a summary of the current state
        console.log("Final transcript updated:", finalTranscriptRef.current);
        console.log("Current speaker segments:", speakerSegmentsRef.current);

        // Call the optional callback with transcript and speaker segments
        options?.onTranscriptUpdate?.(
          finalTranscriptRef.current,
          speakerSegmentsRef.current
        );
      } else {
        // For interim results, replace the current interim text
        interimTranscriptRef.current = transcriptText.trim();

        // Combine final and interim for display
        const displayText =
          finalTranscriptRef.current +
          (finalTranscriptRef.current ? " " : "") +
          interimTranscriptRef.current;

        setTranscript(displayText);

        // For interim results, we can still call the callback but with a lower frequency
        // to avoid overwhelming the UI with updates
        options?.onTranscriptUpdate?.(displayText, speakerSegmentsRef.current);
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
    connection.addListener(LiveTranscriptionEvents.Error, handleError);

    // Clean up all listeners when component unmounts or connection changes
    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        handleTranscript
      );
      connection.removeListener(LiveTranscriptionEvents.Error, handleError);
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

  // Start recording function with optimized settings
  const startRecording = useCallback(async () => {
    if (isRecording || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Reset transcript and speaker data
      setTranscript("");
      setSpeakerSegments({});
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      speakerSegmentsRef.current = {};
      setElapsedTime(0);

      // Set up microphone if needed
      if (microphoneState === MicrophoneState.NotSetup) {
        await setupMicrophone();
      }

      // Connect to Deepgram with optimized veterinary settings
      await connectToDeepgram(getDeepgramSettings());

      // Start the microphone
      startMicrophone();

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
    getDeepgramSettings,
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

      // Return the final transcript and speaker segments
      return {
        transcript: finalTranscriptRef.current,
        speakerSegments: speakerSegmentsRef.current,
      };
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
    setSpeakerSegments({});
    setError(null);
    setElapsedTime(0);

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    speakerSegmentsRef.current = {};

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
    speakerSegments,
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
