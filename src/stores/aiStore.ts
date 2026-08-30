import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  AIProviderId,
  AIProviderConfig,
} from "@/lib/types";

interface AIStore {
  // State
  providers: AIProviderConfig[];
  activeProvider: AIProviderId;

  // Actions
  setProvider: (provider: AIProviderConfig) => void;
  setActiveProvider: (provider: AIProviderId) => void;
  getActiveConfig: () => AIProviderConfig | undefined;
}

const SUPPORTED_PROVIDER_IDS = ["openrouter", "groq", "nim", "mistral", "custom"] as const;

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
    id: "groq",
    name: "Groq",
    apiKey: "",
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
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
    id: "mistral",
    name: "Mistral",
    apiKey: "",
    model: "mistral-small-latest",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
  },
  {
    id: "custom",
    name: "Custom API",
    apiKey: "",
    model: "",
    temperature: 0.5,
    maxTokens: 1024,
    enabled: false,
    baseUrl: "",
  },
];

export const useAIStore = create<AIStore>()(
  devtools(
    persist(
      (set, get) => ({
        providers: defaultProviders,
        activeProvider: "openrouter",

        setProvider: (provider) =>
          set((state) => ({
            providers: state.providers.map((p) =>
              p.id === provider.id ? provider : p,
            ),
          })),

        setActiveProvider: (provider) => set({ activeProvider: provider }),

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
          const merged = { ...current, ...(persisted as Partial<AIStore>) };
          if (merged.providers) {
            const supported = new Set(SUPPORTED_PROVIDER_IDS);
            merged.providers = (merged.providers || [])
              .filter((p: AIProviderConfig) => supported.has(p.id))
              .map((p: AIProviderConfig) => {
                // If OpenRouter was left on paid auto, migrate to free router
                if (p.id === "openrouter" && (!p.model || p.model === "openrouter/auto")) {
                  return { ...p, model: "openrouter/free" };
                }
                return p;
              });
            for (const def of defaultProviders) {
              if (!merged.providers.some((p) => p.id === def.id)) {
                merged.providers.push({ ...def });
              }
            }
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
