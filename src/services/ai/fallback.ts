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
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "cohere/north-mini-code:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "liquid/lfm-2.5-2.6b:free",
    "openrouter/free",
  ],
  gemini: [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
    "minimaxai/minimax-m2.7",
  ],
  nim: [
    "meta/llama-3.3-70b-instruct",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "deepseek-ai/deepseek-v4-flash",
    "qwen/qwen3-next-80b-a3b-instruct",
    "openai/gpt-oss-120b",
    "mistralai/mistral-nemotron",
    "meta/llama-3.1-8b-instruct",
  ],
  mistral: [
    "mistral-small-latest",
    "codestral-latest",
    "open-mistral-7b",
    "open-mixtral-8x7b",
    "mistral-large-latest",
  ],
  custom: [],
};
/* ==========================================================================
 * Self-healing live fallbacks
 * --------------------------------------------------------------------------
 * Static chains above go stale whenever a provider retires models. When the
 * static chain starts failing we query the provider's own catalog API for its
 * CURRENT model ids and append them to the retry queue, so generation keeps
 * working even when every hardcoded id has been decommissioned.
 * ========================================================================== */

const liveFallbackCache = new Map<AIProviderId, { at: number; models: string[] }>();
const LIVE_FALLBACK_TTL_MS = 10 * 60 * 1000;
const LIVE_FALLBACK_LIMIT = 5;

/** Patterns that mark a model as non-generative / unusable for chat. */
const LIVE_EXCLUDE = [
  "guard", "safety", "moderation", "reward", "embed", "rerank", "clip",
  "whisper", "audio", "tts", "speech", "ocr", "diffusion", "riva",
  "parse", "omni", "muse", "prompt-guard", "safeguard", "compound",
  "orpheus", "deplot", "kosmos", "fuyu", "neva", "vila", "usdcode", "pii",
];

/** Per-provider exclusion extras (NIM has many VLM endpoints). */
const PROVIDER_EXCLUDE: Partial<Record<AIProviderId, string[]>> = {
  nim: ["vision", "video"],
  openrouter: ["openrouter/auto"],
};

function isUsableChatModel(id: string, providerId: AIProviderId): boolean {
  const lower = id.toLowerCase();
  const patterns = [...LIVE_EXCLUDE, ...(PROVIDER_EXCLUDE[providerId] || [])];
  return !patterns.some((p) => lower.includes(p));
}
/**
 * Query the provider's own models endpoint for current model ids.
 * OpenRouter + NIM catalogs are public; the rest need the user's key.
 * Returns up to LIVE_FALLBACK_LIMIT ids, or [] on any failure.
 */
async function fetchLiveFallbackModels(
  providerId: AIProviderId,
  apiKey: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const cached = liveFallbackCache.get(providerId);
  if (cached && Date.now() - cached.at < LIVE_FALLBACK_TTL_MS) return cached.models;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    let ids: string[] = [];
    if (providerId === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        ids = (data?.data || [])
          .filter(
            (m: { id: string; pricing?: { prompt?: string; completion?: string } }) =>
              m?.id && (String(m.id).endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0")),
          )
          .map((m: { id: string }) => m.id);
      }
    } else if (providerId === "nim") {
      const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        ids = (data?.data || []).map((m: { id: string }) => m.id);
      }
    } else if (providerId === "groq" && apiKey) {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        ids = (data?.data || []).map((m: { id: string }) => m.id);
      }
    } else if (providerId === "gemini" && apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`,
        { signal: controller.signal },
      );
      if (res.ok) {
        const data = await res.json();
        ids = (data?.models || [])
          .filter((m: { supportedGenerationMethods?: string[] }) =>
            (m.supportedGenerationMethods || []).includes("generateContent"),
          )
          .map((m: { name: string }) => String(m.name || "").replace(/^models\//, ""));
      }
    } else if (providerId === "mistral" && apiKey) {
      const res = await fetch("https://api.mistral.ai/v1/models", {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        ids = (data?.data || [])
          .filter((m: { capabilities?: { completion_chat?: boolean } }) => m?.capabilities?.completion_chat)
          .map((m: { id: string }) => m.id);
      }
    }

    const staticIds = FALLBACK_MODELS[providerId] || [];
    const filtered = ids
      .filter((id) => typeof id === "string" && id.length > 0 && isUsableChatModel(id, providerId))
      // Prefer ids already vetted in the static chain, then new discoveries.
      .sort((a, b) => Number(staticIds.includes(b)) - Number(staticIds.includes(a)))
      .slice(0, LIVE_FALLBACK_LIMIT);

    if (filtered.length > 0) {
      liveFallbackCache.set(providerId, { at: Date.now(), models: filtered });
    }
    return filtered;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}




/** Hard caps that stop the old worst-case of hundreds of sequential calls. */
export const MAX_MODELS_PER_CALL = 8;
export const MAX_PROVIDERS_FANOUT = 4;

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
export function checkStop(limits?: CallLimits): void {
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
  const tried = new Set<string>();
  // Retry queue: static chain first, live catalog models appended lazily
  // when the static chain is failing (self-healing against retired models).
  const queue: string[] = [model, ...fallbackModels.filter((m) => m !== model)].slice(0, maxModels);
  let lastError = "";
  let consecutiveRateLimits = 0;
  let attempts = 0;
  let liveLoaded = false;

  const loadLiveFallbacks = async () => {
    liveLoaded = true;
    const live = await fetchLiveFallbackModels(providerId, apiKey, limits?.signal);
    for (const id of live) {
      if (!tried.has(id)) queue.push(id);
    }
  };

  while (queue.length > 0 && attempts < maxModels) {
    checkStop(limits);
    const currentModel = queue.shift()!;
    if (tried.has(currentModel)) continue;
    tried.add(currentModel);
    attempts++;
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
    // After 3 failed attempts (and again if the queue drains), pull the
    // provider's LIVE model catalog into the retry queue. This is what keeps
    // generation working when a provider retires every hardcoded model id.
    if (!liveLoaded && (attempts >= 3 || queue.length === 0)) {
      await loadLiveFallbacks();
    }
  }
  throw new Error(`All ${attempts} attempted models failed for ${providerId}. Last error: ${lastError}`);
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
  const providerPriority: AIProviderId[] = ["openrouter", "gemini", "groq", "nim", "mistral", "custom"];
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
