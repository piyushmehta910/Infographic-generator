import { AspectRatio, AIProviderOption, AIProviderId, AIModelOption } from "./types";

/**
 * Look up a model's catalog entry by provider ID and model ID.
 * Returns undefined if the provider or model isn't in the catalog.
 */
export function getModelInfo(
  providerId: AIProviderId,
  modelId: string,
): AIModelOption | undefined {
  const provider = AI_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) return undefined;
  // Exact match first
  const exact = provider.models.find((m) => m.id === modelId);
  if (exact) return exact;
  // Partial match (model might be a fallback variant)
  const partial = provider.models.find(
    (m) => modelId.includes(m.id) || m.id.includes(modelId),
  );
  return partial;
}

/**
 * Get the maxOutput tokens for a model, with a sensible default.
 */
export function getModelMaxOutput(
  providerId: AIProviderId,
  modelId: string,
  fallback: number = 4096,
): number {
  const info = getModelInfo(providerId, modelId);
  return info?.maxOutput ?? fallback;
}

/**
 * Detect if a model is a small/free tier model (≤9B params).
 * These produce simpler output and should have relaxed quality thresholds.
 */
export function isSmallModelId(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  return /\b(8b|7b|3b|3\.5|mini|small|8b-instant|7b-instruct|3b-instruct|9b)\b/.test(lower);
}

export const DESIGN_INTENTS = [
  { id: "auto", label: "Auto", desc: "Let the AI choose" },
  { id: "professional", label: "Professional", desc: "Clean, corporate, trustworthy" },
  { id: "minimal", label: "Minimal", desc: "Whitespace, subtle, elegant" },
  { id: "bold", label: "Bold", desc: "High contrast, punchy colors" },
  { id: "creative", label: "Creative", desc: "Playful, experimental layouts" },
] as const;

export const ASPECT_RATIOS: Record<string, AspectRatio> = {
  "1:1": { id: "1:1", label: "Square 1:1", ratio: "1:1", width: 1080, height: 1080 },
  "4:5": { id: "4:5", label: "Portrait 4:5", ratio: "4:5", width: 1080, height: 1350 },
  "9:16": { id: "9:16", label: "Story 9:16", ratio: "9:16", width: 1080, height: 1920 },
  "16:9": { id: "16:9", label: "Landscape 16:9", ratio: "16:9", width: 1920, height: 1080 },
  "A4-P": { id: "A4-P", label: "A4 Portrait", ratio: "A4 Portrait", width: 794, height: 1123 },
  "A4-L": { id: "A4-L", label: "A4 Landscape", ratio: "A4 Landscape", width: 1123, height: 794 },
  letter: { id: "letter", label: "Letter", ratio: "Letter", width: 816, height: 1056 },
  custom: { id: "custom", label: "Custom", ratio: "Custom", width: 800, height: 800 },
};

export const AI_PROVIDERS: AIProviderOption[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    requiresApiKey: true,
    docsUrl: "https://openrouter.ai/keys",
    models: [
      {
        id: "openrouter/auto",
        name: "OpenRouter Auto (Best Available)",
        contextWindow: 128000,
        maxOutput: 8192,
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Meta Llama 3.3 70B Instruct (Free)",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Google Gemini 2.0 Flash Experimental (Free)",
        contextWindow: 1048576,
        maxOutput: 8192,
      },
      {
        id: "google/gemini-2.0-flash-thinking-exp:free",
        name: "Google Gemini 2.0 Flash Thinking (Free)",
        contextWindow: 1048576,
        maxOutput: 8192,
      },
      {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1 (Free)",
        contextWindow: 64000,
        maxOutput: 8192,
      },
      {
        id: "deepseek/deepseek-chat:free",
        name: "DeepSeek V3 (Free)",
        contextWindow: 64000,
        maxOutput: 8192,
      },
      {
        id: "qwen/qwen-2.5-coder-32b-instruct:free",
        name: "Qwen 2.5 Coder 32B (Free)",
        contextWindow: 32768,
        maxOutput: 8192,
      },
      {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Meta Llama 3.1 8B Instruct (Free)",
        contextWindow: 131072,
        maxOutput: 4096,
      },
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct (Free)",
        contextWindow: 32768,
        maxOutput: 4096,
      },
    ],
  },
  {
    id: "nim",
    name: "NVIDIA NIM",
    requiresApiKey: true,
    docsUrl: "https://build.nvidia.com/explore/discover",
    models: [
      {
        id: "meta/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B Instruct",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "meta/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B Instruct",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B Instruct",
        contextWindow: 131072,
        maxOutput: 4096,
      },
      {
        id: "nvidia/llama-3.1-nemotron-70b-instruct",
        name: "Llama 3.1 Nemotron 70B",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "deepseek-ai/deepseek-r1",
        name: "DeepSeek R1",
        contextWindow: 64000,
        maxOutput: 8192,
      },
      {
        id: "qwen/qwen2.5-72b-instruct",
        name: "Qwen 2.5 72B Instruct",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "mistralai/mixtral-8x22b-instruct",
        name: "Mixtral 8x22B Instruct",
        contextWindow: 65536,
        maxOutput: 8192,
      },
      {
        id: "mistralai/mixtral-8x7b-instruct",
        name: "Mixtral 8x7B Instruct",
        contextWindow: 32768,
        maxOutput: 4096,
      },
      {
        id: "mistralai/mistral-large-2-instruct",
        name: "Mistral Large 2",
        contextWindow: 128000,
        maxOutput: 8192,
      },
      {
        id: "microsoft/phi-3.5-mini-instruct",
        name: "Phi-3.5 Mini Instruct",
        contextWindow: 131072,
        maxOutput: 4096,
      },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    requiresApiKey: true,
    docsUrl: "https://console.groq.com/keys",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B Versatile",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill Llama 70B",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        contextWindow: 32768,
        maxOutput: 4096,
      },
      {
        id: "gemma2-9b-it",
        name: "Gemma 2 9B IT",
        contextWindow: 8192,
        maxOutput: 4096,
      },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    requiresApiKey: true,
    docsUrl: "https://console.mistral.ai/api-keys/",
    models: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "mistral-small-latest",
        name: "Mistral Small",
        contextWindow: 32768,
        maxOutput: 8192,
      },
      {
        id: "codestral-latest",
        name: "Codestral",
        contextWindow: 32768,
        maxOutput: 8192,
      },
      {
        id: "ministral-8b-latest",
        name: "Ministral 8B",
        contextWindow: 131072,
        maxOutput: 8192,
      },
      {
        id: "ministral-3b-latest",
        name: "Ministral 3B",
        contextWindow: 131072,
        maxOutput: 4096,
      },
      {
        id: "open-mixtral-8x22b",
        name: "Mixtral 8x22B",
        contextWindow: 65536,
        maxOutput: 8192,
      },
      {
        id: "open-mixtral-8x7b",
        name: "Mixtral 8x7B",
        contextWindow: 32768,
        maxOutput: 4096,
      },
      {
        id: "open-mistral-7b",
        name: "Mistral 7B",
        contextWindow: 32768,
        maxOutput: 4096,
      },
    ],
  },
  {
    id: "custom",
    name: "Custom API",
    requiresApiKey: true,
    docsUrl: "#",
    models: [
      {
        id: "custom-model",
        name: "Custom Model",
        contextWindow: 8192,
        maxOutput: 4096,
      },
    ],
  },
];