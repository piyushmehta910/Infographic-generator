import { AIProviderId } from "@/lib/types";
import { AIProvider, GenerationStoppedError, ProviderHttpError, providerMap } from "./providers";

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

/** Hard caps that stop the old worst-case of hundreds of sequential calls. */
export const MAX_MODELS_PER_CALL = 5;
export const MAX_PROVIDERS_FANOUT = 3;

export interface CallLimits {
  /** Aborts all in-flight provider fetches when fired. */
  signal?: AbortSignal;
  /** Epoch ms; no new attempts start past this point. */
  deadline?: number;
  /** Max models tried per provider per call site. */
  maxModels?: number;
}

/** Backoff before the next attempt after a 429, capped so the deadline rules. */
function backoffDelayMs(consecutiveRateLimits: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) return Math.min(retryAfterMs, 4000);
  return Math.min(1000 * Math.pow(2, Math.max(0, consecutiveRateLimits - 1)), 4000);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}

/**
 * Throw early instead of making doomed calls when the caller aborted or the
 * time budget is exhausted.
 */
function checkStop(limits?: CallLimits): void {
  if (!limits) return;
  if (limits.signal?.aborted) throw new GenerationStoppedError("Generation cancelled.");
  if (limits.deadline && Date.now() >= limits.deadline) {
    throw new GenerationStoppedError("Generation time budget exceeded.");
  }
}

function remainingMs(limits?: CallLimits): number {
  if (!limits?.deadline) return Number.MAX_SAFE_INTEGER;
  return limits.deadline - Date.now();
}

/**
 * Try models sequentially. If one fails, try next. Returns first success.
 * Bounded by `limits.maxModels` (default MAX_MODELS_PER_CALL), the caller's
 * abort signal, and the pipeline deadline.
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
  limits?: CallLimits,
): Promise<string> {
  checkStop(limits);
  const maxModels = limits?.maxModels ?? MAX_MODELS_PER_CALL;
  const fallbackModels = FALLBACK_MODELS[providerId] || [];
  const modelsToTry = [model, ...fallbackModels.filter((m) => m !== model)].slice(0, maxModels);
  let lastError = "";
  let consecutiveRateLimits = 0;
  for (const currentModel of modelsToTry) {
    checkStop(limits);
    try {
      const result = await provider.generate(
        prompt, apiKey, currentModel, temperature, maxTokens, baseUrl, limits?.signal,
      );
      if (result && result.length > 0) return result;
      lastError = "Empty response";
      consecutiveRateLimits = 0;
    } catch (error) {
      if (error instanceof GenerationStoppedError) throw error;
      lastError = error instanceof Error ? error.message : "Unknown error";
      // 429s: brief backoff (Retry-After or exponential, capped at 4s) so we
      // don't hammer a rate-limited provider — but never past the deadline.
      const httpStatus = error instanceof ProviderHttpError ? error.status : undefined;
      if (httpStatus === 429) {
        consecutiveRateLimits += 1;
        const waitMs = backoffDelayMs(consecutiveRateLimits, error instanceof ProviderHttpError ? error.retryAfterMs : undefined);
        if (remainingMs(limits) > waitMs + 6000) {
          await sleep(waitMs, limits?.signal);
        }
      } else {
        consecutiveRateLimits = 0;
        // Auth failures will not fix themselves by trying more models on the
        // same provider with the same key — bail out of the chain immediately.
        if (httpStatus === 401 || httpStatus === 403) break;
      }
    }
  }
  throw new Error(`All ${modelsToTry.length} attempted models failed for ${providerId}. Last error: ${lastError}`);
}

/**
 * Try up to MAX_PROVIDERS_FANOUT other configured providers sequentially.
 * The caller's own provider is skipped: generateWithFallback has already
 * exhausted its model chain before this function gets invoked.
 */
export async function tryAllProviders(
  prompt: string,
  userProviderId: AIProviderId,
  temperature: number,
  maxTokens: number,
  storedProviders: StoredProvider[],
  limits?: CallLimits,
  onSkipProvider?: (pid: AIProviderId, reason: "exhausted") => void,
): Promise<{ text: string; provider: AIProviderId; model: string } | null> {
  const providerPriority: AIProviderId[] = ["openrouter", "nim", "groq", "mistral", "custom"];
  let fanout = 0;
  for (const pid of providerPriority) {
    if (pid === userProviderId) continue;
    if (fanout >= MAX_PROVIDERS_FANOUT) break;
    checkStop(limits);
    const stored = storedProviders.find((p) => p.id === pid);
    if (!stored?.apiKey) continue;
    const prov = providerMap[pid];
    if (!prov) continue;
    fanout += 1;
    const chosenModel = stored.model || FALLBACK_MODELS[pid]?.[0] || "";
    try {
      const text = await generateWithFallback(
        prov,
        prompt,
        stored.apiKey,
        chosenModel,
        temperature,
        maxTokens,
        pid,
        stored.baseUrl,
        limits,
      );
      return { text, provider: pid, model: chosenModel };
    } catch (error) {
      if (error instanceof GenerationStoppedError) throw error;
      onSkipProvider?.(pid, "exhausted");
    }
  }
  return null;
}
