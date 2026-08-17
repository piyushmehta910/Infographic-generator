import {
  AIProviderId,
  AIGenerationRequest,
  AIGenerationResult,
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
import { generateLocalContent } from "./localGenerator";
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

/**
 * MAIN PIPELINE: 3-STEP WORKFLOW
 * 1. Content Analysis & Auto-completion
 * 2. Design Blueprint (AI tells HOW to design it)
 * 3. HTML/CSS Generation (follows blueprint exactly)
 *
 * `storedProviders` (other configured AI keys) is passed explicitly by the
 * caller so fallback behavior is identical from every entry point.
 */
export async function generateContent(
  request: AIGenerationRequest,
  options: GenerateContentOptions,
): Promise<AIGenerationResult> {
  const { apiKey, providerId, model } = options;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;
  const storedProviders = options.storedProviders ?? [];
  const startTime = Date.now();

  // If no API key or unknown provider, use local generation.
  if (!apiKey || apiKey.trim() === "") {
    return generateLocalContent(request, providerId, model, startTime);
  }
  const provider = providerMap[providerId];
  if (!provider) return generateLocalContent(request, providerId, model, startTime);

  try {
    // ============================================
    // STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
    // ============================================
    const contentPrompt = buildContentAnalysisPrompt(request);
    let contentResponse: string;
    let usedProvider: AIProviderId = providerId;
    let usedModel: string = model;

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
    // ============================================
    const blueprintPrompt = buildDesignBlueprintPrompt(normalizedContent, request);
    let blueprintResponse: string;

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
      // Fall back to a default blueprint on blueprint failure.
      const dimensions = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
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
        icons: { style: "crisp-svg", consistency: "ALL icons use same stroke and weight", perSection: ["chart", "trend-up", "lightbulb", "target"] },
        cardStyle: "Rounded rectangle with shadow",
        spacing: "8px-grid-based",
        alignment: "center",
        statsStyle: "big-numbers",
        decorations: ["Subtle gradient background"],
        background: "Subtle gradient",
        header: "Large title with subtitle",
        cta: "No CTA - static image",
        specialFeatures: "Clean and professional",
        animationHints: ["Hover effects on cards"],
        canvas: `${dimensions.width}x${dimensions.height}px`,
      });
    }

    let blueprint: any;
    try {
      blueprint = extractJSON(blueprintResponse);
    } catch {
      blueprint = {};
    }

    // ============================================
    // STEP 3: HTML/CSS GENERATION
    // ============================================
    const htmlPrompt = buildHTMLGenerationPrompt(normalizedContent, blueprint, request);
    let htmlResponse: string;

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
      // If HTML generation fails, use local fallback.
      return generateLocalContent(request, providerId, model, startTime);
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
        return generateLocalContent(request, providerId, model, startTime);
      }

      const candidate = extractHTML(candidateResponse);
      const val = validateInfographicHTML(candidate, canvasPx.width, canvasPx.height);
      if (!val.pass) {
        if (attempt < MAX_HTML_ATTEMPTS - 1) continue;
        return generateLocalContent(request, providerId, model, startTime);
      }

      const scored = scoreInfographicHTML(candidate);
      if (scored.score > bestScore) {
        bestHtml = candidate;
        bestScore = scored.score;
      }
    }

    // If the best score is too low, fall back to the premium local generator.
    if (bestScore < MIN_QUALITY_SCORE) {
      return generateLocalContent(request, providerId, model, startTime);
    }

    // Sanitize the final HTML (strip scripts, event handlers, javascript: URLs).
    const html = sanitizeHTML(bestHtml);

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
      usedFallback: false,
    };
  } catch {
    // Final fallback: local generation with HTML.
    return generateLocalContent(request, providerId, model, startTime);
  }
}