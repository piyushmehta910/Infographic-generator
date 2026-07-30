import {
  AIProviderId,
  InfographicContent,
  AIGenerationRequest,
  AIGenerationResult,
} from "@/lib/types";
import {
  buildContentAnalysisPrompt,
  buildDesignBlueprintPrompt,
  buildHTMLGenerationPrompt,
  buildDesignRevisionPrompt,
  buildImageAnalysisPrompt,
} from "./promptBuilder";

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

class OpenAIProviderImpl implements AIProvider {
  id: AIProviderId = "openai";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || "gpt-4o", messages: [{ role: "user", content: prompt }], temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }
}

class GeminiProviderImpl implements AIProvider {
  id: AIProviderId = "gemini";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-pro"}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature, maxOutputTokens: maxTokens } }),
    });
    if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

class ClaudeProviderImpl implements AIProvider {
  id: AIProviderId = "claude";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: model || "claude-3-5-sonnet-20241022", max_tokens: maxTokens, temperature, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) throw new Error(`Claude error: ${await response.text()}`);
    const data = await response.json();
    return data.content?.[0]?.text || "";
  }
}

class OpenRouterProviderImpl implements AIProvider {
  id: AIProviderId = "openrouter";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "https://infographic-generator.vercel.app" },
      body: JSON.stringify({ model: model || "openai/gpt-4o", messages: [{ role: "user", content: prompt }], temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) throw new Error(`OpenRouter error: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

class GroqProviderImpl implements AIProvider {
  id: AIProviderId = "groq";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const isSmallModel = model.includes("8b") || model.includes("20b");
    const reducedMaxTokens = isSmallModel ? Math.min(maxTokens, 4000) : maxTokens;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature, max_tokens: reducedMaxTokens }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.type === "tokens" && errorData.error?.code === "rate_limit_exceeded") {
          throw new Error(`GROQ_RATE_LIMIT: ${errorData.error.message}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("GROQ_RATE_LIMIT")) throw e;
      }
      throw new Error(`Groq error: ${errorText}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

const providerMap: Record<string, AIProvider> = {
  openai: new OpenAIProviderImpl(),
  gemini: new GeminiProviderImpl(),
  claude: new ClaudeProviderImpl(),
  openrouter: new OpenRouterProviderImpl(),
  groq: new GroqProviderImpl(),
};

function extractJSON(text: string): any {
  let cleaned = text.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  let jsonStr = jsonMatch[0];
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
  jsonStr = jsonStr.replace(/'/g, '"');
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace > 0) jsonStr = jsonStr.substring(firstBrace);
  if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) jsonStr = jsonStr.substring(0, lastBrace + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse JSON. Response starts: ${text.substring(0, 200)}...`);
  }
}

function extractHTML(text: string): string {
  let html = text.trim();
  
  // Remove markdown code blocks
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) html = codeBlockMatch[1].trim();
  
  // If it doesn't have HTML structure, wrap it
  if (!html.startsWith("<!") && !html.startsWith("<html") && !html.startsWith("<div") && !html.startsWith("<section")) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${html}</body></html>`;
  }
  
  // Ensure it has DOCTYPE
  if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<!doctype")) {
    html = `<!DOCTYPE html>\n${html}`;
  }
  
  return html;
}

const FALLBACK_MODELS: Record<string, string[]> = {
  openrouter: ["openrouter/free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "qwen/qwen3-next-80b-a3b-instruct:free", "nvidia/nemotron-nano-9b-v2:free", "poolside/laguna-xs-2.1:free", "openai/gpt-4o-mini", "google/gemini-1.5-flash"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  gemini: ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"],
  claude: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022"],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
};

/**
 * Try models SEQUENTIALLY - one at a time, until one works.
 * This is more reliable than parallel as it avoids rate limits.
 */
async function generateWithFallback(
  provider: AIProvider,
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  providerId: string,
): Promise<string> {
  const fallbackModels = FALLBACK_MODELS[providerId] || [];
  const modelsToTry = [model, ...fallbackModels.filter((m) => m !== model)];
  let lastError = "";

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Trying ${providerId}/${currentModel}...`);
      const result = await provider.generate(prompt, apiKey, currentModel, temperature, maxTokens);
      if (result && result.length > 0) {
        console.log(`Success with ${providerId}/${currentModel}`);
        return result;
      }
      lastError = "Empty response";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.log(`Failed ${providerId}/${currentModel}: ${lastError.substring(0, 100)}`);
    }
  }
  throw new Error(`All ${modelsToTry.length} models failed for ${providerId}. Last error: ${lastError}`);
}

/**
 * Try ALL providers that have API keys - one at a time, sequentially.
 */
async function tryAllProviders(
  prompt: string,
  userApiKey: string,
  userProviderId: AIProviderId,
  userModel: string,
  temperature: number,
  maxTokens: number,
  storedProviders: { id: AIProviderId; apiKey: string; model: string }[],
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
      console.log(`Provider ${pid} failed, trying next...`);
    }
  }
  return null;
}

// Global variable for accessing stored providers
let getStoredProviders: (() => { id: AIProviderId; apiKey: string; model: string }[]) | null = null;

export function setStoredProvidersGetter(getter: () => { id: AIProviderId; apiKey: string; model: string }[]) {
  getStoredProviders = getter;
}

/**
 * Main pipeline: Content Analysis -> Design Blueprint -> HTML Generation
 */
export async function generateContent(
  request: AIGenerationRequest,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  temperature: number = 0.7,
  maxTokens: number = 4096,
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  if (!apiKey || apiKey.trim() === "") {
    return generateLocalContent(request, providerId, model, startTime);
  }

  const provider = providerMap[providerId];
  if (!provider) {
    return generateLocalContent(request, providerId, model, startTime);
  }

  try {
    // ============================================
    // STEP 1: Content Analysis
    // ============================================
    const contentPrompt = buildContentAnalysisPrompt(request);
    let contentResponse: string;
    let usedProvider: AIProviderId = providerId;
    let usedModel: string = model;

    try {
      contentResponse = await generateWithFallback(provider, contentPrompt, apiKey, model, 0.5, Math.min(maxTokens, 1024), providerId);
    } catch (primaryError) {
      const storedProviders = getStoredProviders?.() || [];
      const fallback = await tryAllProviders(contentPrompt, apiKey, providerId, model, 0.5, Math.min(maxTokens, 1024), storedProviders as any);
      if (fallback) {
        contentResponse = fallback.text;
        usedProvider = fallback.provider;
        usedModel = fallback.model;
      } else {
        throw primaryError;
      }
    }

    const contentResult = extractJSON(contentResponse);

    if (!contentResult.isComplete) {
      return {
        success: false,
        error: "CONTENT_INCOMPLETE",
        content: contentResult,
        provider: usedProvider,
        model: usedModel,
        processingTime: Date.now() - startTime,
      };
    }

    // ============================================
    // STEP 2: Design Blueprint
    // ============================================
    const blueprintPrompt = buildDesignBlueprintPrompt(contentResult.correctedContent, request);
    const blueprintResponse = await generateWithFallback(
      providerMap[usedProvider] || provider, blueprintPrompt, apiKey, usedModel, 0.5, Math.min(maxTokens, 2048), usedProvider,
    );
    const blueprint = extractJSON(blueprintResponse);

    // ============================================
    // STEP 3: HTML/CSS Generation
    // ============================================
    const htmlPrompt = buildHTMLGenerationPrompt(contentResult.correctedContent, blueprint, request);
    const htmlResponse = await generateWithFallback(
      providerMap[usedProvider] || provider, htmlPrompt, apiKey, usedModel, 0.5, Math.min(maxTokens, 2048), usedProvider,
    );
    const html = extractHTML(htmlResponse);

    return {
      success: true,
      content: {
        title: contentResult.correctedContent.title,
        subtitle: contentResult.correctedContent.subtitle,
        sections: contentResult.correctedContent.sections,
        statistics: contentResult.correctedContent.statistics,
        timeline: contentResult.correctedContent.timeline,
        colors: [
          blueprint.colorPalette?.primary || "#3b82f6",
          blueprint.colorPalette?.secondary || "#8b5cf6",
          blueprint.colorPalette?.accent || "#ec4899",
          blueprint.colorPalette?.background || "#ffffff",
          blueprint.colorPalette?.text || "#0f172a",
        ],
        icons: contentResult.correctedContent.suggestedIcons,
        callToAction: contentResult.correctedContent.callToAction,
      },
      generatedHtml: html,
      blueprint,
      provider: usedProvider,
      model: usedModel,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate infographic",
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  }
}

function generateLocalContent(request: AIGenerationRequest, providerId: AIProviderId, model: string, startTime: number): AIGenerationResult {
  const sentences = request.input.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const words = request.input.split(/\s+/).filter((w) => w.length > 0);
  const title = sentences[0]?.trim().substring(0, 80) || "Your Infographic";
  const sections: InfographicContent["sections"] = sentences.slice(0, 4).map((s, i) => ({
    id: `section-${i}`, title: `Key Point ${i + 1}`, content: s.trim().substring(0, 300), bullets: [], icon: ["📊", "📈", "💡", "🎯"][i], type: "text" as const,
  }));
  const stats = request.input.match(/\d+[%]?/g);
  const statistics: InfographicContent["statistics"] = stats
    ? stats.slice(0, 4).map((num, i) => ({ id: `stat-${i}`, value: num, label: ["Growth", "Impact", "Reach", "Rate"][i] || `Metric ${i + 1}`, prefix: "", suffix: num.includes("%") ? "" : "%" }))
    : [{ id: "stat-1", value: "95%", label: "Effectiveness", prefix: "", suffix: "" }, { id: "stat-2", value: "3x", label: "Improvement", prefix: "", suffix: "" }, { id: "stat-3", value: "50M+", label: "Users", prefix: "", suffix: "" }];
  const content: InfographicContent = { title, subtitle: `${words.length} words analyzed | ${sections.length} key insights`, sections, statistics, timeline: [], colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"], icons: ["📊", "📈", "💡", "🎯"], callToAction: "Get Started Today →" };
  return { success: true, content, provider: "local" as AIProviderId, model: "local-generator", processingTime: Date.now() - startTime };
}

export async function analyzeImage(imageData: string, apiKey: string, providerId: AIProviderId, model: string): Promise<any> {
  const provider = providerMap[providerId];
  if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);
  const prompt = buildImageAnalysisPrompt(imageData);
  const response = await provider.generate(prompt, apiKey, model, 0.3, 1024);
  return extractJSON(response);
}

export async function generateHTMLFromBlueprint(content: any, blueprint: any, apiKey: string, providerId: AIProviderId, model: string, aspectRatio: string = "1:1", maxTokens: number = 4096): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === "") return { success: false, error: "API key required", provider: providerId, processingTime: Date.now() - startTime };
  const provider = providerMap[providerId];
  if (!provider) return { success: false, error: `Unknown provider: ${providerId}`, provider: providerId, processingTime: Date.now() - startTime };
  try {
    const request: AIGenerationRequest = { input: "", inputType: "design", aspectRatio: aspectRatio as any };
    const htmlPrompt = buildHTMLGenerationPrompt(content, blueprint, request);
    const htmlResponse = await provider.generate(htmlPrompt, apiKey, model, 0.2, maxTokens);
    const html = extractHTML(htmlResponse);
    return { success: true, content, generatedHtml: html, blueprint, provider: providerId, model, processingTime: Date.now() - startTime };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed", provider: providerId, processingTime: Date.now() - startTime };
  }
}

export async function generateBlueprintFromContent(content: any, request: AIGenerationRequest, apiKey: string, providerId: AIProviderId, model: string): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === "") return { success: false, error: "API key required", provider: providerId, processingTime: Date.now() - startTime };
  const provider = providerMap[providerId];
  if (!provider) return { success: false, error: `Unknown provider: ${providerId}`, provider: providerId, processingTime: Date.now() - startTime };
  try {
    const blueprintPrompt = buildDesignBlueprintPrompt(content, request);
    const blueprintResponse = await provider.generate(blueprintPrompt, apiKey, model, 0.4, 2048);
    const blueprint = extractJSON(blueprintResponse);
    return { success: true, content, blueprint, provider: providerId, model, processingTime: Date.now() - startTime };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed", provider: providerId, processingTime: Date.now() - startTime };
  }
}

export { buildContentAnalysisPrompt, buildDesignBlueprintPrompt, buildHTMLGenerationPrompt, buildDesignRevisionPrompt } from "./promptBuilder";