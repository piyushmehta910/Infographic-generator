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
import { validateOutline } from "@/lib/schemas";

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

// ============================================================
// CONTENT NORMALIZATION
// Guarantee the content passed to the designer and HTML generator
// is always complete and non-empty, so the output is never broken.
// ============================================================
function cleanStr(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s || s === "..." || s.toLowerCase().includes("placeholder") || s.toLowerCase() === "tbd" || s.toLowerCase() === "lorem ipsum") return fallback;
  return s;
}

function normalizeContent(cr: any, request: AIGenerationRequest) {
  const src = cr?.correctedContent ?? {};
  const inputTitle = (request.input || "").split(/\s+/).filter(Boolean).slice(0, 8).join(" ") || "Your Infographic";
  const title = cleanStr(src.title, inputTitle);
  const subtitle = cleanStr(src.subtitle, "Key insights, visualized at a glance");

  let sections = Array.isArray(src.sections) ? src.sections : [];
  sections = sections
    .map((s: any, i: number) => ({
      id: s?.id || `section-${i + 1}`,
      title: cleanStr(s?.title, `Insight ${i + 1}`),
      content: cleanStr(s?.content, "High-impact insight backed by clear, concise facts."),
      bullets: Array.isArray(s?.bullets) ? s.bullets.filter((b: unknown) => typeof b === "string" && b.trim()).map((b: unknown) => String(b)) : [],
      icon: cleanStr(s?.icon, ["growth", "spark", "chart", "target"][i % 4]),
      type: (s?.type === "text" || s?.type === "mixed" ? s.type : "mixed") as "text" | "mixed",
    }))
    .filter((s: any) => s.title && s.content)
    .slice(0, 6);

  if (sections.length === 0) {
    sections = [
      { id: "section-1", title: "The Big Picture", content: subtitle, bullets: [], icon: "chart", type: "mixed" as const },
      { id: "section-2", title: "Why It Matters", content: inputTitle, bullets: [], icon: "target", type: "mixed" as const },
      { id: "section-3", title: "Key Takeaways", content: "Actionable points distilled from your source content.", bullets: ["Clear and concise", "Easy to scan", "Ready to share"], icon: "bulb", type: "mixed" as const },
    ];
  }

  let statistics = Array.isArray(src.statistics) ? src.statistics : [];
  statistics = statistics
    .map((s: any, i: number) => ({
      id: s?.id || `stat-${i + 1}`,
      value: cleanStr(s?.value, `${20 - i * 5}%`),
      label: cleanStr(s?.label, `Metric ${i + 1}`),
      icon: cleanStr(s?.icon, "trend"),
    }))
    .filter((s: any) => s.value && s.label)
    .slice(0, 4);

  const timeline = Array.isArray(src.timeline) ? src.timeline.filter((t: any) => t).slice(0, 5) : [];
  const icons =
    Array.isArray(src.suggestedIcons) && src.suggestedIcons.length
      ? src.suggestedIcons.slice(0, 4)
      : sections.map((s: any) => s.icon);
  const suggestedColors =
    src.suggestedColors && typeof src.suggestedColors === "object" ? src.suggestedColors : {};

  return {
    title,
    subtitle,
    sections,
    statistics,
    timeline,
    suggestedIcons: icons,
    suggestedColors,
    callToAction: "",
    language: cleanStr(src.language, "English"),
  };
}

// Resolve the exact px canvas size for a request (used for validation).
function computeCanvasPx(request: AIGenerationRequest): { width: number; height: number } {
  if (request.aspectRatioWidth && request.aspectRatioHeight) {
    return { width: request.aspectRatioWidth, height: request.aspectRatioHeight };
  }
  switch (request.aspectRatio) {
    case "9:16": return { width: 1080, height: 1920 };
    case "16:9": return { width: 1920, height: 1080 };
    case "4:5": return { width: 1080, height: 1350 };
    case "A4-P": return { width: 794, height: 1123 };
    case "A4-L": return { width: 1123, height: 794 };
    case "letter": return { width: 816, height: 1056 };
    default: return { width: 1080, height: 1080 };
  }
}

// Strip ```html ... ``` or ``` ... ``` wrappers (client-side cleanup).
function stripMarkdown(html: string): string {
  return html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// Dependency-free sanitizer: remove scripts, event handlers, and javascript: URLs.
function sanitizeHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s*javascript\s*:\s*/gi, "");
}

// Post-generation validation (see infographic-complete-system-v2.md §8).
function validateInfographicHTML(rawHtml: string, expectedWidth: number, expectedHeight: number) {
  const t = stripMarkdown(rawHtml);
  const checks = {
    hasDoctype: /<!doctype\s+html/i.test(t),
    hasHtmlTag: /<html/i.test(t),
    hasSubstance: t.split(/\s+/).length > 10,
    noPlaceholders: !/lorem ipsum|sample text|your content here|\bplaceholder\b|example stat|dummy data|#todo/i.test(t),
    noMarkdown: !t.includes("```"),
    correctSize: t.includes(`${expectedWidth}px`) && t.includes(`${expectedHeight}px`),
    noExternalImages: !/<img[^>]+src\s*=\s*["']http/i.test(t),
    noScriptTags: !/<script/i.test(t),
    noEventHandlers: !/\son\w+\s*=/i.test(t),
    // NEW: the output must contain REAL visual/CSS design, not plain prose.
    hasStyleBlock: /<style[\s\S]*?<\/style>/i.test(t),
    hasColorAndShape: /(?:#[0-9a-f]{3,8}\b|rgba?\(|hsl\(|(?:background|color)\s*:)/i.test(t) &&
      /(?:border-?radius|box-shadow|padding|margin|grid-template|display\s*:\s*(?:flex|grid)|position\s*:\s*(?:absolute|relative|fixed))/i.test(t),
    hasStructuredLayout: /<(?:div|section|main|article|header|footer|aside|table|ul|ol)\b/i.test(t) &&
      /<(?:h[1-6]|p|span|li|td|th)\b/i.test(t),
  };
  // A valid infographic must be a designed HTML document with styling.
  const critical =
    checks.hasDoctype &&
    checks.hasHtmlTag &&
    checks.noPlaceholders &&
    checks.noMarkdown &&
    checks.hasSubstance &&
    checks.hasStyleBlock &&
    checks.hasColorAndShape &&
    checks.hasStructuredLayout;
  return { pass: critical, checks };
}

// Build a targeted revision prompt from the failing validation checks.
function buildRetrySuffix(checks: Record<string, boolean>, width: number, height: number): string {
  const fixes: string[] = [];
  if (!checks.noPlaceholders)
    fixes.push("The output still contains PLACEHOLDER text (lorem ipsum / sample / example / your content here / etc). Replace ALL of it with real content from the original input.");
  if (!checks.hasDoctype || !checks.hasHtmlTag)
    fixes.push("Return a complete, valid HTML document that starts with <!DOCTYPE html> and contains <html>.");
  if (!checks.noMarkdown)
    fixes.push("No markdown fences or explanations. Output the raw HTML only.");
  if (!checks.correctSize)
    fixes.push(`The outer container MUST be exactly ${width}px x ${height}px with overflow:hidden and nothing clipped or overlapping.`);
  if (!checks.hasSubstance)
    fixes.push("The document appears empty. Include all outline sections and real content.");
  if (!checks.hasStyleBlock || !checks.hasColorAndShape || !checks.hasStructuredLayout) {
    fixes.push(
      "Your previous output was plain prose, NOT a designed infographic. " +
      "Rewrite it as a real visual layout: include a <style> block with actual CSS, " +
      "a non-flat background (gradient/color), styled cards with border-radius & shadow, " +
      "and a grid/flex layout. Structure content with <div>/<section> containers, headings, " +
      "and cards — never a bare wall of <p> paragraphs. Always honor the exact canvas size."
    );
  }
  const base = [
    "",
    "REVISION: Your previous output was rejected by automated validation.",
    ...fixes,
    "Use the design contract's palette, typography, spacing and background verbatim.",
    "Visualize every statistic. No CTA buttons. No emoji icons.",
  ];
  return base.join("\n");
}

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

    let contentResult = extractJSON(contentResponse);

    // ============================================
    // STEP 1.5a: ZOD VALIDATION (single stricter retry)
    // Rejects malformed/placeholder outlines before they reach the designer.
    // ============================================
    const outlineCheck = validateOutline(contentResult);
    if (!outlineCheck.ok) {
      console.warn("Step 1: Outline validation failed, retrying once.", outlineCheck.errors);
      const fixPrompt =
        contentPrompt +
        "\n\nVALIDATION ERROR: " +
        outlineCheck.errors.join("; ") +
        "\nRewrite the outline JSON so every required field is present, non-empty, and contains REAL content derived from the source input (no placeholders, no empty arrays). Return ONLY valid JSON.";
      try {
        const strictContentResponse = await generateWithFallback(
          providerMap[usedProvider] || provider,
          fixPrompt,
          apiKey,
          usedModel,
          0.4,
          Math.min(maxTokens, 1024),
          usedProvider,
        );
        const strictResult = extractJSON(strictContentResponse);
        if (validateOutline(strictResult).ok) {
          contentResult = strictResult;
          console.log("Step 1: Outline retry produced valid JSON.");
        }
      } catch (retryError) {
        console.warn("Step 1: Outline retry failed, continuing with first result.", retryError);
      }
    }

    // ============================================
    // STEP 1.5: NORMALIZE CONTENT
    // Guarantee complete, non-empty content for the designer + HTML.
    // ============================================
    const normalizedContent = normalizeContent(contentResult, request);

    // ============================================
    // STEP 2: DESIGN BLUEPRINT
    // Ask AI how to design this content
    // ============================================
    const blueprintPrompt = buildDesignBlueprintPrompt(normalizedContent, request);
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
    const htmlPrompt = buildHTMLGenerationPrompt(normalizedContent, blueprint, request);
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

    let html = extractHTML(htmlResponse);

    // Post-generation validation: retry once with a stricter prompt on failure,
    // then degrade gracefully to the local fallback so we never show broken HTML.
    const canvasPx = computeCanvasPx(request);
    const validation = validateInfographicHTML(html, canvasPx.width, canvasPx.height);
    if (!validation.pass) {
      console.warn("Step 3: Validation failed, retrying once with stricter prompt.", validation.checks);
      try {
        const strictResponse = await generateWithFallback(
          providerMap[usedProvider] || provider,
          htmlPrompt + buildRetrySuffix(validation.checks, canvasPx.width, canvasPx.height),
          apiKey,
          usedModel,
          0.3,
          Math.min(maxTokens, 4096),
          usedProvider,
        );
        const stricterHtml = extractHTML(strictResponse);
        if (validateInfographicHTML(stricterHtml, canvasPx.width, canvasPx.height).pass) {
          html = stricterHtml;
        } else {
          return generateLocalContent(request, providerId, model, startTime);
        }
      } catch (strictError) {
        console.error("Step 3: Strict retry failed, using local fallback.", strictError);
        return generateLocalContent(request, providerId, model, startTime);
      }
    }

    // Sanitize the final HTML (strip scripts, event handlers, javascript: URLs).
    html = sanitizeHTML(html);

    return {
      success: true,
      content: {
        title: normalizedContent.title,
        subtitle: normalizedContent.subtitle,
        sections: normalizedContent.sections,
        statistics: normalizedContent.statistics,
        timeline: normalizedContent.timeline,
        colors: [
          normalizedContent.suggestedColors?.primary || "#3b82f6",
          normalizedContent.suggestedColors?.secondary || "#8b5cf6",
          normalizedContent.suggestedColors?.accent || "#ec4899",
          normalizedContent.suggestedColors?.background || "#ffffff",
          normalizedContent.suggestedColors?.text || "#0f172a",
        ],
        icons: normalizedContent.suggestedIcons,
        callToAction: "",
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
    title, subtitle: `${words.length} words · ${sections.length} insights`,
    sections, statistics, timeline: [],
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
    icons: ["bar-chart", "arrow-up", "lightbulb", "target"],
    callToAction: "",
  };
  
  const aspectRatio = request.aspectRatio || "1:1";
  let cw = 1080, ch = 1080, layout: "square" | "portrait" | "wide" = "square";
  switch (aspectRatio) {
    case "9:16": cw = 1080; ch = 1920; layout = "portrait"; break;
    case "16:9": cw = 1920; ch = 1080; layout = "wide"; break;
    case "4:5": cw = 1080; ch = 1350; layout = "portrait"; break;
    case "A4-P": cw = 794; ch = 1123; layout = "portrait"; break;
    case "A4-L": cw = 1123; ch = 794; layout = "wide"; break;
    case "letter": cw = 816; ch = 1056; layout = "portrait"; break;
    default: cw = 1080; ch = 1080; layout = "square";
  }
  if (request.aspectRatioWidth && request.aspectRatioHeight) { cw = request.aspectRatioWidth; ch = request.aspectRatioHeight; }
  
  const titleTag = content.title || "Infographic";
  const subtitleText = content.subtitle || "";
  const hasTimeline = content.timeline && content.timeline.length > 0;
  const statCount = Math.min(statistics.length, 3);
  const sectionCount = Math.min(sections.length, 4);
  
  // Build stat bars (CSS-only progress bars)
  const statBars = statistics.slice(0, 3).map((s, i) => {
    const pct = parseInt(s.value) || 75;
    return `<div class="stat-item">
      <div class="stat-header"><span class="stat-label">${s.label}</span><span class="stat-val">${s.value}</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");

  // Build section cards with color-coded accent line
  const accentColors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
  const sectionCards = sections.slice(0, 4).map((s, i) => {
    return `<div class="sec-card">
      <div class="sec-accent" style="background:${accentColors[i % 4]}"></div>
      <div class="sec-body"><h3>${s.title}</h3><p>${s.content}</p></div>
    </div>`;
  }).join("");

  // Decorative circles (3 for portrait, 2 for other orientations)
  const decorationCircles = layout === "portrait"
    ? `<div class="deco-circle dc1"></div><div class="deco-circle dc2"></div><div class="deco-circle dc3"></div>`
    : `<div class="deco-circle dc1"></div><div class="deco-circle dc2"></div>`;

  // Generate a premium, richly designed local infographic (NO scripts, pure CSS)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:${cw}px;height:${ch}px;overflow:hidden;
  font-family:'Inter',system-ui,sans-serif;
  background:linear-gradient(145deg,#0f172a 0%,#1e293b 40%,#0f172a 100%);
  color:#f1f5f9;
  display:flex;flex-direction:column;
  padding:${layout === "portrait" ? "56px 48px" : layout === "wide" ? "40px 56px" : "48px"};
  position:relative;
}
/* Decorative background circles */
.deco-circle{position:absolute;border-radius:50%;pointer-events:none;z-index:0}
.dc1{width:480px;height:480px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);top:-120px;right:-120px}
.dc2{width:360px;height:360px;background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%);bottom:-80px;left:-80px}
.dc3{width:240px;height:240px;background:radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
/* Hero */
.hero{position:relative;z-index:1;margin-bottom:${layout === "portrait" ? "40px" : "28px"}}
.hero h1{font-family:'Space Grotesk',system-ui,sans-serif;font-size:${layout === "wide" ? "52px" : "48px"};font-weight:700;line-height:1.1;
  background:linear-gradient(135deg,#f8fafc 0%,#cbd5e1 40%,#8b5cf6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;
  letter-spacing:-0.5px}
.hero .sub{font-size:16px;color:#94a3b8;font-weight:400;letter-spacing:0.3px}
.hero .divider{width:80px;height:3px;background:linear-gradient(90deg,#8b5cf6,#3b82f6);border-radius:6px;margin-top:16px}
.hero .word-badge{display:inline-block;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);border-radius:999px;padding:4px 14px;font-size:12px;color:#a78bfa;font-weight:500;margin-top:14px}
/* Stats area */
.stats-area{position:relative;z-index:1;margin-bottom:${layout === "portrait" ? "36px" : "24px"}}
.stats-area .stats-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;margin-bottom:14px}
.stat-item{margin-bottom:14px}
.stat-item:last-child{margin-bottom:0}
.stat-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.stat-label{font-size:13px;color:#94a3b8;font-weight:500}
.stat-val{font-size:15px;font-weight:700;color:#f1f5f9;font-family:'Space Grotesk',system-ui,sans-serif}
.stat-track{width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden}
.stat-fill{height:8px;border-radius:999px;background:linear-gradient(90deg,#8b5cf6,#3b82f6,#10b981);transition:width 0.3s ease;min-width:4%}
/* Sections grid */
.sections-area{position:relative;z-index:1;flex:1;overflow:hidden}
.the-grid{display:grid;grid-template-columns:${layout === "wide" ? "repeat(4,1fr)" : "1fr 1fr"};gap:${layout === "portrait" ? "12px" : "14px"}}
.sec-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.sec-accent{height:4px;flex-shrink:0}
.sec-body{padding:${layout === "portrait" ? "14px 16px" : "16px 18px"};flex:1}
.sec-body h3{font-family:'Space Grotesk',system-ui,sans-serif;font-size:15px;font-weight:600;color:#e2e8f0;margin-bottom:6px}
.sec-body p{font-size:13px;line-height:1.6;color:#94a3b8;font-weight:400;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
/* Footer */
.footer-bar{position:relative;z-index:1;padding-top:${layout === "portrait" ? "30px" : "18px"};font-size:11px;color:#475569;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);margin-top:auto}
</style>
</head>
<body>
${decorationCircles}
<div class="hero">
  <h1>${titleTag}</h1>
  ${subtitleText ? `<p class="sub">${subtitleText}</p>` : ""}
  <div class="divider"></div>
  <div class="word-badge">${words.length} words &middot; ${sections.length} insights</div>
</div>
<div class="stats-area">
  <p class="stats-title">Key Metrics</p>
  <div class="stats-rich">${statBars}</div>
</div>
<div class="sections-area">
  <div class="the-grid">${sectionCards}</div>
</div>
<div class="footer-bar">
  <span>&copy; Infographic Generator</span>
  <span>${aspectRatio} &middot; ${cw}&times;${ch}px</span>
</div>
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