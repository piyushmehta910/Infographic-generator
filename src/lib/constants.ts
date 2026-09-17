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
        id: "google/gemini-3.8-flash:free",
        name: "Google Gemini 3.8 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Google's most intelligent Flash model via OpenRouter, 1M context.",
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
        id: "gemini-3.8-flash",
        name: "Gemini 3.8 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Google's most intelligent Flash model — long-horizon reasoning, 1M context.",
      },
      {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Previous-gen Flash for complex coding and reliable multi-step execution.",
      },
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Balanced speed and multimodal capability for everyday generation.",
      },
      {
        id: "gemini-3.5-flash",
        name: "Gemini 3.5 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Legacy Flash model with baseline speed for high-throughput workloads.",
      },
      {
        id: "gemini-3.5-flash-lite",
        name: "Gemini 3.5 Flash-Lite (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Fastest, most cost-effective 3.5 model for lightweight tasks.",
      },
      {
        id: "gemini-flash-latest",
        name: "Gemini Flash Latest (Auto-Updating)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Alias that always points to the newest stable Flash release — never goes stale.",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Proven high-speed workhorse with generous free-tier limits and 1M context.",
      },
      {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash-Lite (Free Tier)",
        contextWindow: 1048576,
        maxOutput: 8192,
        isFree: true,
        description: "Cost-efficient lightweight model with rapid inference and structured outputs.",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro (Free Tier — Limited)",
        contextWindow: 2097152,
        maxOutput: 8192,
        isFree: true,
        description: "Heavy reasoning model with 2M context; tighter free-tier daily limits.",
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
        description: "Meta's flagship 70B instruct model — best all-round quality on NIM.",
      },
      {
        id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        name: "Llama 3.3 Nemotron Super 49B v1.5 (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA-tuned 49B with strong instruction following and reasoning.",
      },
      {
        id: "nvidia/nemotron-3-super-120b-a12b",
        name: "Nemotron 3 Super 120B MoE (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA's 120B sparse MoE for high-capability generation.",
      },
      {
        id: "nvidia/nemotron-3.5-lightning-30b-a3b",
        name: "Nemotron 3.5 Lightning 30B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Ultra-fast MoE tuned for responsive code & layout generation.",
      },
      {
        id: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
        name: "Llama 3.1 Nemotron Ultra 253B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "NVIDIA's largest Nemotron — maximum reasoning depth.",
      },
      {
        id: "nvidia/nemotron-nano-9b-v2",
        name: "Nemotron Nano 9B v2 (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Compact 9B for low-latency requests on free credits.",
      },
      {
        id: "deepseek-ai/deepseek-v4-flash",
        name: "DeepSeek V4 Flash (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Fast DeepSeek generation, great at structured HTML output.",
      },
      {
        id: "qwen/qwen3-next-80b-a3b-instruct",
        name: "Qwen3 Next 80B A3B Instruct (Free Tier)",
        contextWindow: 262144,
        maxOutput: 8192,
        isFree: true,
        description: "Alibaba's MoE instruct model for coding and composition.",
      },
      {
        id: "qwen/qwq-32b",
        name: "QwQ 32B Reasoning (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "Reasoning-first Qwen model; thorough but slower.",
      },
      {
        id: "qwen/qwen2.5-coder-32b-instruct",
        name: "Qwen 2.5 Coder 32B (Free Tier)",
        contextWindow: 32768,
        maxOutput: 8192,
        isFree: true,
        description: "Purpose-built coding model for single-file HTML/CSS.",
      },
      {
        id: "mistralai/mistral-nemotron",
        name: "Mistral Nemotron (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Mistral architecture accelerated on NVIDIA GPUs.",
      },
      {
        id: "mistralai/mixtral-8x22b-instruct",
        name: "Mixtral 8x22B Instruct (Free Tier)",
        contextWindow: 65536,
        maxOutput: 8192,
        isFree: true,
        description: "Sparse 8-expert MoE for creative composition.",
      },
      {
        id: "moonshotai/kimi-k2-instruct",
        name: "Kimi K2 Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "Moonshot's trillion-parameter MoE, strong at long context.",
      },
      {
        id: "openai/gpt-oss-120b",
        name: "GPT-OSS 120B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "OpenAI's open-weight 120B model.",
      },
      {
        id: "openai/gpt-oss-20b",
        name: "GPT-OSS 20B (Free Tier)",
        contextWindow: 131072,
        maxOutput: 8192,
        isFree: true,
        description: "OpenAI's open-weight 20B model — fast and capable.",
      },
      {
        id: "microsoft/phi-4-mini-instruct",
        name: "Phi-4 Mini Instruct (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Compact Microsoft model with strong reasoning-per-parameter.",
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
        id: "google/gemma-3-12b-it",
        name: "Gemma 3 12B IT (Free Tier)",
        contextWindow: 131072,
        maxOutput: 4096,
        isFree: true,
        description: "Google's lightweight model for structured instructions.",
      },
      {
        id: "google/gemma-4-31b-it",
        name: "Gemma 4 31B IT (Free Tier)",
        contextWindow: 262144,
        maxOutput: 8192,
        isFree: true,
        description: "Google's 31B instruction model with 262k context window.",
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