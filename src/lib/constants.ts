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
        id: "google/gemma-4-31b-it:free",
        name: "Google Gemma 4 31B (Free — Recommended)",
        contextWindow: 262144,
        maxOutput: 8192,
        isFree: true,
        description: "Google's powerful 31B instruction model with 262k context window and great CSS styling.",
      },
      {
        id: "google/gemma-4-26b-a4b-it:free",
        name: "Google Gemma 4 26B A4B (Free)",
        contextWindow: 262144,
        maxOutput: 8192,
        isFree: true,
        description: "Google's fast MoE architecture for ultra-responsive infographic code generation.",
      },
      {
        id: "nvidia/nemotron-3.5-lightning:free",
        name: "NVIDIA Nemotron 3.5 Lightning (Free)",
        contextWindow: 1000000,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA lightning inference with massive 1M context window and fast throughput.",
      },
      {
        id: "nvidia/nemotron-3-super-120b-a12b:free",
        name: "NVIDIA Nemotron 3 Super 120B (Free)",
        contextWindow: 262144,
        maxOutput: 8192,
        isFree: true,
        description: "120B parameter powerhouse for high quality design systems and layouts.",
      },
      {
        id: "nvidia/nemotron-3-ultra-550b-a55b:free",
        name: "NVIDIA Nemotron 3 Ultra 550B (Free)",
        contextWindow: 1000000,
        maxOutput: 8192,
        isFree: true,
        description: "Ultra-scale 550B flagship model for deep conceptual planning and data density.",
      },
      {
        id: "minimax/minimax-m3:free",
        name: "MiniMax M3 (Free)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "1M context window model excelling at long-form structured content analysis.",
      },
      {
        id: "cohere/north-mini-code:free",
        name: "Cohere North Mini Code (Free)",
        contextWindow: 256000,
        maxOutput: 8192,
        isFree: true,
        description: "Cohere's dedicated coding model optimized for pristine HTML/CSS syntax.",
      },
      {
        id: "z-ai/glm-5.2:free",
        name: "Z.ai GLM 5.2 (Free)",
        contextWindow: 256000,
        maxOutput: 8192,
        isFree: true,
        description: "High accuracy general intelligence with creative color palette formulation.",
      },
      {
        id: "minimax/minimax-m2.7:free",
        name: "MiniMax M2.7 (Free)",
        contextWindow: 196608,
        maxOutput: 8192,
        isFree: true,
        description: "Fast, reliable multi-language content expansion.",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Meta Llama 3.3 70B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Top-tier open-weights model for content analysis and complex CSS layout.",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Google Gemini 2.0 Flash Exp (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Ultra-fast generation with 1M context window.",
      },
      {
        id: "qwen/qwen-2.5-coder-32b-instruct:free",
        name: "Qwen 2.5 Coder 32B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "Specialized coding model for single-file HTML & CSS design.",
      },
      {
        id: "deepseek/deepseek-chat:free",
        name: "DeepSeek V3 (Free Tier)",
        contextWindow: 64000,
        maxOutput: 8192,
        isFree: true,
        description: "State-of-the-art general intelligence with creative styling.",
      },
      {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1 (Free Tier)",
        contextWindow: 64000,
        maxOutput: 8192,
        isFree: true,
        description: "Deep reasoning model for structural planning.",
      },
      {
        id: "openrouter/auto",
        name: "OpenRouter Auto (Paid Tier)",
        contextWindow: 128000,
        maxOutput: 8192,
        isFree: false,
        description: "Routes across all paid models (requires credits on your OpenRouter account).",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    requiresApiKey: true,
    docsUrl: "https://aistudio.google.com/app/apikey",
    models: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Google's next-gen flagship Flash model. High speed, 1M context, completely free on Google AI Studio.",
      },
      {
        id: "gemini-2.0-flash-lite-preview-02-05",
        name: "Gemini 2.0 Flash Lite (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Cost-efficient lightweight model with rapid inference and robust structured outputs.",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Proven high-speed workhorse model with 1M context window.",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro (Free Tier)",
        contextWindow: 2097152,
        maxOutput: 8192,
        isFree: true,
        description: "Google's heavy reasoning model with industry-leading 2M token context window.",
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
        id: "gemma2-9b-it",
        name: "Gemma 2 9B IT (Free Tier)",
        contextWindow: 8192,
        maxOutput: 4096,
        isFree: true,
        description: "Google's lightweight model optimized for high quality layout instructions.",
      },
      {
        id: "qwen-2.5-32b",
        name: "Qwen 2.5 32B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "High-capability coding and reasoning model on Groq LPU.",
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
        id: "meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Ultra-fast low-latency endpoint on NIM.",
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