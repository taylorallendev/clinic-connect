"use client";

import {
  createClient,
  type LiveClient,
  SOCKET_STATES,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from "@deepgram/sdk";

import {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react";

interface DeepgramContextType {
  connection: LiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: SOCKET_STATES;
  isConnecting: boolean;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

interface DeepgramKeyResponse {
  key: string;
  url?: string;
}

const getApiKey = async (): Promise<string> => {
  try {
    const response = await fetch("/api/authenticate", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(
        `API key fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as DeepgramKeyResponse;
    return result.key;
  } catch (error) {
    console.error("Failed to fetch Deepgram API key:", error);
    throw new Error(
      "Authentication failed. Please check your API configuration."
    );
  }
};

export function DeepgramContextProvider({
  children,
}: DeepgramContextProviderProps) {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(
    SOCKET_STATES.closed
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    // Don't allow multiple connection attempts
    if (isConnecting || connectionState === SOCKET_STATES.open) {
      return;
    }

    try {
      setIsConnecting(true);

      // Clean up any existing connection
      if (connection) {
        connection.finish();
        setConnection(null);
      }

      const key = await getApiKey();
      const deepgram = createClient(key);
      const conn = deepgram.listen.live(options, endpoint);

      // Set up connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (conn.getReadyState() !== SOCKET_STATES.open) {
          conn.finish();
          setConnectionState(SOCKET_STATES.closed);
          setIsConnecting(false);
          console.error("Connection timeout after 5 seconds");
        }
      }, 5000);

      // Set up event listeners
      conn.addListener(LiveTranscriptionEvents.Open, () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setConnectionState(SOCKET_STATES.open);
        setIsConnecting(false);
      });

      conn.addListener(LiveTranscriptionEvents.Close, () => {
        setConnectionState(SOCKET_STATES.closed);
        setConnection(null);
      });

      conn.addListener(LiveTranscriptionEvents.Error, (error) => {
        console.error("Deepgram connection error:", error);
        setConnectionState(SOCKET_STATES.closed);
        setIsConnecting(false);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      });

      setConnection(conn);
    } catch (error) {
      console.error("Failed to connect to Deepgram:", error);
      setConnectionState(SOCKET_STATES.closed);
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnectFromDeepgram = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (connection) {
      // Remove all listeners before finishing the connection
      connection.removeAllListeners();
      connection.finish();
      // Add requestClose() as shown in the Deepgram example
      connection.requestClose();
      setConnection(null);
      setConnectionState(SOCKET_STATES.closed);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
        isConnecting,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
}

export function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider"
    );
  }
  return context;
}

export { SOCKET_STATES, LiveTranscriptionEvents, type LiveTranscriptionEvent };
