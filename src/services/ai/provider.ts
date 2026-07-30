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

async function generateWithRetry(
  provider: AIProvider,
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  maxRetries: number = 3,
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await provider.generate(
        prompt,
        apiKey,
        model,
        temperature,
        maxTokens,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      const isRateLimit =
        errorMessage.includes("rate_limit_exceeded") ||
        errorMessage.includes("Rate limit") ||
        errorMessage.includes("429");

      if (isRateLimit && attempt < maxRetries) {
        // Wait 10 seconds before retrying on rate limit
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok)
      throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-pro"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      },
    );
    if (!response.ok)
      throw new Error(`Gemini API error: ${await response.text()}`);
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok)
      throw new Error(`Claude API error: ${await response.text()}`);
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
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://infographic-generator.vercel.app",
        },
        body: JSON.stringify({
          model: model || "openai/gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      },
    );
    if (!response.ok)
      throw new Error(`OpenRouter API error: ${await response.text()}`);
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
    // Token reduction strategy for rate limits
    const isSmallModel = model.includes("8b") || model.includes("20b");
    const reducedMaxTokens = isSmallModel
      ? Math.min(maxTokens, 4000)
      : maxTokens;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: reducedMaxTokens,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      if (
        errorData.error?.type === "tokens" &&
        errorData.error?.code === "rate_limit_exceeded"
      ) {
        throw new Error(
          `GROQ_RATE_LIMIT: ${errorData.error.message}. Please try a smaller model or reduce your request size.`,
        );
      }
      throw new Error(`Groq API error: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
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
    const response = await fetch("https://api.nvidia.com/v1/nim/inference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: model || "meta/llama3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA NIM API error: ${errorText}`);
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
  nim: new NIMProviderImpl(),
};

// Note: Using 'any' here because AI API responses have dynamic, unpredictable structure
// The JSON is validated at runtime through usage, not at compile time
function extractJSON(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Try to find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Try to find JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error("No JSON found in AI response");
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      throw new Error("Invalid JSON in AI response");
    }
  }

  let jsonStr = jsonMatch[0];

  // Fix common JSON issues from AI responses
  // 1. Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
  // 2. Fix single quotes to double quotes
  jsonStr = jsonStr.replace(/'/g, '"');
  // 3. Remove any text before the first { and after the last }
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace > 0) jsonStr = jsonStr.substring(firstBrace);
  if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) {
    jsonStr = jsonStr.substring(0, lastBrace + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    // Last resort: try to extract key-value pairs manually
    try {
      // Attempt to fix incomplete JSON by finding the last valid structure
      const lines = jsonStr.split("\n");
      const validLines: string[] = [];
      let braceCount = 0;
      let bracketCount = 0;

      for (const line of lines) {
        validLines.push(line);
        for (const char of line) {
          if (char === "{") braceCount++;
          if (char === "}") braceCount--;
          if (char === "[") bracketCount++;
          if (char === "]") bracketCount--;
        }
        // If we've closed all open structures, try parsing what we have
        if (braceCount === 0 && bracketCount === 0 && validLines.length > 1) {
          const partial = validLines.join("\n");
          try {
            return JSON.parse(partial);
          } catch {
            // Continue to next line
          }
        }
      }

      throw parseError;
    } catch {
      throw new Error(
        `Failed to parse JSON from AI response. Response starts with: ${text.substring(0, 200)}...`,
      );
    }
  }
}

function extractHTML(text: string): string {
  let html = text.trim();
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    html = codeBlockMatch[1].trim();
  }
  if (!html.startsWith("<!") && !html.startsWith("<html")) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${html}</body></html>`;
  }
  return html;
}

// Fallback model priorities for each provider (cheapest/most available first)
const FALLBACK_MODELS: Record<string, string[]> = {
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
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
  ],
  gemini: [
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
  ],
  claude: [
    "claude-3-haiku-20240307",
    "claude-3-5-sonnet-20241022",
  ],
  groq: [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
  ],
};

/**
 * Try to call a provider with multiple model fallbacks.
 * If one model fails due to credits/rates, try the next one.
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
  // Build the list of models to try: user's model first, then fallbacks
  const fallbackModels = FALLBACK_MODELS[providerId] || [];
  const modelsToTry = [
    model,
    ...fallbackModels.filter((m) => m !== model),
  ].slice(0, 5); // Try up to 5 models

  let lastError: string = "";

  for (const currentModel of modelsToTry) {
    try {
      return await provider.generate(
        prompt,
        apiKey,
        currentModel,
        temperature,
        maxTokens,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      lastError = msg;

      // Only fallback on credit/rate-limit/402 errors
      const isFallbackError =
        msg.includes("402") ||
        msg.includes("credits") ||
        msg.includes("rate_limit") ||
        msg.includes("429") ||
        msg.includes("insufficient_quota") ||
        msg.includes("insufficient credits");

      if (!isFallbackError) {
        // Non-recoverable error - throw immediately
        throw error;
      }
      // Otherwise continue to next model
    }
  }

  // All fallbacks failed - throw a helpful message
  throw new Error(
    `All models failed. Last error: ${lastError}. Try adding credits to your provider or switching to a different provider.`,
  );
}

/**
 * Try multiple providers in sequence until one works.
 * Returns null if all providers fail.
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
  // 1. Try user's configured provider with fallback models
  const userProvider = providerMap[userProviderId];
  if (userProvider && userApiKey) {
    try {
      const text = await generateWithFallback(
        userProvider,
        prompt,
        userApiKey,
        userModel,
        temperature,
        maxTokens,
        userProviderId,
      );
      return { text, provider: userProviderId, model: userModel };
    } catch { /* Continue to other providers */ }
  }

  // 2. Try other providers that have API keys configured
  const providerPriority: AIProviderId[] = ["openrouter", "openai", "gemini", "groq", "claude"];
  for (const pid of providerPriority) {
    if (pid === userProviderId) continue; // Already tried

    const storedProvider = storedProviders.find((p) => p.id === pid);
    if (!storedProvider?.apiKey) continue;

    const fallbackProvider = providerMap[pid];
    if (!fallbackProvider) continue;

    try {
      const text = await generateWithFallback(
        fallbackProvider,
        prompt,
        storedProvider.apiKey,
        storedProvider.model || FALLBACK_MODELS[pid]?.[0] || "",
        temperature,
        maxTokens,
        pid,
      );
      return { text, provider: pid, model: storedProvider.model };
    } catch { /* Continue to next provider */ }
  }

  return null; // All providers failed
}

/**
 * Main pipeline: Content Analysis -> Design Blueprint -> HTML Generation
 * Automatically falls back between models and providers on failure.
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

  if (
    request.inputType === "design" ||
    request.inputType === "text" ||
    request.inputType === "idea" ||
    request.inputType === "image" ||
    request.inputType === "image-url"
  ) {
    if (!apiKey || apiKey.trim() === "") {
      // Try local generation if no API key
      return generateLocalContent(request, providerId, model, startTime);
    }

    const provider = providerMap[providerId];
    if (!provider) {
      return generateLocalContent(request, providerId, model, startTime);
    }

    try {
      // ============================================
      // STEP 1: Content Analysis & Correction
      // ============================================
      const contentPrompt = buildContentAnalysisPrompt(request);
      let contentResponse: string;
      let usedProvider: AIProviderId = providerId;
      let usedModel: string = model;

      try {
        // Try with fallbacks
        contentResponse = await generateWithFallback(
          provider,
          contentPrompt,
          apiKey,
          model,
          0.5,
          Math.min(maxTokens, 1024),
          providerId,
        );
      } catch (primaryError) {
        // If primary fails, try all providers with API keys
        const storedProviders = getStoredProviders?.() || [];
        const fallback = await tryAllProviders(
          contentPrompt,
          apiKey,
          providerId,
          model,
          0.5,
          Math.min(maxTokens, 1024),
          storedProviders as any,
        );
        if (fallback) {
          contentResponse = fallback.text;
          usedProvider = fallback.provider;
          usedModel = fallback.model;
        } else {
          throw primaryError;
        }
      }

      const contentResult = extractJSON(contentResponse);

      // If content is incomplete, return the questions for the user to answer
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
      const blueprintPrompt = buildDesignBlueprintPrompt(
        contentResult.correctedContent,
        request,
      );
      const blueprintResponse = await generateWithFallback(
        providerMap[usedProvider] || provider,
        blueprintPrompt,
        apiKey,
        usedModel,
        0.5,
        Math.min(maxTokens, 2048),
        usedProvider,
      );
      const blueprint = extractJSON(blueprintResponse);

      // ============================================
      // STEP 3: HTML/CSS Generation
      // ============================================
      const htmlPrompt = buildHTMLGenerationPrompt(
        contentResult.correctedContent,
        blueprint,
        request,
      );
      const htmlResponse = await generateWithFallback(
        providerMap[usedProvider] || provider,
        htmlPrompt,
        apiKey,
        usedModel,
        0.5,
        Math.min(maxTokens, 2048),
        usedProvider,
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
        blueprint: blueprint,
        provider: usedProvider,
        model: usedModel,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      // Do NOT silently fall back - return the error so the user knows something went wrong
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate infographic",
        provider: providerId,
        model: model,
        processingTime: Date.now() - startTime,
      };
    }
  }

  // For other modes, use local generation (backward compatibility)
  return generateLocalContent(request, providerId, model, startTime);
}

// Global variable for accessing stored providers (set by dashboard)
let getStoredProviders: (() => { id: AIProviderId; apiKey: string; model: string }[]) | null = null;

export function setStoredProvidersGetter(
  getter: () => { id: AIProviderId; apiKey: string; model: string }[],
) {
  getStoredProviders = getter;
}

/**
 * Revision pipeline: User feedback -> Revised Blueprint -> New HTML
 */
export async function reviseDesign(
  currentHtml: string,
  currentBlueprint: any,
  content: any,
  userFeedback: string,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  temperature: number = 0.4,
  maxTokens: number = 4096,
): Promise<AIGenerationResult> {
  const startTime = Date.now();

  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      error: "API key required for revision",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }

  const provider = providerMap[providerId];
  if (!provider) {
    return {
      success: false,
      error: `Unknown AI provider: ${providerId}`,
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }

  try {
    // Revise blueprint based on feedback
    const revisionPrompt = buildDesignRevisionPrompt(
      currentBlueprint,
      userFeedback,
      content,
    );
    const revisionResponse = await provider.generate(
      revisionPrompt,
      apiKey,
      model,
      temperature,
      2048,
    );
    const revisedBlueprint = extractJSON(revisionResponse);

    // Generate new HTML from revised blueprint
    // We need to create a request object for the HTML generation
    const request: AIGenerationRequest = {
      input: "",
      inputType: "design",
      aspectRatio: "1:1",
    };

    const htmlPrompt = buildHTMLGenerationPrompt(
      content,
      revisedBlueprint,
      request,
    );
    const htmlResponse = await provider.generate(
      htmlPrompt,
      apiKey,
      model,
      0.2,
      maxTokens,
    );
    const html = extractHTML(htmlResponse);

    return {
      success: true,
      content,
      generatedHtml: html,
      blueprint: revisedBlueprint,
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revise design",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Local fallback content generation (no API key required)
 */
function generateLocalContent(
  request: AIGenerationRequest,
  providerId: AIProviderId,
  model: string,
  startTime: number,
): AIGenerationResult {
  const sentences = request.input
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 5);
  const words = request.input.split(/\s+/).filter((w) => w.length > 0);

  const title = sentences[0]?.trim().substring(0, 80) || "Your Infographic";

  const sections: InfographicContent["sections"] = sentences
    .slice(0, 4)
    .map((s, i) => ({
      id: `section-${i}`,
      title: `Key Point ${i + 1}`,
      content: s.trim().substring(0, 300),
      bullets: [],
      icon: ["📊", "📈", "💡", "🎯"][i],
      type: "text" as const,
    }));

  const stats = request.input.match(/\d+[%]?/g);
  const statistics: InfographicContent["statistics"] = stats
    ? stats.slice(0, 4).map((num, i) => ({
        id: `stat-${i}`,
        value: num,
        label: ["Growth", "Impact", "Reach", "Rate"][i] || `Metric ${i + 1}`,
        prefix: "",
        suffix: num.includes("%") ? "" : "%",
      }))
    : [
        {
          id: "stat-1",
          value: "95%",
          label: "Effectiveness",
          prefix: "",
          suffix: "",
        },
        {
          id: "stat-2",
          value: "3x",
          label: "Improvement",
          prefix: "",
          suffix: "",
        },
        { id: "stat-3", value: "50M+", label: "Users", prefix: "", suffix: "" },
      ];

  const content: InfographicContent = {
    title,
    subtitle: `${words.length} words analyzed | ${sections.length} key insights`,
    sections,
    statistics,
    timeline: [],
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
    icons: ["📊", "📈", "💡", "🎯"],
    callToAction: "Get Started Today →",
  };

  return {
    success: true,
    content,
    provider: "local" as AIProviderId,
    model: "local-generator",
    processingTime: Date.now() - startTime,
  };
}

export async function analyzeImage(
  imageData: string,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
): Promise<any> {
  const provider = providerMap[providerId];
  if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);
  const prompt = buildImageAnalysisPrompt(imageData);
  const response = await provider.generate(prompt, apiKey, model, 0.3, 1024);
  return extractJSON(response);
}

/**
 * Direct HTML generation from content + blueprint (skips content analysis)
 * Used when user approves a blueprint after content analysis
 */
export async function generateHTMLFromBlueprint(
  content: any,
  blueprint: any,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
  aspectRatio: string = "1:1",
  maxTokens: number = 4096,
): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      error: "API key required for HTML generation",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return {
      success: false,
      error: `Unknown AI provider: ${providerId}`,
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
  try {
    const request: AIGenerationRequest = {
      input: "",
      inputType: "design",
      aspectRatio: aspectRatio as any,
    };
    const htmlPrompt = buildHTMLGenerationPrompt(content, blueprint, request);
    const htmlResponse = await provider.generate(
      htmlPrompt,
      apiKey,
      model,
      0.2,
      maxTokens,
    );
    const html = extractHTML(htmlResponse);
    return {
      success: true,
      content,
      generatedHtml: html,
      blueprint,
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate HTML from blueprint",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Direct design blueprint generation from already-analyzed content
 * Used when content has been analyzed and we need a fresh blueprint
 */
export async function generateBlueprintFromContent(
  content: any,
  request: AIGenerationRequest,
  apiKey: string,
  providerId: AIProviderId,
  model: string,
): Promise<AIGenerationResult> {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      error: "API key required for blueprint generation",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return {
      success: false,
      error: `Unknown AI provider: ${providerId}`,
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
  try {
    const blueprintPrompt = buildDesignBlueprintPrompt(content, request);
    const blueprintResponse = await provider.generate(
      blueprintPrompt,
      apiKey,
      model,
      0.4,
      2048,
    );
    const blueprint = extractJSON(blueprintResponse);
    return {
      success: true,
      content,
      blueprint,
      provider: providerId,
      model,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate blueprint",
      provider: providerId,
      processingTime: Date.now() - startTime,
    };
  }
}

// Re-export for backward compatibility
export {
  buildContentAnalysisPrompt,
  buildDesignBlueprintPrompt,
  buildHTMLGenerationPrompt,
  buildDesignRevisionPrompt,
} from "./promptBuilder";
