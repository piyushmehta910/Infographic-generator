import { AIProviderId } from "@/lib/types";
import { AIProvider, providerMap } from "./providers";

export interface StoredProvider {
  id: AIProviderId;
  apiKey: string;
  model: string;
}

const FALLBACK_MODELS: Record<AIProviderId, string[]> = {
  openrouter: [
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "poolside/laguna-xs-2.1:free",
    "openai/gpt-4o-mini",
    "google/gemini-1.5-flash",
  ],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  gemini: ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"],
  claude: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022"],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
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
): Promise<string> {
  const fallbackModels = FALLBACK_MODELS[providerId] || [];
  const modelsToTry = [model, ...fallbackModels.filter((m) => m !== model)];
  let lastError = "";
  for (const currentModel of modelsToTry) {
    try {
      const result = await provider.generate(prompt, apiKey, currentModel, temperature, maxTokens);
      if (result && result.length > 0) return result;
      lastError = "Empty response";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
    }
  }
  throw new Error(`All ${modelsToTry.length} models failed for ${providerId}. Last error: ${lastError}`);
}

/**
 * Try all providers that have API keys, sequentially.
 * The provider list is passed in explicitly by the caller (from UI store state).
 */
export async function tryAllProviders(
  prompt: string,
  userApiKey: string,
  userProviderId: AIProviderId,
  userModel: string,
  temperature: number,
  maxTokens: number,
  storedProviders: StoredProvider[],
): Promise<{ text: string; provider: AIProviderId; model: string } | null> {
  const providerPriority: AIProviderId[] = ["openrouter", "openai", "gemini", "groq", "claude"];
  for (const pid of providerPriority) {
    let apiKeyToUse = "";
    let modelToUse = "";
    if (pid === userProviderId) {
      apiKeyToUse = userApiKey;
      modelToUse = userModel;
    } else {
      const stored = storedProviders.find((p) => p.id === pid);
      if (!stored?.apiKey) continue;
      apiKeyToUse = stored.apiKey;
      modelToUse = stored.model || FALLBACK_MODELS[pid]?.[0] || "";
    }
    if (!apiKeyToUse) continue;
    const prov = providerMap[pid];
    if (!prov) continue;
    try {
      const text = await generateWithFallback(prov, prompt, apiKeyToUse, modelToUse, temperature, maxTokens, pid);
      return { text, provider: pid, model: modelToUse };
    } catch {
      // try next provider
    }
  }
  return null;
}