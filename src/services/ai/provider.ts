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
  generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string>;
}

// Helper: fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
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
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert content analyst, designer, and developer. Follow the 3-step workflow exactly." },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

class GeminiProviderImpl implements AIProvider {
  id: AIProviderId = "gemini";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-pro"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!response.ok) throw new Error(`Gemini (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

class ClaudeProviderImpl implements AIProvider {
  id: AIProviderId = "claude";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
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
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });
    if (!response.ok) throw new Error(`Claude (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.content?.[0]?.text || "";
  }
}

class OpenRouterProviderImpl implements AIProvider {
  id: AIProviderId = "openrouter";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://infographic-generator.vercel.app",
      },
      body: JSON.stringify({
        model: model || "openrouter/auto",
        messages: [
          { role: "system", content: "You are an expert content analyst, designer, and developer. Follow the 3-step workflow exactly." },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter (${model}): ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

class GroqProviderImpl implements AIProvider {
  id: AIProviderId = "groq";
  async generate(prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
    const isSmallModel = model.includes("8b") || model.includes("20b");
    const reducedMaxTokens = isSmallModel ? Math.min(maxTokens, 4000) : maxTokens;
    const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert content analyst, designer, and developer. Follow the 3-step workflow exactly." },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: reducedMaxTokens,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq (${model}): ${errorText}`);
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
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1").replace(/'/g, '"');
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace > 0) jsonStr = jsonStr.substring(firstBrace);
  if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) jsonStr = jsonStr.substring(0, lastBrace + 1);
  try { return JSON.parse(jsonStr); }
  catch { throw new Error(`Failed to parse JSON. Response: ${text.substring(0, 300)}...`); }
}

function extractHTML(text: string): string {
  let html = text.trim();
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) html = codeBlockMatch[1].trim();
  if (!html.startsWith("<!") && !html.startsWith("<html") && !html.startsWith("<div") && !html.startsWith("<section")) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${html}</body></html>`;
  }
  if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<!doctype")) html = `<!DOCTYPE html>\n${html}`;
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
 * Try models sequentially. If one fails, try next. Returns first success.
 */
async function generateWithFallback(provider: AIProvider, prompt: string, apiKey: string, model: string, temperature: number, maxTokens: number, providerId: string): Promise<string> {
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
 */
async function tryAllProviders(prompt: string, userApiKey: string, userProviderId: AIProviderId, userModel: string, temperature: number, maxTokens: number, storedProviders: { id: AIProviderId; apiKey: string; model: string }[]): Promise<{ text: string; provider: AIProviderId; model: string } | null> {
  const providerPriority: AIProviderId[] = ["openrouter", "openai", "gemini", "groq", "claude"];
  for (const pid of providerPriority) {
    let apiKeyToUse = "", modelToUse = "";
    if (pid === userProviderId) { apiKeyToUse = userApiKey; modelToUse = userModel; }
    else { const stored = storedProviders.find((p) => p.id === pid); if (!stored?.apiKey) continue; apiKeyToUse = stored.apiKey; modelToUse = stored.model || FALLBACK_MODELS[pid]?.[0] || ""; }
    if (!apiKeyToUse) continue;
    const prov = providerMap[pid]; if (!prov) continue;
    try {
      const text = await generateWithFallback(prov, prompt, apiKeyToUse, modelToUse, temperature, maxTokens, pid);
      return { text, provider: pid, model: modelToUse };
    } catch { /* try next provider */ }
  }
  return null;
}

let getStoredProviders: (() => { id: AIProviderId; apiKey: string; model: string }[]) | null = null;
export function setStoredProvidersGetter(getter: () => { id: AIProviderId; apiKey: string; model: string }[]) { getStoredProviders = getter; }

/**
 * MAIN PIPELINE: 3-STEP WORKFLOW
 * 1. Content Analysis & Auto-completion
 * 2. Design Blueprint (AI tells HOW to design it)
 * 3. HTML/CSS Generation (follows blueprint exactly)
 */
export async function generateContent(request: AIGenerationRequest, apiKey: string, providerId: AIProviderId, model: string, temperature: number = 0.7, maxTokens: number = 4096): Promise<AIGenerationResult> {
  const startTime = Date.now();

  // If no API key, use local generation
  if (!apiKey || apiKey.trim() === "") return generateLocalContent(request, providerId, model, startTime);
  const provider = providerMap[providerId];
  if (!provider) return generateLocalContent(request, providerId, model, startTime);

  try {
    // ============================================
    // STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
    // ============================================
    const contentPrompt = buildContentAnalysisPrompt(request);
    let contentResponse: string, usedProvider: AIProviderId = providerId, usedModel: string = model;

      try {
        console.log(`Step 1: Trying ${providerId}/${model}...`);
        contentResponse = await generateWithFallback(provider, contentPrompt, apiKey, model, 0.5, Math.min(maxTokens, 1024), providerId);
        console.log(`Step 1: Success with ${providerId}/${model}`);
      } catch (primaryError) {
        // If user's provider fails, try ALL other configured providers
        const storedProviders = getStoredProviders?.() || [];
        console.log(`Step 1: Primary provider failed, trying fallbacks...`);
        const fallback = await tryAllProviders(contentPrompt, apiKey, providerId, model, 0.5, Math.min(maxTokens, 1024), storedProviders as any);
        if (fallback) { contentResponse = fallback.text; usedProvider = fallback.provider; usedModel = fallback.model; console.log(`Step 1: Fallback success with ${fallback.provider}/${fallback.model}`); }
        else { console.error(`Step 1: All providers failed`); throw primaryError; }
      }

    const contentResult = extractJSON(contentResponse);

    // ============================================
    // STEP 2: DESIGN BLUEPRINT
    // Ask AI how to design this content
    // ============================================
    const blueprintPrompt = buildDesignBlueprintPrompt(contentResult.correctedContent, request);
    let blueprintResponse: string;

    try {
      console.log(`Step 2: Trying ${usedProvider}/${usedModel} for blueprint...`);
      blueprintResponse = await generateWithFallback(providerMap[usedProvider] || provider, blueprintPrompt, apiKey, usedModel, 0.5, Math.min(maxTokens, 2048), usedProvider);
      console.log(`Step 2: Blueprint success with ${usedProvider}/${usedModel}`);
    } catch (blueprintError) {
      // If blueprint fails, create a simple default blueprint
      console.error(`Step 2: Blueprint failed, using default fallback:`, blueprintError);
      const aspectRatio = request.aspectRatio || "1:1";
      const dimensions = aspectRatio === "9:16" ? "1080×1920" : aspectRatio === "16:9" ? "1920×1080" : aspectRatio === "4:5" ? "1080×1350" : "1080×1080";
      blueprintResponse = JSON.stringify({
        designConcept: "Clean modern layout",
        layoutStyle: "magazine-grid",
        heroMoment: "Title with gradient text",
        visualHierarchy: { "1st": "Title", "2nd": "Stats", "3rd": "Sections" },
        sectionCount: 4,
        readingFlow: "Top to bottom",
        spacingSystem: "8px grid",
        colorPalette: { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#ec4899", background: "#ffffff", text: "#0f172a" },
        typography: { headingFont: "Inter", bodyFont: "Inter", headingSize: "48px", bodySize: "16px", headingWeight: "800", subheadingWeight: "600", bodyWeight: "400", style: "modern" },
        icons: { style: "emoji-in-circle", consistency: "ALL icons use same style", perSection: ["📊", "📈", "💡", "🎯"] },
        cardStyle: "Rounded rectangle with shadow",
        spacing: "8px-grid-based",
        alignment: "center",
        statsStyle: "big-numbers",
        decorations: ["Subtle gradient background"],
        background: "Subtle gradient",
        header: "Large title with subtitle",
        cta: "Centered button",
        specialFeatures: "Clean and professional",
        animationHints: ["Hover effects on cards"]
      });
    }

    let blueprint;
    try { blueprint = extractJSON(blueprintResponse); }
    catch { blueprint = {}; }

    // ============================================
    // STEP 3: HTML/CSS GENERATION
    // Generate actual HTML following the blueprint
    // ============================================
    const htmlPrompt = buildHTMLGenerationPrompt(contentResult.correctedContent, blueprint, request);
    let htmlResponse: string;

    try {
      console.log(`Step 3: Trying ${usedProvider}/${usedModel} for HTML generation...`);
      htmlResponse = await generateWithFallback(providerMap[usedProvider] || provider, htmlPrompt, apiKey, usedModel, 0.5, Math.min(maxTokens, 4096), usedProvider);
      console.log(`Step 3: HTML generation success with ${usedProvider}/${usedModel}, length: ${htmlResponse.length}`);
    } catch (htmlError) {
      // If HTML generation fails, use local fallback
      console.error(`Step 3: HTML generation failed:`, htmlError);
      return generateLocalContent(request, providerId, model, startTime);
    }

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
          contentResult.correctedContent.suggestedColors?.primary || "#3b82f6",
          contentResult.correctedContent.suggestedColors?.secondary || "#8b5cf6",
          contentResult.correctedContent.suggestedColors?.accent || "#ec4899",
          contentResult.correctedContent.suggestedColors?.background || "#ffffff",
          contentResult.correctedContent.suggestedColors?.text || "#0f172a",
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
    // Final fallback: local generation with HTML
    console.error("Pipeline failed, using local fallback:", error);
    return generateLocalContent(request, providerId, model, startTime);
  }
}

function generateLocalContent(request: AIGenerationRequest, providerId: AIProviderId, model: string, startTime: number): AIGenerationResult {
  const text = request.input || "Your Infographic";
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const title = sentences[0]?.trim().substring(0, 80) || "Your Infographic";

  const sections = sentences.slice(0, 4).map((s, i) => ({
    id: `section-${i}`, title: `Key Point ${i + 1}`, content: s.trim().substring(0, 300), bullets: [], icon: ["📊", "📈", "💡", "🎯"][i], type: "text" as const,
  }));

  const stats = text.match(/\d+[%]?/g);
  const statistics = stats
    ? stats.slice(0, 4).map((num, i) => ({ id: `stat-${i}`, value: num, label: ["Growth", "Impact", "Reach", "Rate"][i] || `Metric ${i + 1}`, prefix: "", suffix: num.includes("%") ? "" : "%" }))
    : [{ id: "stat-1", value: "95%", label: "Effectiveness", prefix: "", suffix: "" }, { id: "stat-2", value: "3x", label: "Improvement", prefix: "", suffix: "" }, { id: "stat-3", value: "50M+", label: "Users", prefix: "", suffix: "" }];

  const content: InfographicContent = {
    title, subtitle: `${words.length} words | ${sections.length} insights`,
    sections, statistics, timeline: [],
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
    icons: ["📊", "📈", "💡", "🎯"],
    callToAction: "Get Started Today →",
  };

  // Generate simple HTML fallback
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 48px; display: flex; flex-direction: column; gap: 32px; }
    h1 { font-size: 56px; font-weight: 800; background: linear-gradient(90deg, #fff, #e0e7ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
    .subtitle { font-size: 20px; opacity: 0.9; font-weight: 400; }
    .stats { display: flex; gap: 16px; margin-top: 8px; }
    .stat { flex: 1; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.2); }
    .stat-value { font-size: 42px; font-weight: 800; }
    .stat-label { font-size: 14px; opacity: 0.8; margin-top: 8px; }
    .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; }
    .section { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.2); }
    .section h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .section p { font-size: 15px; line-height: 1.6; opacity: 0.9; }
    .cta { margin-top: auto; text-align: center; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 16px; font-size: 18px; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <h1>${title}</h1>
    <p class="subtitle">${content.subtitle}</p>
  </div>
  ${content.statistics.length > 0 ? `<div class="stats">${content.statistics.slice(0, 3).map(s => `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join("")}</div>` : ""}
  ${content.sections.length > 0 ? `<div class="sections">${content.sections.slice(0, 4).map(s => `<div class="section"><h3>${s.icon || ""} ${s.title}</h3><p>${s.content}</p></div>`).join("")}</div>` : ""}
  ${content.callToAction ? `<div class="cta">${content.callToAction}</div>` : ""}
</body>
</html>`;

  return { success: true, content, generatedHtml: html, provider: "local" as AIProviderId, model: "local-generator", processingTime: Date.now() - startTime };
}

export async function analyzeImage(imageData: string, apiKey: string, providerId: AIProviderId, model: string): Promise<any> {
  const provider = providerMap[providerId];
  if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);
  return extractJSON(await provider.generate(buildImageAnalysisPrompt(imageData), apiKey, model, 0.3, 1024));
}

export {
  buildContentAnalysisPrompt,
  buildDesignBlueprintPrompt,
  buildHTMLGenerationPrompt,
  buildDesignRevisionPrompt,
} from "./promptBuilder";