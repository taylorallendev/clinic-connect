"use client";

import { create } from 'zustand';

export interface SoapResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface CaseAction {
  id: string;
  type: "recording" | "soap";
  content: {
    transcript: string;
    soap?: SoapResponse;
    [key: string]: any;
  };
  timestamp: number;
}

interface CaseState {
  actions: CaseAction[];
  selectedRecordings: string[];
  
  addCaseAction: (action: CaseAction) => void;
  updateCaseAction: (id: string, action: CaseAction) => void;
  resetCaseStore: () => void;
  toggleRecordingSelection: (id: string) => void;
  clearSelectedRecordings: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  actions: [],
  selectedRecordings: [],
  
  addCaseAction: (action: CaseAction) =>
    set((state) => ({
      actions: [...state.actions, action],
    })),
    
  updateCaseAction: (id: string, updatedAction: CaseAction) =>
    set((state) => ({
      actions: state.actions.map((action) =>
        action.id === id ? updatedAction : action
      ),
    })),
    
  resetCaseStore: () =>
    set({
      actions: [],
      selectedRecordings: [],
    }),
    
  toggleRecordingSelection: (id: string) =>
    set((state) => {
      if (state.selectedRecordings.includes(id)) {
        return {
          selectedRecordings: state.selectedRecordings.filter(
            (recordingId) => recordingId !== id
          ),
        };
      } else {
        return {
          selectedRecordings: [...state.selectedRecordings, id],
        };
      }
    }),
    
  clearSelectedRecordings: () =>
    set({
      selectedRecordings: [],
    }),
}));