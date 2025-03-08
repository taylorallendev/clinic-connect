// Create a new file: hooks/use-transcription.ts
import { useState, useRef, useEffect } from "react";
import {
  useDeepgram,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@/context/DeepgramContextProvider";
import { toast } from "sonner";

export function useTranscription() {
  const [transcriptText, setTranscriptText] = useState("");
  const interimTranscriptRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");

  const { connection } = useDeepgram();

  // Set up transcription listener
  useEffect(() => {
    if (!connection) return;

    const transcriptListener = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal } = data;
      const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";

      if (!transcript || !transcript.trim()) return;

      if (isFinal) {
        const newFinalText =
          finalTranscriptRef.current +
          (finalTranscriptRef.current ? " " : "") +
          transcript.trim();

        finalTranscriptRef.current = newFinalText;
        interimTranscriptRef.current = "";
        setTranscriptText(newFinalText);
      } else {
        interimTranscriptRef.current = transcript.trim();

        const displayText =
          finalTranscriptRef.current +
          (finalTranscriptRef.current ? " " : "") +
          interimTranscriptRef.current;

        setTranscriptText(displayText);
      }
    };

    // Add listeners
    connection.addListener(
      LiveTranscriptionEvents.Transcript,
      transcriptListener
    );

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        transcriptListener
      );
    };
  }, [connection]);

  const resetTranscript = () => {
    setTranscriptText("");
    interimTranscriptRef.current = "";
    finalTranscriptRef.current = "";
  };

  return {
    transcriptText,
    setTranscriptText,
    resetTranscript,
  };
}
