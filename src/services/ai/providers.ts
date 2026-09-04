import { AIProviderId } from "@/lib/types";
import { APP_URL } from "@/lib/site";

export interface AIProvider {
  id: AIProviderId;
  generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string>;
}

export const SYSTEM_PROMPT =
  "You are an expert content analyst, designer, and developer. Follow the 4-phase workflow exactly.";

export const REQUEST_TIMEOUT_MS = 45000;

/**
 * Upstream provider returned a non-OK HTTP response. Carrying the status
 * (and Retry-After when present) lets the pipeline make smart decisions —
 * backoff on 429, instant model switch on 401, etc. — instead of regex-
 * sniffing status codes out of message strings.
 */
export class ProviderHttpError extends Error {
  status: number;
  /** Milliseconds to wait before retrying, parsed from Retry-After. */
  retryAfterMs?: number;
  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "ProviderHttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Thrown when the caller aborted the generation or the time budget ran out. */
export class GenerationStoppedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationStoppedError";
  }
}

/** Cap upstream error bodies so raw provider payloads aren't relayed verbatim. */
async function errorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return `HTTP ${response.status}`;
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, 10000);
  const asDate = Date.parse(raw);
  if (!Number.isNaN(asDate)) return Math.min(Math.max(asDate - Date.now(), 0), 10000);
  return undefined;
}

/**
 * Pull the assistant text out of an OpenAI-compatible response.
 * - Surfaces in-200 error bodies (OpenRouter does this on upstream failures)
 *   as real errors so the fallback chain can react, instead of returning "".
 * - Falls back to reasoning_content/reasoning for reasoning models that leave
 *   `content` empty.
 */
function messageText(data: any, providerLabel: string): string {
  if (data?.error) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || JSON.stringify(data.error).slice(0, 200);
    throw new ProviderHttpError(502, `${providerLabel} upstream error: ${msg}`);
  }
  const msg = data?.choices?.[0]?.message;
  let text = msg?.content ?? "";
  if (Array.isArray(text)) text = text.map((c: any) => c?.text || "").join("");
  if (!text.trim()) text = msg?.reasoning_content || msg?.reasoning || "";
  if (!text.trim()) {
    throw new ProviderHttpError(502, `${providerLabel} returned an empty response`);
  }
  return text;
}

/**
 * Fetch with BOTH a per-request timeout and an optional external abort signal
 * (client cancellation / pipeline deadline). Either source aborts the fetch.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  signal?: AbortSignal,
  deadlineMs?: number,
): Promise<Response> {
  // Never run past the pipeline deadline: trim the per-call timeout to the
  // remaining budget (plus a short last-chance grace) so the TOTAL generation
  // time stays under the serverless execution limit. Without this, a fresh
  // fallback window could push total time past maxDuration and the platform
  // severs the SSE stream mid-generation ("connection dropped").
  const remaining = deadlineMs ? deadlineMs - Date.now() : Number.MAX_SAFE_INTEGER;
  const effective = Math.min(timeoutMs, Math.max(remaining, 0) + 3000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), effective);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

class NIMProviderImpl implements AIProvider {
  id: AIProviderId = "nim";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string> {
    const response = await fetchWithTimeout(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "meta/llama-3.3-70b-instruct",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
      REQUEST_TIMEOUT_MS,
      signal,
      deadlineMs,
    );
    if (!response.ok) throw new ProviderHttpError(response.status, `NVIDIA NIM (${model}): ${(await errorBody(response)).slice(0, 280)}`, parseRetryAfter(response));
    return messageText(await response.json(), `NVIDIA NIM (${model})`);
  }
}

class OpenRouterProviderImpl implements AIProvider {
  id: AIProviderId = "openrouter";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string> {
    const response = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": APP_URL,
          "X-Title": "Infographic Generator",
        },
        body: JSON.stringify({
          model: model || "openrouter/free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
      REQUEST_TIMEOUT_MS,
      signal,
      deadlineMs,
    );
    if (!response.ok) throw new ProviderHttpError(response.status, `OpenRouter (${model}): ${(await errorBody(response)).slice(0, 280)}`, parseRetryAfter(response));
    return messageText(await response.json(), `OpenRouter (${model})`);
  }
}

class GroqProviderImpl implements AIProvider {
  id: AIProviderId = "groq";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string> {
    const isSmallModel = model.includes("8b") || model.includes("20b");
    const reducedMaxTokens = isSmallModel ? Math.min(maxTokens, 4000) : maxTokens;
    const response = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: reducedMaxTokens,
        }),
      },
      REQUEST_TIMEOUT_MS,
      signal,
      deadlineMs,
    );
    if (!response.ok) throw new ProviderHttpError(response.status, `Groq (${model}): ${(await errorBody(response)).slice(0, 280)}`, parseRetryAfter(response));
    return messageText(await response.json(), `Groq (${model})`);
  }
}

class MistralProviderImpl implements AIProvider {
  id: AIProviderId = "mistral";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string> {
    const response = await fetchWithTimeout(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "mistral-large-latest",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
      REQUEST_TIMEOUT_MS,
      signal,
      deadlineMs,
    );
    if (!response.ok) throw new ProviderHttpError(response.status, `Mistral (${model}): ${(await errorBody(response)).slice(0, 280)}`, parseRetryAfter(response));
    return messageText(await response.json(), `Mistral (${model})`);
  }
}

class CustomProviderImpl implements AIProvider {
  id: AIProviderId = "custom";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string,
    signal?: AbortSignal,
    deadlineMs?: number,
  ): Promise<string> {
    const base = (baseUrl || "").replace(/\/$/, "");
    const url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
      REQUEST_TIMEOUT_MS,
      signal,
      deadlineMs,
    );
    if (!response.ok) throw new ProviderHttpError(response.status, `Custom (${model}): ${(await errorBody(response)).slice(0, 280)}`, parseRetryAfter(response));
    return messageText(await response.json(), `Custom (${model})`);
  }
}

export const providerMap: Record<AIProviderId, AIProvider> = {
  openrouter: new OpenRouterProviderImpl(),
  groq: new GroqProviderImpl(),
  nim: new NIMProviderImpl(),
  mistral: new MistralProviderImpl(),
  custom: new CustomProviderImpl(),
};
