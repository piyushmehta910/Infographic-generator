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
  "You are an expert content analyst, designer, and developer. Follow the 3-step workflow exactly.";

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

class OpenAIProviderImpl implements AIProvider {
  id: AIProviderId = "openai";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
    );
    if (!response.ok) throw new Error(`OpenAI (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

class GeminiProviderImpl implements AIProvider {
  id: AIProviderId = "gemini";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-pro"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
            },
          ],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

class ClaudeProviderImpl implements AIProvider {
  id: AIProviderId = "claude";
  async generate(
    prompt: string,
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        temperature,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`Claude (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.content?.[0]?.text || "";
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

export const providerMap: Record<AIProviderId, AIProvider> = {
  openai: new OpenAIProviderImpl(),
  gemini: new GeminiProviderImpl(),
  claude: new ClaudeProviderImpl(),
  openrouter: new OpenRouterProviderImpl(),
  groq: new GroqProviderImpl(),
};