import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { InfographicContent } from "@/lib/types";

interface EditorStore {
  content: InfographicContent | null;
  isGenerating: boolean;
  setContent: (content: InfographicContent) => void;
  setGenerating: (generating: boolean) => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      content: null,
      isGenerating: false,
      setContent: (content) => set({ content }),
      setGenerating: (generating) => set({ isGenerating: generating }),
    }),
    { name: "editor-store" },
  ),
);