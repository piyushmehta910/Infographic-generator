import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  AIProviderId,
  AIProviderConfig,
  AIGenerationResult,
} from "@/lib/types";

interface AIStore {
  // State
  providers: AIProviderConfig[];
  activeProvider: AIProviderId;
  lastResult: AIGenerationResult | null;
  isProcessing: boolean;

  // Actions
  setProvider: (provider: AIProviderConfig) => void;
  removeProvider: (providerId: AIProviderId) => void;
  setActiveProvider: (provider: AIProviderId) => void;
  setLastResult: (result: AIGenerationResult | null) => void;
  setProcessing: (processing: boolean) => void;
  getActiveConfig: () => AIProviderConfig | undefined;
}

const defaultProviders: AIProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKey: "",
    model: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    apiKey: "",
    model: "gemini-1.5-flash",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    apiKey: "",
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKey: "",
    model: "openrouter/free",
    temperature: 0.5,
    maxTokens: 512,
    enabled: false,
  },
  {
    id: "groq",
    name: "Groq",
    apiKey: "",
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
  },
];

export const useAIStore = create<AIStore>()(
  devtools(
    persist(
      (set, get) => ({
        providers: defaultProviders,
        activeProvider: "openai",
        lastResult: null,
        isProcessing: false,

        setProvider: (provider) =>
          set((state) => ({
            providers: state.providers.map((p) =>
              p.id === provider.id ? provider : p,
            ),
          })),

        removeProvider: (providerId) =>
          set((state) => ({
            providers: state.providers.map((p) =>
              p.id === providerId ? { ...p, apiKey: "", enabled: false } : p,
            ),
          })),

        setActiveProvider: (provider) => set({ activeProvider: provider }),

        setLastResult: (result) => set({ lastResult: result }),

        setProcessing: (processing) => set({ isProcessing: processing }),

        getActiveConfig: () => {
          const { providers, activeProvider } = get();
          return providers.find((p) => p.id === activeProvider);
        },
      }),
      {
        name: "ai-store",
        partialize: (state) => ({
          providers: state.providers,
          activeProvider: state.activeProvider,
        }),
        merge: (persisted, current) => {
          // Force migrate old model names that are no longer supported
          const merged = { ...current, ...(persisted as Partial<AIStore>) };
          if (merged.providers) {
            merged.providers = merged.providers.map((p: AIProviderConfig) => {
              // Force Groq to use supported model
              if (p.id === "groq" && p.model === "llama-3.1-70b-versatile") {
                return { ...p, model: "llama-3.3-70b-versatile" };
              }
              // Force OpenRouter to use correct model format if needed
              if (
                p.id === "openrouter" &&
                p.model === "meta-llama/llama-3.1-70b"
              ) {
                return { ...p, model: "openai/gpt-4o" };
              }
              return p;
            });
          }
          return merged;
        },
      },
    ),
    { name: "ai-store" },
  ),
);
