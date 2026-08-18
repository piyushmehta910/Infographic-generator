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
  ): Promise<string>;
}

export const SYSTEM_PROMPT =
  "You are an expert content analyst, designer, and developer. Follow the 4-phase workflow exactly.";

export const REQUEST_TIMEOUT_MS = 30000;

// Helper: fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
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
    );
    if (!response.ok) throw new Error(`NVIDIA NIM (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
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
  ): Promise<string> {
    const response = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": APP_URL,
        },
        body: JSON.stringify({
          model: model || "openrouter/auto",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
    );
    if (!response.ok) throw new Error(`OpenRouter (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
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
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq (${model}): ${errorText}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
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
    );
    if (!response.ok) throw new Error(`Mistral (${model}): ${await response.text()}`);
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    const content = Array.isArray(raw)
      ? raw.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
      : raw || "";
    return content;
  }
}

export const providerMap: Record<AIProviderId, AIProvider> = {
  openrouter: new OpenRouterProviderImpl(),
  groq: new GroqProviderImpl(),
  nim: new NIMProviderImpl(),
  mistral: new MistralProviderImpl(),
};