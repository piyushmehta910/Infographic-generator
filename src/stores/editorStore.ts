import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { InfographicContent, GenerationContext, ChatMessage, GenerationRevision } from "@/lib/types";

interface EditorStore {
  content: InfographicContent | null;
  isGenerating: boolean;
  generationContext: GenerationContext | null;
  messages: ChatMessage[];
  revisions: GenerationRevision[];
  currentRevisionId: string | null;

  setContent: (content: InfographicContent) => void;
  setGenerating: (generating: boolean) => void;
  setGenerationContext: (context: GenerationContext | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addRevision: (rev: GenerationRevision) => void;
  setRevisions: (revs: GenerationRevision[]) => void;
  setCurrentRevisionId: (id: string | null) => void;
  clearSession: () => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      content: null,
      isGenerating: false,
      generationContext: null,
      messages: [],
      revisions: [],
      currentRevisionId: null,

      setContent: (content) => set({ content }),
      setGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationContext: (context) => set({ generationContext: context }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setMessages: (messages) => set({ messages }),
      addRevision: (rev) =>
        set((state) => ({
          revisions: [...state.revisions, rev],
          currentRevisionId: rev.revisionId,
        })),
      setRevisions: (revisions) => set({ revisions }),
      setCurrentRevisionId: (currentRevisionId) => set({ currentRevisionId }),
      clearSession: () =>
        set({
          content: null,
          isGenerating: false,
          generationContext: null,
          messages: [],
          revisions: [],
          currentRevisionId: null,
        }),
    }),
    { name: "editor-store" },
  ),
);