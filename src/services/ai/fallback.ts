import { AIProviderId } from "@/lib/types";
import { AIProvider, providerMap } from "./providers";

export interface StoredProvider {
  id: AIProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const FALLBACK_MODELS: Record<AIProviderId, string[]> = {
  openrouter: [
    "openrouter/free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning-30b-a3b:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "poolside/laguna-s-2.1:free",
    "poolside/laguna-xs-2.1:free",
    "cohere/north-mini-code:free",
    "dots-studio/dots3-note-preview:free",
    "nvidia/nemotron-nano-9b-v2:free",
  ],
  groq: [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3-32b",
    "groq/compound",
  ],
  nim: [
    "meta/llama-3.3-70b-instruct",
    "nvidia/nemotron-3-ultra-550b-a55b",
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3-next-80b-a3b-instruct",
    "moonshotai/kimi-k2-instruct",
    "deepseek-ai/deepseek-v4-flash",
    "deepseek-ai/deepseek-v4-pro",
    "moonshotai/kimi-k2-thinking",
    "qwen/qwen3-coder-480b-a35b-instruct",
    "z-ai/glm5.1",
    "mistralai/mistral-nemotron",
    "mistralai/mixtral-8x22b-instruct",
    "mistralai/mixtral-8x7b-instruct",
    "meta/llama-3.1-8b-instruct",
    "microsoft/phi-4-mini-instruct",
    "nvidia/nvidia-nemotron-nano-9b-v2",
    "nvidia/nemotron-mini-4b-instruct",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-small-latest",
    "ministral-8b-latest",
    "open-mixtral-8x22b",
    "open-mixtral-8x7b",
    "open-mistral-7b",
    "codestral-latest",
  ],
  custom: [],
};

/**
 * Try models sequentially. If one fails, try next. Returns first success.
 */
export async function generateWithFallback(
  provider: AIProvider,
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  providerId: AIProviderId,
  baseUrl?: string,
): Promise<string> {
  const fallbackModels = FALLBACK_MODELS[providerId] || [];
  const modelsToTry = [model, ...fallbackModels.filter((m) => m !== model)];
  let lastError = "";
  for (const currentModel of modelsToTry) {
    try {
      const result = await provider.generate(prompt, apiKey, currentModel, temperature, maxTokens, baseUrl);
      if (result && result.length > 0) return result;
      lastError = "Empty response";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
    }
  }
  throw new Error(`All ${modelsToTry.length} models failed for ${providerId}. Last error: ${lastError}`);
}

/**
 * Try all OTHER configured providers sequentially.
 * The caller's own provider is skipped: generateWithFallback has already
 * exhausted its full model chain before this function gets invoked.
 */
export async function tryAllProviders(
  prompt: string,
  userProviderId: AIProviderId,
  temperature: number,
  maxTokens: number,
  storedProviders: StoredProvider[],
): Promise<{ text: string; provider: AIProviderId; model: string } | null> {
  const providerPriority: AIProviderId[] = ["openrouter", "nim", "groq", "mistral", "custom"];
  for (const pid of providerPriority) {
    if (pid === userProviderId) continue;
    const stored = storedProviders.find((p) => p.id === pid);
    if (!stored?.apiKey) continue;
    const prov = providerMap[pid];
    if (!prov) continue;
    try {
      const text = await generateWithFallback(
        prov,
        prompt,
        stored.apiKey,
        stored.model || FALLBACK_MODELS[pid]?.[0] || "",
        temperature,
        maxTokens,
        pid,
        stored.baseUrl,
      );
      return { text, provider: pid, model: stored.model || FALLBACK_MODELS[pid]?.[0] || "" };
    } catch {
      // try next provider
    }
  }
  return null;
}