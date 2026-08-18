import {
  AIProviderId,
  AIGenerationRequest,
  AIGenerationResult,
  AIGenerationStep,
} from "@/lib/types";
import {
  buildContentAnalysisPrompt,
  buildDesignBlueprintPrompt,
  buildHTMLGenerationPrompt,
} from "./promptBuilder";
import { validateOutline } from "@/lib/schemas";
import { providerMap } from "./providers";
import { generateWithFallback, tryAllProviders, StoredProvider } from "./fallback";
import { extractJSON, extractHTML, sanitizeHTML } from "./response";
import { normalizeContent } from "./normalize";
import {
  validateInfographicHTML,
  scoreInfographicHTML,
  buildRetrySuffix,
  buildQualitySuffix,
} from "./quality";
import { getCanvasDimensions } from "@/lib/canvas";

export interface GenerateContentOptions {
  apiKey: string;
  providerId: AIProviderId;
  model: string;
  temperature?: number;
  maxTokens?: number;
  storedProviders?: StoredProvider[];
}

const STEP_TOKEN_CAP = 1024;
const BLUEPRINT_TOKEN_CAP = 2048;
const HTML_TOKEN_CAP = 4096;
const MAX_HTML_ATTEMPTS = 3;
const MIN_QUALITY_SCORE = 50;

/** Prevents two pipeline runs at the same time (one generation at a time). */
let generationInFlight = false;

/** Build a failed result with the phases that ran, the real error, and elapsed time. */
function failedResult(
  providerId: AIProviderId,
  model: string,
  message: string,
  steps: AIGenerationStep[],
  startTime: number,
): AIGenerationResult {
  return {
    success: false,
    error: message,
    provider: providerId,
    model,
    processingTime: Date.now() - startTime,
    steps,
    usedFallback: false,
  };
}

const THEME_FALLBACK: Record<
  string,
  { primary: string; secondary: string; accent: string; background: string; text: string }
> = {
  light: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899", background: "#ffffff", text: "#0f172a" },
  dark: { primary: "#8b5cf6", secondary: "#10b981", accent: "#f59e0b", background: "#0f172a", text: "#f1f5f9" },
  minimal: { primary: "#0f172a", secondary: "#64748b", accent: "#8b5cf6", background: "#f8fafc", text: "#0f172a" },
  glassmorphism: { primary: "#ffffff", secondary: "#a78bfa", accent: "#34d399", background: "#1e293b", text: "#f8fafc" },
  neumorphism: { primary: "#5b6770", secondary: "#a3b1c6", accent: "#8b5cf6", background: "#e0e5ec", text: "#404954" },
  corporate: { primary: "#1d4ed8", secondary: "#3b82f6", accent: "#0ea5e9", background: "#f8fafc", text: "#0f172a" },
  modern: { primary: "#8b5cf6", secondary: "#6366f1", accent: "#10b981", background: "#ffffff", text: "#0f172a" },
  gradient: { primary: "#7c3aed", secondary: "#ec4899", accent: "#f59e0b", background: "#fdf2f8", text: "#0f172a" },
  "midnight-blue": { primary: "#1e40af", secondary: "#3b82f6", accent: "#22d3ee", background: "#0b1e3a", text: "#e0f2fe" },
  "midnight-green": { primary: "#134e4a", secondary: "#14b8a6", accent: "#fbbf24", background: "#042f2e", text: "#ccfbf1" },
  material: { primary: "#2563eb", secondary: "#7c3aed", accent: "#f97316", background: "#fafafa", text: "#0f172a" },
};

/**
 * MAIN PIPELINE: 4-PHASE WORKFLOW — one generation at a time.
 * 1. Content Analysis & Structuring  (AI completes the user's input into a rich content package)
 * 2. Design Architecture & Planning  (AI specifies HOW to design it in HTML/CSS for aspect ratio + intent)
 * 3. HTML/CSS Generation             (AI codes the final design following the blueprint exactly)
 * 4. Export & Delivery               (finalized HTML handed off for download/sharing)
 *
 * Every phase's output is kept together on the result so callers can persist
 * the full "user context" of a generation (request → content → blueprint → HTML).
 *
 * There is NO offline/local generator: generation always requires a working AI
 * provider. Failures return a `success:false` result with a real, actionable
 * error and the elapsed time — they never fabricate a design.
 */
export async function generateContent(
  request: AIGenerationRequest,
  options: GenerateContentOptions,
): Promise<AIGenerationResult> {
  if (generationInFlight) {
    return {
      success: false,
      error: "A generation is already in progress. Please wait for it to finish.",
      provider: options.providerId,
      processingTime: 0,
      steps: [],
    };
  }
  generationInFlight = true;
  try {
    return await runPipeline(request, options);
  } finally {
    generationInFlight = false;
  }
}

async function runPipeline(
  request: AIGenerationRequest,
  options: GenerateContentOptions,
): Promise<AIGenerationResult> {
  const { apiKey, providerId, model } = options;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;
  const storedProviders = options.storedProviders ?? [];
  const startTime = Date.now();
  const steps: AIGenerationResult["steps"] = [];

  // No API key or unknown provider => actionable error, never offline output.
  if (!apiKey || apiKey.trim() === "") {
    return failedResult(
      providerId,
      model,
      "No AI provider key configured. Open Settings, add your API key, then generate again.",
      steps,
      startTime,
    );
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return failedResult(
      providerId,
      model,
      "The selected AI provider is not configured. Check your provider settings.",
      steps,
      startTime,
    );
  }

  try {
    // ============================================
    // STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
    // ============================================
    const contentPrompt = buildContentAnalysisPrompt(request);
    let contentResponse: string;
    let usedProvider: AIProviderId = providerId;
    let usedModel: string = model;
    const phaseStart = Date.now();

    try {
      contentResponse = await generateWithFallback(
        provider,
        contentPrompt,
        apiKey,
        model,
        temperature,
        Math.min(maxTokens, STEP_TOKEN_CAP),
        providerId,
      );
    } catch (primaryError) {
      // If the user's provider fails, try ALL other configured providers.
      const fallback = await tryAllProviders(
        contentPrompt,
        apiKey,
        providerId,
        model,
        temperature,
        Math.min(maxTokens, STEP_TOKEN_CAP),
        storedProviders,
      );
      if (fallback) {
        contentResponse = fallback.text;
        usedProvider = fallback.provider;
        usedModel = fallback.model;
      } else {
        throw primaryError;
      }
    }
    steps.push({
      name: "Content analysis & structuring",
      status: usedProvider === providerId ? "completed" : "fallback",
      durationMs: Date.now() - phaseStart,
    });

    let contentResult = extractJSON(contentResponse);

    // ============================================
    // STEP 1.5a: ZOD VALIDATION (single stricter retry)
    // ============================================
    const outlineCheck = validateOutline(contentResult);
    if (!outlineCheck.ok) {
      const fixPrompt =
        contentPrompt +
        "\n\nVALIDATION ERROR: " +
        outlineCheck.errors.join("; ") +
        "\nRewrite the outline JSON so every required field is present, non-empty, and contains REAL content derived from the source input (no placeholders, no empty arrays). Return ONLY valid JSON.";
      try {
        const strictContentResponse = await generateWithFallback(
          providerMap[usedProvider],
          fixPrompt,
          apiKey,
          usedModel,
          Math.min(temperature, 0.4),
          Math.min(maxTokens, STEP_TOKEN_CAP),
          usedProvider,
        );
        const strictResult = extractJSON(strictContentResponse);
        if (validateOutline(strictResult).ok) {
          contentResult = strictResult;
        }
      } catch {
        // continue with the first result
      }
    }

    // ============================================
    // STEP 1.5: NORMALIZE CONTENT
    // ============================================
    const normalizedContent = normalizeContent(contentResult, request);

    // ============================================
    // STEP 2: DESIGN BLUEPRINT
    // AI specifies exactly how to design the content in HTML/CSS
    // for the chosen aspect ratio, honoring theme + design intent.
    // ============================================
    const blueprintPrompt = buildDesignBlueprintPrompt(normalizedContent, request);
    let blueprintResponse: string;
    let blueprintUsedFallback = false;
    const blueprintStart = Date.now();

    try {
      blueprintResponse = await generateWithFallback(
        providerMap[usedProvider],
        blueprintPrompt,
        apiKey,
        usedModel,
        temperature,
        Math.min(maxTokens, BLUEPRINT_TOKEN_CAP),
        usedProvider,
      );
    } catch {
      // Fall back to a theme-aware default blueprint on blueprint failure.
      blueprintUsedFallback = true;
      const palette = THEME_FALLBACK[request.theme || "modern"] || THEME_FALLBACK.modern;
      const dimensions = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
      blueprintResponse = JSON.stringify({
        designSystem: {
          aspectRatio: request.aspectRatio || "1:1",
          canvasDimensions: { width: dimensions.width, height: dimensions.height, responsiveBehavior: "scale_down" },
          designIntent: request.userIntent || "modern",
          shapeLanguage: { borderRadius: "16px", cardStyle: "elevated", cornerTreatment: "rounded" },
        },
        designConcept: "Clean, premium design system",
        layoutStyle: "magazine-grid",
        heroMoment: "Display heading with gradient accent",
        visualHierarchy: { "1st": "Title", "2nd": "Stats", "3rd": "Sections" },
        sectionCount: Math.max(2, normalizedContent.sections.length),
        readingFlow: "Top to bottom",
        spacingSystem: "8px grid",
        colorPalette: palette,
        colorDetails: {
          gradients: [
            { name: "hero_gradient", type: "linear", direction: "135deg", stops: [`${palette.primary} 0%`, `${palette.secondary} 100%`], usage: "header background" },
          ],
          neutrals: { surface: palette.background, surfaceVariant: palette.background, textSecondary: palette.text, border: palette.text },
          contrastValidation: { titleOnBackground: "pass", bodyOnSurface: "pass", accentOnPrimary: "pass", wcagAACompliant: true },
        },
        typography: { headingFont: "Inter", bodyFont: "Inter", headingSize: "48px", bodySize: "16px", headingWeight: "800", subheadingWeight: "600", bodyWeight: "400", style: "modern", typeScale: { hero: "clamp(64px, 8vw, 120px)", h1: "clamp(48px, 5vw, 72px)", h2: "clamp(28px, 3vw, 36px)", body: "clamp(16px, 1.5vw, 20px)", caption: "clamp(12px, 1vw, 14px)" }, specialTreatments: { heroStat: "Extra bold, accent color", pullQuote: "Italic, left border accent", callout: "Bold, accent background" } },
        icons: { style: "crisp-svg", consistency: "ALL icons use same stroke and weight", perSection: normalizedContent.suggestedIcons.slice(0, 4) },
        cardStyle: "Rounded rectangle with soft shadow",
        spacing: "8px-grid-based",
        alignment: "center",
        statsStyle: "big-numbers",
        decorations: ["Subtle gradient background", "Accent stat callouts"],
        background: "Non-flat gradient treatment",
        header: "Large title with subtitle",
        cta: "No CTA - static image",
        layoutGrid: { gridType: "12-column", sectionsPlacement: [{ sectionId: 1, gridArea: "1 / 1 / span 1 / -1", backgroundTreatment: "gradient", minHeight: "20%" }], responsiveBehavior: "desktop full grid / tablet 2-col / mobile single column" },
        visualElements: [{ type: "pattern", placement: "background", style: "gradient", animation: "none" }],
        cssArchitecture: { approach: "vanilla_css_inline", methodology: "BEM", keyCustomProperties: ["--color-primary", "--font-heading", "--spacing-unit", "--radius-base"], responsiveStrategy: "desktop-first", performanceNotes: "inline critical CSS, no external images" },
        animations: { pageLoad: "staggered fade-in for sections", statCounter: "count-up for hero stat", hoverStates: "subtle scale or shadow", reducedMotion: "respect prefers-reduced-motion: disable all animation" },
        specialFeatures: "Clean and professional",
        animationHints: ["Hover effects on cards"],
        designRationale: "Clean and professional",
        canvas: `${dimensions.width}x${dimensions.height}px`,
      });
    }
    steps.push({
      name: "Design architecture & planning",
      status: blueprintUsedFallback ? "fallback" : "completed",
      durationMs: Date.now() - blueprintStart,
    });

    let blueprint: any;
    try {
      blueprint = extractJSON(blueprintResponse);
    } catch {
      blueprint = {};
    }

    // ============================================
    // STEP 3: HTML/CSS GENERATION
    // AI codes the final design following the blueprint exactly.
    // ============================================
    const htmlPrompt = buildHTMLGenerationPrompt(normalizedContent, blueprint, request);
    let htmlResponse: string;
    const htmlStart = Date.now();

    try {
      htmlResponse = await generateWithFallback(
        providerMap[usedProvider],
        htmlPrompt,
        apiKey,
        usedModel,
        temperature,
        Math.min(maxTokens, HTML_TOKEN_CAP),
        usedProvider,
      );
    } catch {
      steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
      return failedResult(
        providerId,
        model,
        "AI generation failed — the provider may be offline, out of credits, or rate-limited. Try again or switch providers.",
        steps,
        startTime,
      );
    }

    const canvasPx = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
    let bestHtml = "";
    let bestScore = -1;

    // Run up to MAX_HTML_ATTEMPTS generations, score each, keep the best.
    for (let attempt = 0; attempt < MAX_HTML_ATTEMPTS; attempt++) {
      let candidateResponse: string;
      const promptForAttempt =
        attempt === 0
          ? htmlResponse
          : htmlResponse +
            (bestScore >= 0
              ? buildQualitySuffix(scoreInfographicHTML(bestHtml).metrics, attempt, bestScore)
              : buildRetrySuffix(
                  {
                    hasDoctype: false,
                    hasHtmlTag: false,
                    noPlaceholders: false,
                    noMarkdown: false,
                    correctSize: false,
                    hasSubstance: false,
                    hasStyleBlock: false,
                    hasColorAndShape: false,
                    hasStructuredLayout: false,
                  },
                  canvasPx.width,
                  canvasPx.height,
                ));

      try {
        candidateResponse = await generateWithFallback(
          providerMap[usedProvider],
          promptForAttempt,
          apiKey,
          usedModel,
          Math.min(temperature, 0.3 + attempt * 0.05),
          Math.min(maxTokens, HTML_TOKEN_CAP),
          usedProvider,
        );
      } catch {
        if (attempt < MAX_HTML_ATTEMPTS - 1) continue;
        steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
        return failedResult(
          providerId,
          model,
          "AI generation failed — the provider may be offline, out of credits, or rate-limited. Try again or switch providers.",
          steps,
          startTime,
        );
      }

      const candidate = extractHTML(candidateResponse);
      const val = validateInfographicHTML(candidate, canvasPx.width, canvasPx.height);
      if (!val.pass) {
        if (attempt < MAX_HTML_ATTEMPTS - 1) continue;
        steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
        return failedResult(
          providerId,
          model,
          "AI produced an invalid design and could not be refined after retries. Please try again.",
          steps,
          startTime,
        );
      }

      const scored = scoreInfographicHTML(candidate);
      if (scored.score > bestScore) {
        bestHtml = candidate;
        bestScore = scored.score;
      }
    }

    // If the best score is too low, report a quality failure instead of a fallback.
    if (bestScore < MIN_QUALITY_SCORE) {
      steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
      return failedResult(
        providerId,
        model,
        "AI generated a design that didn't meet quality standards. Try again or use a stronger provider/model.",
        steps,
        startTime,
      );
    }
    steps.push({ name: "HTML/CSS rendering", status: "completed", durationMs: Date.now() - htmlStart });

    // Sanitize the final HTML (strip scripts, event handlers, javascript: URLs).
    const html = sanitizeHTML(bestHtml);
    const exportStart = Date.now();
    steps.push({ name: "Export & delivery", status: "completed", durationMs: Date.now() - exportStart });

    return {
      success: true,
      content: {
        title: normalizedContent.title,
        subtitle: normalizedContent.subtitle,
        sections: normalizedContent.sections,
        statistics: normalizedContent.statistics,
        timeline: normalizedContent.timeline,
        heroStat: normalizedContent.heroStat,
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
      steps,
      provider: usedProvider,
      model: usedModel,
      processingTime: Date.now() - startTime,
      usedFallback: false,
    };
  } catch {
    // Unexpected error: report it with the elapsed time — never fabricate output.
    return failedResult(
      providerId,
      model,
      "Unexpected error during generation. Please try again.",
      steps,
      startTime,
    );
  }
}