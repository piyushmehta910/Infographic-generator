import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  InfographicContent,
  TemplateSettings,
  EditorState,
  EditorHistoryEntry,
} from "@/lib/types";
import { DEFAULT_TEMPLATE_SETTINGS } from "@/lib/constants";

interface EditorStore {
  // State
  content: InfographicContent | null;
  settings: TemplateSettings;
  editor: EditorState;
  isGenerating: boolean;
  isSaving: boolean;

  // Actions
  setContent: (content: InfographicContent) => void;
  updateContent: (updates: Partial<InfographicContent>) => void;
  setSettings: (settings: Partial<TemplateSettings>) => void;
  setMode: (mode: EditorState["mode"]) => void;
  setZoom: (zoom: number) => void;
  selectElement: (elementId: string | null) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGenerating: (generating: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;
}

const initialEditor: EditorState = {
  mode: "generating",
  selectedElement: null,
  zoom: 100,
  showGrid: false,
  snapToGrid: true,
  history: [],
  historyIndex: -1,
};

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      content: null,
      settings: { ...DEFAULT_TEMPLATE_SETTINGS },
      editor: { ...initialEditor },
      isGenerating: false,
      isSaving: false,

      setContent: (content) => set({ content }),

      updateContent: (updates) =>
        set((state) => ({
          content: state.content ? { ...state.content, ...updates } : null,
        })),

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setMode: (mode) =>
        set((state) => ({
          editor: { ...state.editor, mode },
        })),

      setZoom: (zoom) =>
        set((state) => ({
          editor: { ...state.editor, zoom: Math.max(25, Math.min(200, zoom)) },
        })),

      selectElement: (elementId) =>
        set((state) => ({
          editor: { ...state.editor, selectedElement: elementId },
        })),

      toggleGrid: () =>
        set((state) => ({
          editor: { ...state.editor, showGrid: !state.editor.showGrid },
        })),

      toggleSnapToGrid: () =>
        set((state) => ({
          editor: { ...state.editor, snapToGrid: !state.editor.snapToGrid },
        })),

      setGenerating: (generating) => set({ isGenerating: generating }),
      setSaving: (saving) => set({ isSaving: saving }),

      reset: () =>
        set({
          content: null,
          settings: { ...DEFAULT_TEMPLATE_SETTINGS },
          editor: { ...initialEditor },
          isGenerating: false,
        }),

      pushHistory: (description) =>
        set((state) => {
          if (!state.content) return state;
          const entry: EditorHistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            description,
            snapshot: JSON.parse(JSON.stringify(state.content)),
          };
          const newHistory = state.editor.history.slice(
            0,
            state.editor.historyIndex + 1,
          );
          newHistory.push(entry);
          if (newHistory.length > 50) newHistory.shift();
          return {
            editor: {
              ...state.editor,
              history: newHistory,
              historyIndex: newHistory.length - 1,
            },
          };
        }),

      undo: () =>
        set((state) => {
          if (state.editor.historyIndex <= 0) return state;
          const newIndex = state.editor.historyIndex - 1;
          const entry = state.editor.history[newIndex];
          return {
            content: JSON.parse(JSON.stringify(entry.snapshot)),
            editor: { ...state.editor, historyIndex: newIndex },
          };
        }),

      redo: () =>
        set((state) => {
          if (state.editor.historyIndex >= state.editor.history.length - 1)
            return state;
          const newIndex = state.editor.historyIndex + 1;
          const entry = state.editor.history[newIndex];
          return {
            content: JSON.parse(JSON.stringify(entry.snapshot)),
            editor: { ...state.editor, historyIndex: newIndex },
          };
        }),
    }),
    { name: "editor-store" },
  ),
);
