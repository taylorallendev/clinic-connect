"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  LiveTranscriptionEvent,
  useDeepgram,
} from "@/src/providers/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/src/providers/MicrophoneContextProvider";
import { LiveTranscriptionEvents, SOCKET_STATES } from "@deepgram/sdk";
import { DEEPGRAM_CONFIG } from "@/src/lib/constants";
import { useTranscriptionStore } from "@/src/store/use-transcription-store";
import { Button } from "@/src/components/ui/button";
import { useCaseStore } from "@/src/store/use-case-store";

export function RecordingCard() {
  // State for continuous transcript
  const [continuousTranscript, setContinuousTranscript] = useState<string>("");
  // State for current interim transcript
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  // State for controlling recording
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Reference to help manage transcript building
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const lastProcessedTextRef = useRef<string>("");

  // Using store for sharing transcript with other components
  const { setStreamingContent, setIsRecording: setStoreIsRecording } =
    useTranscriptionStore();

  // Use case store for saving transcript as a case action
  const {
    setTranscriptText,
    handleRecordingFinished,
    setMicrophoneState,
    setConnectionState,
  } = useCaseStore();

  // Deepgram and microphone setup
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    stopMicrophone,
    microphoneState,
  } = useMicrophone();

  // References for intervals and timeouts
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize microphone on component mount
  useEffect(() => {
    console.log("Setting up microphone...");
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to Deepgram when microphone is ready
  useEffect(() => {
    console.log(
      `Microphone state: ${microphoneState !== null ? MicrophoneState[microphoneState] : "null"}`
    );
    if (microphoneState === MicrophoneState.Ready) {
      console.log("Connecting to Deepgram with config:", DEEPGRAM_CONFIG);
      connectToDeepgram(DEEPGRAM_CONFIG);
    }

    // Update microphone state in case store
    if (microphoneState !== null) {
      setMicrophoneState(microphoneState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  // Update connection state in case store
  useEffect(() => {
    setConnectionState(connectionState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // Update isRecording state based on microphone state
  useEffect(() => {
    setIsRecording(microphoneState === MicrophoneState.Open);
    setStoreIsRecording(microphoneState === MicrophoneState.Open);
  }, [microphoneState, setStoreIsRecording]);

  // Set up listeners when connection is established
  useEffect(() => {
    if (!connection || connectionState !== SOCKET_STATES.open) {
      return;
    }

    // Function to handle transcript events from Deepgram
    const onTranscript = (data: LiveTranscriptionEvent) => {
      // Extract key data from the event
      const { is_final: isFinal } = data;
      const transcriptText = data.channel?.alternatives?.[0]?.transcript ?? "";

      // Skip empty transcripts
      if (!transcriptText || !transcriptText.trim()) {
        return;
      }

      console.log(
        `Transcript [${isFinal ? "FINAL" : "interim"}]: "${transcriptText}"`
      );

      // Generate a unique ID to avoid processing duplicates
      const messageId = `${Date.now()}-${transcriptText.substring(0, 20)}`;

      // Skip if this is a duplicate of the last processed text
      if (messageId === lastProcessedTextRef.current) {
        return;
      }

      lastProcessedTextRef.current = messageId;

      // Process based on whether this is a final or interim result
      if (isFinal) {
        // For final results, add to the final transcript
        const cleanedText = transcriptText.trim();

        // Check if our final transcript already contains this text to avoid duplication
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

          // If no overlap found, just append with appropriate spacing
          if (!overlap) {
            const needsSpace =
              finalTranscriptRef.current.length > 0 &&
              !finalTranscriptRef.current.endsWith(" ");

            finalTranscriptRef.current += (needsSpace ? " " : "") + cleanedText;
          }
        }

        // Clear interim transcript since we have a final result
        interimTranscriptRef.current = "";
        setInterimTranscript("");

        // Update the continuous transcript with final text
        setContinuousTranscript(finalTranscriptRef.current);

        // Update the streaming content in the store for other components
        setStreamingContent(finalTranscriptRef.current);

        // Update the transcript text in the case store
        setTranscriptText(finalTranscriptRef.current);
      } else {
        // For interim results, update the interim transcript
        interimTranscriptRef.current = transcriptText.trim();
        setInterimTranscript(interimTranscriptRef.current);

        // Combine final and interim for display
        const displayText =
          finalTranscriptRef.current +
          (finalTranscriptRef.current &&
          !finalTranscriptRef.current.endsWith(" ")
            ? " "
            : "") +
          interimTranscriptRef.current;

        // Update continuous transcript and store
        setContinuousTranscript(displayText);
        setStreamingContent(displayText);
      }
    };

    // Add transcript listener
    connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);

    // Cleanup function to remove listeners
    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
    };
  }, [connection, connectionState, setStreamingContent, setTranscriptText]);

  // Set up microphone audio data handling separately
  useEffect(() => {
    if (
      !microphone ||
      !connection ||
      connectionState !== SOCKET_STATES.open ||
      !isRecording
    ) {
      return;
    }

    // Function to handle audio data and send to Deepgram
    const onData = (e: BlobEvent) => {
      // Prevent empty packets from being sent (iOS Safari fix)
      if (e.data.size > 0) {
        console.log(`Sending audio packet: ${e.data.size} bytes`);
        connection.send(e.data);
      }
    };

    // Add event listener for audio data
    microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

    // Cleanup function to remove listeners
    return () => {
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
    };
  }, [microphone, connection, connectionState, isRecording]);

  // Keep the connection alive
  useEffect(() => {
    if (!connection) return;

    if (connectionState === SOCKET_STATES.open) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    }

    return () => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // Function to toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopMicrophone();
    } else if (connectionState === SOCKET_STATES.open) {
      startMicrophone();
    }
  };

  // Function to clear transcript
  const handleClearTranscript = () => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setContinuousTranscript("");
    setInterimTranscript("");
    setStreamingContent("");
    setTranscriptText("");
  };

  // Function to save transcript as a case action
  const handleSaveTranscript = () => {
    if (finalTranscriptRef.current.trim()) {
      // If still recording, stop the microphone first
      if (isRecording) {
        stopMicrophone();
      }

      // Save the transcript to the case store
      setTranscriptText(finalTranscriptRef.current);
      handleRecordingFinished();

      // Clear the transcript after saving
      handleClearTranscript();
    }
  };

  return (
    <div>
      <Card className="bg-card border-border shadow-md rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground flex items-center">
              <Mic className="h-5 w-5 mr-2 text-card-foreground inline" />
              Voice Recording
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4">
            {/* Mic button for starting/stopping recording */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={toggleRecording}
                disabled={connectionState !== SOCKET_STATES.open}
                className={`flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : connectionState === SOCKET_STATES.open
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-gray-300 cursor-not-allowed"
                }`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <div
                    className="h-8 w-8 bg-white rounded-sm"
                    aria-label="Stop recording"
                  />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </button>
            </div>

            {/* Continuous transcript display */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Transcript
                </h3>
                <div></div>
              </div>
              <textarea
                className="bg-muted/30 border border-muted/30 rounded-lg p-4 text-card-foreground w-full min-h-[150px] font-medium resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                value={continuousTranscript}
                readOnly
                placeholder="Transcript will appear here as you speak..."
              />

              {/* Recording indicator */}
              {isRecording && (
                <div className="mt-2 text-sm font-medium text-red-500 flex items-center">
                  <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-red-500"></div>
                  Recording in progress...
                </div>
              )}

              {/* Save and Clear buttons for transcript */}
              {continuousTranscript.trim() && (
                <div className="mt-4 flex justify-end items-center gap-4">
                  <button
                    onClick={handleClearTranscript}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                  <Button
                    onClick={handleSaveTranscript}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save Transcript
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
