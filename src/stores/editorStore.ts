import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { InfographicContent, GenerationContext } from "@/lib/types";

interface EditorStore {
  content: InfographicContent | null;
  isGenerating: boolean;
  generationContext: GenerationContext | null;
  setContent: (content: InfographicContent) => void;
  setGenerating: (generating: boolean) => void;
  setGenerationContext: (context: GenerationContext | null) => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      content: null,
      isGenerating: false,
      generationContext: null,
      setContent: (content) => set({ content }),
      setGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationContext: (context) => set({ generationContext: context }),
    }),
    { name: "editor-store" },
  ),
);