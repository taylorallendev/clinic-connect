"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  microphoneState: MicrophoneState | null;
}

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
  Error = "error",
  Pause = "pause",
  Resume = "resume",
  Start = "start",
  Stop = "stop",
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined,
);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup,
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const setupMicrophone = async () => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      setStream(userMedia);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err) {
      console.error(err);
      setMicrophoneState(MicrophoneState.Error);
      throw err;
    }
  };

  const stopMicrophone = useCallback(() => {
    if (!microphone) return;

    try {
      setMicrophoneState(MicrophoneState.Pausing);

      if (microphone.state === "recording") {
        microphone.stop(); // Fully stop recording instead of just pausing
        // Create a new microphone for next recording session
        setMicrophone(null);
        setMicrophoneState(MicrophoneState.Ready);
      } else if (microphone.state === "paused") {
        microphone.stop();
        setMicrophone(null);
        setMicrophoneState(MicrophoneState.Ready);
      }
    } catch (error) {
      console.error("Error stopping microphone:", error);
      setMicrophoneState(MicrophoneState.Error);
      // Even on error, try to reset the microphone
      setMicrophone(null);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    if (!stream) return;

    try {
      setMicrophoneState(MicrophoneState.Opening);

      if (!microphone) {
        const newMicrophone = new MediaRecorder(stream);
        setMicrophone(newMicrophone);
        newMicrophone.start(250);
      } else if (microphone.state === "paused") {
        microphone.resume();
      } else if (microphone.state === "inactive") {
        microphone.start(250);
      }

      setMicrophoneState(MicrophoneState.Open);
    } catch (error) {
      console.error("Error starting microphone:", error);
      setMicrophoneState(MicrophoneState.Error);
    }
  }, [microphone, stream]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider",
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
