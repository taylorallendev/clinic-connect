import { create } from "zustand";

export interface Section {
  id: string;
  content: string;
}

interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface CaseAction {
  id: string;
  type: "recording" | "soap";
  content: {
    transcript?: string;
    soap?: SoapResponse;
  };
  timestamp: number;
}

interface TranscriptionState {
  transcriptText: string;
  sections: Section[];
  streamingContent: string;
  isRecording: boolean;
  timer: number;
  caseActions: CaseAction[];
  isLoading: boolean;
  setTranscriptText: (value: string | ((prev: string) => string)) => void;
  setSections: (sections: Section[]) => void;
  setStreamingContent: (content: string) => void;
  setIsRecording: (value: boolean) => void;
  setTimer: (value: number) => void;
  addCaseAction: (action: CaseAction) => void;
  setIsLoading: (value: boolean) => void;
  reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  transcriptText: "",
  sections: [],
  streamingContent: "",
  isRecording: false,
  timer: 0,
  caseActions: [],
  isLoading: false,
  setTranscriptText: (value) =>
    set((state) => ({
      transcriptText:
        typeof value === "function" ? value(state.transcriptText) : value,
    })),
  setSections: (sections) => set({ sections }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setIsRecording: (value) => set({ isRecording: value }),
  setTimer: (value) => set({ timer: value }),
  addCaseAction: (action) =>
    set((state) => ({ caseActions: [...state.caseActions, action] })),
  setIsLoading: (value) => set({ isLoading: value }),
  reset: () =>
    set({
      transcriptText: "",
      sections: [],
      streamingContent: "",
      isRecording: false,
      timer: 0,
      caseActions: [],
      isLoading: false,
    }),
}));
