"use client";

import { create } from "zustand";
import { DEFAULT_ANIMAL_ID } from "@/animals/registry";
import { DEFAULT_LOCALE, HTML_LANG, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Citations returned by the RAG backend, when it has them. */
  sources?: { title: string; page?: number }[];
  pending?: boolean;
}

interface AppState {
  locale: Locale;
  animalId: string;
  behaviorId: string | null;
  modelReady: boolean;
  chatOpen: boolean;
  panelOpen: boolean;
  messages: ChatMessage[];
  chatBusy: boolean;

  setLocale: (locale: Locale) => void;
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
  // Always the default on first render. The real choice is read from storage in
  // a client effect (`LocaleSync`), because reading it during render would make
  // the server and client markup disagree and break hydration.
  locale: DEFAULT_LOCALE,
  animalId: DEFAULT_ANIMAL_ID,
  behaviorId: null,
  modelReady: false,
  chatOpen: false,
  panelOpen: true,
  messages: [],
  chatBusy: false,

  setLocale: (locale) =>
    set(() => {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        /* storage unavailable — the switch still applies for this session */
      }
      if (typeof document !== "undefined") document.documentElement.lang = HTML_LANG[locale];
      // Answers already on screen are in the previous language and cannot be
      // retranslated, so clear the transcript rather than leave it mixed.
      return { locale, messages: [] };
    }),
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
