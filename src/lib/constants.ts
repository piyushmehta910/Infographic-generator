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
        id: "openrouter/free",
        name: "OpenRouter Auto Free (Best Free Model)",
        contextWindow: 128000,
        maxOutput: 8192,
        isFree: true,
        description: "Intelligently routes to the highest-capacity free model available right now.",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Meta Llama 3.3 70B Instruct (Free)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Top-tier open-weights model, excellent at content analysis and complex CSS layout.",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Google Gemini 2.0 Flash Exp (Free)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Ultra-fast generation with massive 1M context window and strong code synthesis.",
      },
      {
        id: "qwen/qwen-2.5-coder-32b-instruct:free",
        name: "Qwen 2.5 Coder 32B (Free)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "Specialized coding powerhouse designed specifically for pristine HTML/CSS output.",
      },
      {
        id: "deepseek/deepseek-chat:free",
        name: "DeepSeek V3 (Free)",
        contextWindow: 64000,
        maxOutput: 8192,
        isFree: true,
        description: "State-of-the-art general intelligence with creative styling and clean JSON handling.",
      },
      {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1 (Free)",
        contextWindow: 64000,
        maxOutput: 8192,
        isFree: true,
        description: "Reasoning model that excels at deep structural planning and statistical breakdown.",
      },
      {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Meta Llama 3.1 8B Instruct (Free)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Lightweight, rapid response time, great for fast iterations.",
      },
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct (Free)",
        contextWindow: 32768,
        maxOutput: 4096,
        isFree: true,
        description: "Efficient French AI model with punchy, crisp content summarization.",
      },
      {
        id: "openrouter/auto",
        name: "OpenRouter Auto (Paid Tier)",
        contextWindow: 128000,
        maxOutput: 8192,
        isFree: false,
        description: "Routes across all paid models (requires credits on your account).",
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
        name: "Llama 3.3 70B Versatile (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Blazing fast LPU inference with powerful 70B parameter reasoning.",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Sub-second lightning generation with generous free daily limits.",
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill 70B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Reasoning distilled into Llama 70B, running at 300+ tokens/second.",
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 4096,
        isFree: true,
        description: "MoE architecture providing robust multilingual data formatting.",
      },
      {
        id: "gemma2-9b-it",
        name: "Gemma 2 9B IT (Free Tier)",
        contextWindow: 8192,
        maxOutput: 4096,
        isFree: true,
        description: "Google's lightweight model optimized for high quality layout instructions.",
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
        name: "Llama 3.3 70B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA enterprise acceleration with free 1,000 credit starter pack.",
      },
      {
        id: "meta/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "High accuracy design generation running on NVIDIA DGX Cloud.",
      },
      {
        id: "meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Ultra-fast low-latency endpoint on NIM.",
      },
      {
        id: "nvidia/llama-3.1-nemotron-70b-instruct",
        name: "Llama 3.1 Nemotron 70B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA's customized reward-aligned model for highest instruction following.",
      },
      {
        id: "deepseek-ai/deepseek-r1",
        name: "DeepSeek R1 (Free Tier)",
        contextWindow: 64000,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA-hosted DeepSeek R1 reasoning engine.",
      },
      {
        id: "qwen/qwen2.5-72b-instruct",
        name: "Qwen 2.5 72B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Massive 72B code & mathematics model running on NVIDIA GPUs.",
      },
      {
        id: "microsoft/phi-3.5-mini-instruct",
        name: "Phi-3.5 Mini Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Compact 3.8B model with exceptional reasoning-per-parameter ratio.",
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
        id: "mistral-small-latest",
        name: "Mistral Small (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "High speed, cost-free experimental tier from Mistral AI.",
      },
      {
        id: "codestral-latest",
        name: "Codestral (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "State-of-the-art coding model for single-file HTML & CSS design.",
      },
      {
        id: "open-mistral-7b",
        name: "Open Mistral 7B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 4096,
        isFree: true,
        description: "Foundational open-source model with free API access.",
      },
      {
        id: "open-mixtral-8x7b",
        name: "Open Mixtral 8x7B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 4096,
        isFree: true,
        description: "8-expert sparse architecture for creative composition.",
      },
      {
        id: "mistral-large-latest",
        name: "Mistral Large (Paid Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: false,
        description: "Flagship Mistral model with top-tier reasoning capabilities.",
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
        isFree: true,
      },
    ],
  },
];