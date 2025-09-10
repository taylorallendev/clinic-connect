import { create } from "zustand";
import { SOCKET_STATES } from "@/src/providers/DeepgramContextProvider";
import { MicrophoneState } from "@/src/providers/MicrophoneContextProvider";
import { saveActionsToCase as saveActionsToCaseAction } from "@/app/actions";

export interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface CaseAction {
  id: string;
  type: "soap" | "recording" | "unknown";
  content: {
    transcript?: string;
    soap?: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
  };
  timestamp: number;
}

export interface AppointmentData {
  id: string;
  name: string;
  date: string;
  time: string;
  type: string;
  status: string;
  // Legacy fields for backward compatibility
  patientName?: string;
  ownerName?: string;
  patients: {
    id: string | null;
    name: string;
    first_name: string;
    last_name: string;
  };
  users: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
  };
  metadata?: {
    hasTranscriptions: boolean;
    hasSoapNotes: boolean;
    hasGenerations: boolean;
  };
  rawData?: {
    transcriptions?: Array<{
      id: string;
      transcript: string | null;
      created_at: string;
    }>;
    soap_notes?: Array<{
      id: string;
      subjective: string | null;
      objective: string | null;
      assessment: string | null;
      plan: string | null;
      created_at: string;
    }>;
    generations?: Array<{
      id: string;
      prompt: string | null;
      content: string | null;
      created_at: string;
    }>;
  };
}

interface CaseState {
  isRecording: boolean;
  timer: number;
  caseActions: CaseAction[];
  isLoading: boolean;
  transcriptText: string;
  microphoneState: MicrophoneState;
  connectionState: SOCKET_STATES;
  selectedRecordings: string[];
  currentCaseId: string | null;
  loadedAppointment: AppointmentData | null;

  // Actions
  setIsRecording: (value: boolean) => void;
  setTimer: (value: number) => void;
  addCaseAction: (action: CaseAction) => void;
  updateCaseAction: (actionId: string, updatedAction: CaseAction) => void;
  setIsLoading: (value: boolean) => void;
  setTranscriptText: (value: string) => void;
  setMicrophoneState: (state: MicrophoneState) => void;
  setConnectionState: (state: SOCKET_STATES) => void;
  handleRecordingFinished: () => void;
  reset: () => void;
  saveActionsToCase: (caseId: number | string) => Promise<boolean>;
  toggleRecordingSelection: (actionId: string) => void;
  clearSelectedRecordings: () => void;
  setCurrentCaseId: (id: string | null) => void;
  loadAppointmentData: (appointment: AppointmentData) => void;
}

// Initial dummy data
const dummyAction: CaseAction = {
  id: "dummy-1",
  type: "soap",
  content: {
    transcript: "Patient presented with vomiting and lethargy",
    soap: {
      subjective:
        "Owner reports vomiting for 2 days, decreased appetite, and lethargy. No diarrhea noted.",
      objective:
        "Temperature: 102.1°F\nHeart Rate: 120 bpm\nResponsive but lethargic\nMild abdominal tenderness on palpation",
      assessment:
        "Suspected acute gastroenteritis. Differential diagnoses include dietary indiscretion, inflammatory bowel disease, or potential foreign body.",
      plan: "1. Start on anti-emetics (Cerenia)\n2. Fluid therapy for 24-48 hours\n3. Bland diet when vomiting resolves\n4. Recheck in 24 hours",
    },
  },
  timestamp: Date.now() - 86400000, // 24 hours ago
};

export const useCaseStore = create<CaseState>((set, get) => ({
  // State
  isRecording: false,
  timer: 0,
  caseActions: [],
  // caseActions: [dummyAction],
  isLoading: false,
  transcriptText: "",
  microphoneState: MicrophoneState.NotSetup,
  connectionState: SOCKET_STATES.closed,
  selectedRecordings: [],
  currentCaseId: null,
  loadedAppointment: null,

  // Actions
  setIsRecording: (value) => set({ isRecording: value }),
  setTimer: (value) => {
    // Use setTimeout to avoid updating during render
    setTimeout(() => {
      set({ timer: value });
    }, 0);
  },
  addCaseAction: (action) =>
    set((state) => ({ caseActions: [action, ...state.caseActions] })),
  updateCaseAction: (actionId, updatedAction) =>
    set((state) => ({
      caseActions: state.caseActions.map((action) =>
        action.id === actionId ? updatedAction : action
      ),
    })),
  setIsLoading: (value) => set({ isLoading: value }),
  setTranscriptText: (value) => set({ transcriptText: value }),
  setMicrophoneState: (state) => set({ microphoneState: state }),
  setConnectionState: (state) => set({ connectionState: state }),
  toggleRecordingSelection: (actionId) =>
    set((state) => {
      if (state.selectedRecordings.includes(actionId)) {
        return {
          selectedRecordings: state.selectedRecordings.filter(
            (id) => id !== actionId
          ),
        };
      } else {
        return { selectedRecordings: [...state.selectedRecordings, actionId] };
      }
    }),
  clearSelectedRecordings: () => set({ selectedRecordings: [] }),

  handleRecordingFinished: () => {
    const { transcriptText } = get();
    if (transcriptText.trim()) {
      console.log("ADDING CASE RECORDING ACTION ");
      get().addCaseAction({
        id: crypto.randomUUID(),
        type: "recording",
        content: {
          transcript: transcriptText,
        },
        timestamp: Date.now(),
      });

      // Clear transcript text after saving it as a case action
      get().setTranscriptText("");
    }
  },

  reset: () =>
    set({
      isRecording: false,
      timer: 0,
      caseActions: [],
      isLoading: false,
      transcriptText: "",
      microphoneState: MicrophoneState.NotSetup,
      connectionState: SOCKET_STATES.closed,
      selectedRecordings: [],
      currentCaseId: null,
      loadedAppointment: null,
    }),

  // Updated function to use the server action with string IDs (no conversion needed)
  saveActionsToCase: async (caseId) => {
    const { caseActions } = get();

    if (caseActions.length === 0) return true;

    try {
      // Use the caseId directly as string (new schema uses UUID strings)
      const result = await saveActionsToCaseAction(
        caseId.toString(),
        caseActions
      );

      if (result.success) {
        console.log("Successfully saved all case actions");
        return true;
      } else {
        console.error("Failed to save case actions:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error in saveActionsToCase:", error);
      return false;
    }
  },

  setCurrentCaseId: (id) => set({ currentCaseId: id }),

  // Load appointment data into the store - updated for normalized schema
  loadAppointmentData: (appointment) => {
    const caseActions: CaseAction[] = [];

    // Convert normalized data to CaseAction format if rawData exists
    if (appointment.rawData) {
      // Convert transcriptions to recording actions
      if (appointment.rawData.transcriptions) {
        appointment.rawData.transcriptions.forEach((transcription: any) => {
          caseActions.push({
            id: transcription.id,
            type: "recording",
            content: {
              transcript: transcription.transcript || "",
            },
            timestamp: new Date(transcription.created_at).getTime(),
          });
        });
      }

      // Convert soap_notes to soap actions
      if (appointment.rawData.soap_notes) {
        appointment.rawData.soap_notes.forEach((soapNote: any) => {
          caseActions.push({
            id: soapNote.id,
            type: "soap",
            content: {
              transcript: "", // SOAP notes might not have associated transcript
              soap: {
                subjective: soapNote.subjective || "",
                objective: soapNote.objective || "",
                assessment: soapNote.assessment || "",
                plan: soapNote.plan || "",
              },
            },
            timestamp: new Date(soapNote.created_at).getTime(),
          });
        });
      }

      // Convert generations to soap actions (generations are typically SOAP-like content)
      if (appointment.rawData.generations) {
        appointment.rawData.generations.forEach((generation: any) => {
          // Try to parse the content if it's JSON
          let soapContent;
          try {
            const parsed = JSON.parse(generation.content || "{}");
            if (
              parsed.subjective ||
              parsed.objective ||
              parsed.assessment ||
              parsed.plan
            ) {
              soapContent = {
                subjective: parsed.subjective || "",
                objective: parsed.objective || "",
                assessment: parsed.assessment || "",
                plan: parsed.plan || "",
              };
            } else {
              // If not SOAP format, put content in plan field
              soapContent = {
                subjective: `Generated content from template`,
                objective: "",
                assessment: "",
                plan: generation.content || "",
              };
            }
          } catch (e) {
            // If parsing fails, treat as plain text
            soapContent = {
              subjective: `Generated content`,
              objective: "",
              assessment: "",
              plan: generation.content || "",
            };
          }

          caseActions.push({
            id: generation.id,
            type: "soap",
            content: {
              transcript: "", // Generations might not have direct transcript
              soap: soapContent,
            },
            timestamp: new Date(generation.created_at).getTime(),
          });
        });
      }
    }

    // Sort actions by timestamp (newest first)
    caseActions.sort((a, b) => b.timestamp - a.timestamp);

    set({
      currentCaseId: appointment.id,
      loadedAppointment: appointment,
      caseActions,
    });

    console.log("Loaded appointment data into store with converted actions:", {
      appointment,
      convertedActions: caseActions,
    });
  },
}));
