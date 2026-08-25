"use client";

import { create } from "zustand";
import { DEFAULT_ANIMAL_ID } from "@/animals/registry";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Citations returned by the RAG backend, when it has them. */
  sources?: { title: string; page?: number }[];
  pending?: boolean;
}

interface AppState {
  animalId: string;
  behaviorId: string | null;
  modelReady: boolean;
  chatOpen: boolean;
  panelOpen: boolean;
  messages: ChatMessage[];
  chatBusy: boolean;

  setAnimal: (id: string) => void;
  setBehavior: (id: string | null) => void;
  setModelReady: (ready: boolean) => void;
  toggleChat: () => void;
  togglePanel: () => void;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setChatBusy: (busy: boolean) => void;
  resetChat: () => void;
}

export const useApp = create<AppState>((set) => ({
  animalId: DEFAULT_ANIMAL_ID,
  behaviorId: null,
  modelReady: false,
  chatOpen: false,
  panelOpen: true,
  messages: [],
  chatBusy: false,

  setAnimal: (id) => set({ animalId: id, behaviorId: null, modelReady: false, messages: [] }),
  setBehavior: (id) => set((s) => ({ behaviorId: s.behaviorId === id ? null : id })),
  setModelReady: (modelReady) => set({ modelReady }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateMessage: (id, patch) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  setChatBusy: (chatBusy) => set({ chatBusy }),
  resetChat: () => set({ messages: [] }),
}));
