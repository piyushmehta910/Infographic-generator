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

const SUPPORTED_PROVIDER_IDS = ["openrouter", "groq", "nim", "mistral"] as const;

const defaultProviders: AIProviderConfig[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKey: "",
    model: "openrouter/free",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: true,
  },
  {
    id: "nim",
    name: "NVIDIA NIM",
    apiKey: "",
    model: "meta/llama-3.3-70b-instruct",
    temperature: 0.5,
    maxTokens: 1024,
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
  {
    id: "mistral",
    name: "Mistral",
    apiKey: "",
    model: "mistral-large-latest",
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
        activeProvider: "openrouter",
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
          // Migrate persisted state: drop removed providers (OpenAI/Gemini/Claude),
          // reset OpenRouter to a free model, and fix stale active provider.
          const merged = { ...current, ...(persisted as Partial<AIStore>) };
          if (merged.providers) {
            merged.providers = (merged.providers || [])
              .filter((p: AIProviderConfig) =>
                (SUPPORTED_PROVIDER_IDS as readonly string[]).includes(p.id),
              )
              .map((p: AIProviderConfig) => {
                if (
                  p.id === "openrouter" &&
                  p.model &&
                  p.model !== "openrouter/free" &&
                  !p.model.endsWith(":free")
                ) {
                  return { ...p, model: "openrouter/free" };
                }
                return p;
              });
            if (merged.providers.length === 0) merged.providers = defaultProviders;
          }
          if (
            !(SUPPORTED_PROVIDER_IDS as readonly string[]).includes(merged.activeProvider)
          ) {
            merged.activeProvider = "openrouter";
          }
          return merged;
        },
      },
    ),
    { name: "ai-store" },
  ),
);
