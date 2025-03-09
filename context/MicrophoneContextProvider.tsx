"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react";

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
  Error = "error",
  Pause = "pause",
  Resume = "resume",
  Start = "start",
  Stop = "stop",
}

export enum MicrophoneState {
  NotSetup = "not-setup",
  SettingUp = "setting-up",
  Ready = "ready",
  Recording = "recording",
  Error = "error",
  Paused = "paused",
}

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  microphoneState: MicrophoneState;
  stream: MediaStream | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  pauseMicrophone: () => void;
  resumeMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  error: Error | null;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

export function MicrophoneContextProvider({
  children,
}: MicrophoneContextProviderProps) {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setupMicrophone = async () => {
    // Don't set up if already set up or in progress
    if (
      microphoneState !== MicrophoneState.NotSetup &&
      microphoneState !== MicrophoneState.Error
    ) {
      return;
    }

    setMicrophoneState(MicrophoneState.SettingUp);
    setError(null);

    try {
      // Request microphone access with noise suppression and echo cancellation
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      // Store the stream in state and ref
      setStream(userMedia);
      streamRef.current = userMedia;
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Microphone setup failed:", error);
      setError(error);
      setMicrophoneState(MicrophoneState.Error);
      throw error;
    }
  };

  const startMicrophone = useCallback(() => {
    // Don't start if already recording or no stream available
    if (microphoneState === MicrophoneState.Recording || !streamRef.current) {
      return;
    }

    try {
      // Create a new MediaRecorder instance
      const newMicrophone = new MediaRecorder(streamRef.current);

      // Set up event listeners
      newMicrophone.addEventListener(MicrophoneEvents.Error, (event) => {
        console.error("MediaRecorder error:", event);
        setError(new Error("MediaRecorder error occurred"));
        setMicrophoneState(MicrophoneState.Error);
      });

      // Start recording with 100ms chunks for more responsive transcription
      newMicrophone.start(100);
      setMicrophone(newMicrophone);
      setMicrophoneState(MicrophoneState.Recording);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error starting microphone:", error);
      setError(error);
      setMicrophoneState(MicrophoneState.Error);
    }
  }, [microphoneState]);

  const stopMicrophone = useCallback(() => {
    if (!microphone) return;

    try {
      if (microphone.state === "recording" || microphone.state === "paused") {
        microphone.stop();
      }

      // Clean up the microphone
      setMicrophone(null);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error stopping microphone:", error);
      setError(error);
      setMicrophoneState(MicrophoneState.Error);

      // Even on error, try to reset the microphone
      setMicrophone(null);
    }
  }, [microphone]);

  const pauseMicrophone = useCallback(() => {
    if (!microphone || microphone.state !== "recording") return;

    try {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error pausing microphone:", error);
      setError(error);
    }
  }, [microphone]);

  const resumeMicrophone = useCallback(() => {
    if (!microphone || microphone.state !== "paused") return;

    try {
      microphone.resume();
      setMicrophoneState(MicrophoneState.Recording);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error resuming microphone:", error);
      setError(error);
    }
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        microphoneState,
        stream,
        startMicrophone,
        stopMicrophone,
        pauseMicrophone,
        resumeMicrophone,
        setupMicrophone,
        error,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
}

export function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);
  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider"
    );
  }
  return context;
}
