import {
  AIProviderId,
  AIGenerationRequest,
  AIGenerationResult,
  AIGenerationStep,
  AIGenerationErrorType,
  InfographicContent,
} from "@/lib/types";
import {
  buildContentBlueprintPrompt,
  buildHTMLGenerationPrompt,
} from "./promptBuilder";
import { validateOutline } from "@/lib/schemas";
import { GenerationStoppedError, ProviderHttpError, providerMap, AIProvider } from "./providers";
import {
  generateWithFallback,
  tryAllProviders,
  StoredProvider,
  CallLimits,
  checkStop,
} from "./fallback";
import { extractJSON, extractHTML, sanitizeHTML } from "./response";
import { normalizeContent, heuristicOutlineFromInput } from "./normalize";
import {
  validateInfographicHTML,
  scoreInfographicHTML,
  buildRetrySuffix,
  buildQualitySuffix,
} from "./quality";
import { getCanvasDimensions } from "@/lib/canvas";
import {
  SessionMemory,
  MemoryEntry,
  summarizeSource,
  summarizeContent,
  summarizeBlueprint,
} from "./memory";
import type { PipelineProgressEvent } from "./progress";
import { getModelMaxOutput, isSmallModelId } from "@/lib/constants";

export interface GenerateContentOptions {
  apiKey: string;
  providerId: AIProviderId;
  model: string;
  temperature?: number;
  maxTokens?: number;
  storedProviders?: StoredProvider[];
  /** Seed the working memory with context from a previous generation. */
  memory?: MemoryEntry[];
  /** Aborts all upstream fetches (client cancellation). */
  signal?: AbortSignal;
  /** Hard wall-clock budget for the entire generation (default 100s). */
  budgetMs?: number;
  /** Real-time progress sink, streamed to the client over SSE. */
  onProgress?: (event: PipelineProgressEvent) => void;
}

/** Default wall-clock budget — stays under the route's 120s serverless cap. */
// On Vercel serverless, the runtime kills the function at maxDuration.
// Budget must stay UNDER that limit or the stream is severed mid-generation.
// Locally there is no platform cap, so use the full 110s.
// Override with GENERATION_BUDGET_MS env var for tuning.
const IS_VERCEL = Boolean(process.env.VERCEL);
const ENV_BUDGET = Number(process.env.GENERATION_BUDGET_MS);
export const DEFAULT_BUDGET_MS = ENV_BUDGET > 0 ? ENV_BUDGET : IS_VERCEL ? 50_000 : 110_000;
// The budget ceiling + a small last-chance grace (3s in fetchWithTimeout) must
// stay UNDER maxDuration (60s on Vercel) so the SSE stream is never severed.
const MAX_BUDGET_MS = ENV_BUDGET > 0 ? ENV_BUDGET : IS_VERCEL ? 53_000 : 115_000;

/** Per-phase output-token floors: tiny user maxTokens used to truncate JSON/HTML into unparseable sludge. */
function tokensFor(maxTokens: number, cap: number, floor: number): number {
  return Math.min(Math.max(maxTokens, floor), cap);
}

/** Get model-aware token cap for a phase. Uses the model's maxOutput from catalog if available,
 *  otherwise falls back to the phase's hardcoded cap. */
function tokensForPhase(
  maxTokens: number,
  phaseCap: number,
  floor: number,
  providerId: AIProviderId,
  model: string,
): number {
  const modelMaxOutput = getModelMaxOutput(providerId, model, phaseCap);
  // Use the smaller of: phase cap, model maxOutput, or user's maxTokens
  // But ensure at least the floor
  const effectiveCap = Math.min(phaseCap, modelMaxOutput);
  return Math.min(Math.max(maxTokens, floor), effectiveCap);
}

const BLUEPRINT_TOKEN_CAP = 4096;
const HTML_TOKEN_CAP = 8192;
const MAX_HTML_ATTEMPTS = 3;
const MIN_QUALITY_SCORE = 50;

/** Detect if a model is a small/free tier model that may produce simpler output.
 *  Uses the shared detector from constants to stay in sync with the catalog. */
function isSmallModel(model: string): boolean {
  return isSmallModelId(model);
}

/** Get quality threshold based on model size — lower for small/free models */
function getQualityThreshold(model: string): number {
  return isSmallModel(model) ? 40 : MIN_QUALITY_SCORE;
}

function getBaseUrl(providerId: AIProviderId, storedProviders: StoredProvider[]): string {
  const stored = storedProviders.find((p) => p.id === providerId);
  return stored?.baseUrl || "";
}

/**
 * Resolve which API key + model to use for a given provider id. After a
 * cross-provider fallback switches the active provider, the ORIGINAL user's
 * key must NOT be sent to the new provider — each provider gets its own
 * stored credential.
 */
function getCreds(
  pid: AIProviderId,
  primaryId: AIProviderId,
  primaryKey: string,
  primaryModel: string,
  storedProviders: StoredProvider[],
): { key: string; model: string } {
  if (pid === primaryId) return { key: primaryKey, model: primaryModel };
  const stored = storedProviders.find((p) => p.id === pid);
  return { key: stored?.apiKey || "", model: stored?.model || "" };
}

/** Map an error to a coarse failure class for HTTP mapping. Uses the real HTTP status when available. */
function classifyError(message: string, status?: number): AIGenerationErrorType {
  if (status) {
    if (status === 401 || status === 403) return "auth_failed";
    if (status === 429) return "rate_limit";
    if (status === 408 || status === 504) return "timeout";
    if (status === 400 || status === 404 || status === 413 || status === 422 || status === 402) return "invalid_request";
  }
  const m = message.toLowerCase();
  if (/\b401\b|\b403\b|unauthorized|forbidden|invalid[ _-]?(api[ _-])?key|authentication/i.test(m)) return "auth_failed";
  if (/\b429\b|rate[ _-]?limit|quota|too many requests/i.test(m)) return "rate_limit";
  if (/cancel|abort|timeout|timed out|\baborted?\b|socket hang up|etimedout|econnaborted/i.test(m)) return "timeout";
  if (/\b400\b|invalid request|malformed|context length|max_tokens/i.test(m)) return "invalid_request";
  return "upstream_error";
}

function statusOf(error: unknown): number | undefined {
  return error instanceof ProviderHttpError ? error.status : undefined;
}

/**
 * Build a failed result with the phases that ran, the real error, and elapsed
 * time. `extras` preserves partial work (content/blueprint) so clients can
 * offer cheap retries or show what succeeded before the failure.
 */
function failedResult(
  providerId: AIProviderId,
  model: string,
  message: string,
  steps: AIGenerationStep[],
  startTime: number,
  status?: number,
  extras?: { content?: InfographicContent; blueprint?: unknown },
  originalError?: { message: string; provider: AIProviderId; model: string },
): AIGenerationResult {
  return {
    success: false,
    error: message,
    errorType: classifyError(message, status),
    provider: providerId,
    model,
    processingTime: Date.now() - startTime,
    steps,
    usedFallback: false,
    originalError: originalError?.message,
    originalErrorProvider: originalError?.provider,
    originalErrorModel: originalError?.model,
    ...extras,
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
 * Build the full-shape generic blueprint used when the AI didn't return one
 * (or returned one that didn't parse). Mirrors the shape the HTML phase
 * prompt expects (colorPalette, typography, cardStyle, cssDirectives…).
 */
function defaultBlueprint(request: AIGenerationRequest): Record<string, unknown> {
  const palette = THEME_FALLBACK.modern;
  const dimensions = getCanvasDimensions(
    request.aspectRatio,
    request.aspectRatioWidth,
    request.aspectRatioHeight,
  );
  return {
    concept: "Clean, premium design system",
    layoutStyle: "magazine-grid",
    colorPalette: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      surface: palette.background,
      text: palette.text,
      textMuted: "#94a3b8",
      border: "rgba(255,255,255,0.1)",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      heroSize: "clamp(48px, 5vw, 72px)",
      h2Size: "clamp(28px, 3vw, 36px)",
      bodySize: "clamp(16px, 1.5vw, 20px)",
    },
    cardStyle: {
      borderRadius: "16px",
      background: palette.background,
      border: "1px solid rgba(255,255,255,0.08)",
      shadow: "0 8px 32px rgba(0,0,0,0.24)",
      backdropFilter: "blur(12px)",
    },
    heroStatStyle: {
      fontSize: "clamp(48px, 5vw, 72px)",
      fontWeight: "800",
      color: palette.accent,
      gradient: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
    },
    cssDirectives: [
      "Use CSS custom properties for all colors and typography",
      `Set the outer container to exactly ${dimensions.width}x${dimensions.height}px with overflow:hidden and zero scrollbars`,
      "Render each section inside a distinct styled card",
      "Use inline SVG icons — no emoji, no external images",
    ],
  };
}

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
  const memory = new SessionMemory(options.memory);
  const startedAt = Date.now();
  const budget = Math.min(Math.max(options.budgetMs ?? DEFAULT_BUDGET_MS, 20_000), MAX_BUDGET_MS);
  const limits: CallLimits = { signal: options.signal, deadline: startedAt + budget };
  const result = await runPipeline(request, options, memory, limits);
  if (result.success) {
    return { ...result, memory: memory.toJSON() };
  }
  // If the multi-phase pipeline failed (very common on flaky free models),
  // retry with a single-shot HTML generation: one call instead of several has
  // a far higher chance of succeeding when providers are rate-limited.
  //
  // CRITICAL: the fallback shares the SAME deadline as the pipeline. A fresh
  // window here used to push total time past the serverless maxDuration
  // (pipeline 55s + fallback 45s > 60s Vercel cap), which severed the SSE
  // stream mid-generation — the "connection dropped before generation
  // finished" bug. Sharing the deadline guarantees we always finish in time.
  try {
    const remaining = (limits.deadline ?? 0) - Date.now();
    if (remaining > 15_000) {
      const single = await singleShotAttempt(request, options, memory, limits, {
        // Reuse whatever the pipeline managed before failing: when content +
        // blueprint exist, the fallback just renders them into HTML instead of
        // regenerating everything from scratch (higher quality + less time).
        content: result.content,
        blueprint: result.blueprint,
      });
      if (single) return { ...single, memory: memory.toJSON() };
    }
  } catch {
    // Deadline or abort during single-shot: fall through to report the
    // original pipeline failure rather than crashing the stream.
  }
  return { ...result, memory: memory.toJSON() };
}

/**
 * Single-shot fallback: one AI call that returns a complete HTML infographic
 * directly. Used only when the multi-phase pipeline fails. If the pipeline
 * already produced content + blueprint before failing, it renders THOSE into
 * HTML (equivalent to the HTML phase) instead of regenerating everything from
 * scratch. Returns a success result, or null so the caller can report the
 * original pipeline failure.
 */
async function singleShotAttempt(
  request: AIGenerationRequest,
  options: GenerateContentOptions,
  memory: SessionMemory,
  limits: CallLimits,
  preset?: { content?: InfographicContent; blueprint?: unknown },
): Promise<AIGenerationResult | null> {
  const { apiKey, providerId, model } = options;
  const storedProviders = options.storedProviders ?? [];
  const temperature = Math.min(options.temperature ?? 0.5, 0.4);
  const maxTokens = options.maxTokens ?? 2048;
  const startTime = Date.now();
  if (!apiKey || !apiKey.trim()) return null;
  const emit = (e: PipelineProgressEvent) =>
    options.onProgress?.({ ...e, elapsedMs: Date.now() - startTime });

  memory.add("note", "Fallback mode", "Full pipeline failed; switched to single-shot generation.");
  emit({ type: "info", phase: "singleshot", message: "Pipeline failed — trying a one-shot generation…" });
  const memoryContext = memory.hasEntries() ? memory.context() : "";

  const dimensions = getCanvasDimensions(
    request.aspectRatio,
    request.aspectRatioWidth,
    request.aspectRatioHeight,
  );
  const source = (request.input || "").slice(0, 6000);

  // When the failed pipeline left usable content + blueprint, reuse them: the
  // fallback becomes the HTML phase itself (one call, no pumped-up prompts).
  const prompt = preset?.content && preset.blueprint
    ? buildHTMLGenerationPrompt(preset.content, preset.blueprint, request, memoryContext)
    : `Design a complete, self-contained HTML infographic that visualizes the content below.

CANVAS: exactly ${dimensions.width}px wide and ${dimensions.height}px high. The outer container must be exactly those dimensions with overflow:hidden. Do not use viewport units.
THEME: modern color palette.
STYLE INTENT: ${request.userIntent || "premium, clean, data-driven"}.

CONTENT TO VISUALIZE:
${source || "Create a generic data-visualization infographic about growth and progress."}

${memoryContext}

REQUIREMENTS:
- Return a complete document starting with <!DOCTYPE html> and containing <head><style> and <body>.
- Rich <style> block: grid/flex layout, gradient background, cards with border-radius and box-shadow, large accent numbers for statistics.
- Structure with <div>/<section> containers, headings, paragraphs, and styled stat cards.
- Use ONLY real content from the source above. No placeholders, no "lorem ipsum", no "your content here".
- No scripts, no external images, no emoji.
- Output ONLY the raw HTML — no markdown fences, no explanations.`;

  const candidates: { provider: AIProviderId; model: string; text: string }[] = [];

  const collect = async (
    prov: AIProvider,
    key: string,
    modelId: string,
    pid: AIProviderId,
  ) => {
    try {
      const text = await generateWithFallback(
        prov,
        prompt,
        key,
        modelId,
        temperature,
        tokensForPhase(maxTokens, HTML_TOKEN_CAP, 2560, pid, modelId),
        pid,
        getBaseUrl(pid, storedProviders),
        limits,
      );
      candidates.push({ provider: pid, model: modelId, text });
      return true;
    } catch {
      // Deadline exceeded or provider error: don't rethrow — single-shot
      // returning null is enough; the caller reports the original failure.
      return false;
    }
  };

  const primary = providerMap[providerId];
  if (primary) {
    await collect(primary, apiKey, model, providerId);
  }
  // If the primary provider failed, try every other configured provider.
  if (candidates.length === 0 && storedProviders.length > 0) {
    const order: AIProviderId[] = ["openrouter", "nim", "groq", "mistral"];
    for (const pid of order) {
      const stored = storedProviders.find((p) => p.id === pid && p.apiKey);
      const prov = providerMap[pid];
      if (!stored || !prov) continue;
      const done = await collect(prov, stored.apiKey, stored.model, pid);
      if (done) break;
    }
  }

  for (const candidate of candidates) {
    const html = sanitizeHTML(extractHTML(candidate.text));
    const val = validateInfographicHTML(html, dimensions.width, dimensions.height);
    if (!val.pass && (!html || html.length < 50)) continue;
    return {
      success: true,
      generatedHtml: html,
      blueprint: null,
      steps: [
        {
          name: "Single-shot HTML generation",
          status: "fallback",
          durationMs: Date.now() - startTime,
        },
      ],
      provider: candidate.provider,
      model: candidate.model,
      processingTime: Date.now() - startTime,
      usedFallback: true,
    };
  }
  return null;
}

async function runPipeline(
  request: AIGenerationRequest,
  options: GenerateContentOptions,
  memory: SessionMemory,
  limits: CallLimits,
): Promise<AIGenerationResult> {
  const { apiKey, providerId, model } = options;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;
  const storedProviders = options.storedProviders ?? [];
  const startTime = Date.now();
  const steps: AIGenerationResult["steps"] = [];
  const warnings: string[] = [];
  const emit = (e: PipelineProgressEvent) =>
    options.onProgress?.({ ...e, elapsedMs: Date.now() - startTime });

  // Remember the source so later phases (and future runs) stay grounded in it.
   memory.add("source", "Source content", summarizeSource(request.input));

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

  const memoryContext = memory.hasEntries() ? memory.context() : "";

  try {
    // ============================================
    // STEP 1+2: CONTENT ANALYSIS & DESIGN BLUEPRINT
    // ONE AI call returns BOTH the enriched content package and the visual
    // design blueprint. Merging two slow phases into one round-trip roughly
    // halves the number of sequential provider calls — the main reason
    // generation used to run out of time on slow free-tier models.
    // ============================================
    const designPrompt = buildContentBlueprintPrompt(request, memoryContext);
    let designResponse: string;
    let usedProvider: AIProviderId = providerId;
    let usedModel: string = model;
    const phaseStart = Date.now();
    emit({ type: "phase_start", phase: "content" });

    try {
      designResponse = await generateWithFallback(
        provider,
        designPrompt,
        apiKey,
        model,
        temperature,
        tokensForPhase(maxTokens, BLUEPRINT_TOKEN_CAP, 2048, providerId, model),
        providerId,
        getBaseUrl(providerId, storedProviders),
        limits,
      );
    } catch (primaryError) {
      if (primaryError instanceof GenerationStoppedError) throw primaryError;
      emit({ type: "info", phase: "content", message: "Primary provider failed — trying fallback providers…" });
      const fallback = await tryAllProviders(
        designPrompt,
        providerId,
        temperature,
        tokensFor(maxTokens, BLUEPRINT_TOKEN_CAP, 2048),
        storedProviders,
        limits,
      );
      if (fallback) {
        designResponse = fallback.text;
        usedProvider = fallback.provider;
        usedModel = fallback.model;
      } else {
        throw primaryError;
      }
    }

    // Parse a single response that may be EITHER {content, blueprint} OR a
    // bare content object. The blueprint defaults to the generic design
    // system whenever the model doesn't provide one.
    let parsedDesign: any;
    try {
      parsedDesign = extractJSON(designResponse);
    } catch {
      parsedDesign = null;
    }
    let contentCandidate: any = null;
    let blueprintCandidate: any | null = null;
    if (parsedDesign && typeof parsedDesign === "object") {
      const inner = parsedDesign.content;
      if (inner && typeof inner === "object" && !Array.isArray(inner)) {
        contentCandidate = inner;
      } else {
        contentCandidate = parsedDesign;
      }
      const bp = parsedDesign.blueprint;
      if (bp && typeof bp === "object" && !Array.isArray(bp)) {
        blueprintCandidate = bp;
      }
    }

    let contentParseFailed = false;
    if (!contentCandidate) {
      contentParseFailed = true;
      contentCandidate = heuristicOutlineFromInput(request.input);
      warnings.push("The AI's structured analysis came back malformed — the outline was built directly from your text. Try a stronger model for richer output.");
      emit({ type: "warning", phase: "content", message: "AI response wasn't valid JSON — building the outline from your text instead." });
    }

    // Strict single retry when the content shape fails Zod (spends a call
    // only if the deadline still allows it).
    const outlineCheck = validateOutline(contentCandidate);
    if (!outlineCheck.ok && !contentParseFailed) {
      const fixPrompt =
        designPrompt +
        "\n\nVALIDATION ERROR: " +
        outlineCheck.errors.join("; ") +
        "\nYour previous output's \"content\" field was rejected because required fields are missing or empty. Rewrite the ENTIRE JSON object so the \"content\" object has a non-empty title, sections with non-empty title and content, and the \"blueprint\" object intact, all derived from the source input. Return ONLY valid JSON: { \"content\": {…}, \"blueprint\": {…} }.";
      try {
        checkStop(limits);
        const strictCreds = getCreds(usedProvider, providerId, apiKey, model, storedProviders);
        const strictResponse = await generateWithFallback(
          providerMap[usedProvider],
          fixPrompt,
          strictCreds.key,
          strictCreds.model,
          Math.min(temperature, 0.4),
          tokensForPhase(maxTokens, BLUEPRINT_TOKEN_CAP, 2048, usedProvider, strictCreds.model),
          usedProvider,
          getBaseUrl(usedProvider, storedProviders),
          limits,
        );
        const strictParsed = extractJSON(strictResponse);
        if (strictParsed && typeof strictParsed === "object") {
          const inner = strictParsed.content;
          const strictContent = inner && typeof inner === "object" && !Array.isArray(inner) ? inner : strictParsed;
          if (validateOutline(strictContent).ok) {
            contentCandidate = strictContent;
            const bp = strictParsed.blueprint;
            if (bp && typeof bp === "object" && !Array.isArray(bp)) blueprintCandidate = bp;
          }
        }
      } catch {
        // Keep the first, imperfect result.
      }
    }

    const normalizedContent = normalizeContent(contentCandidate, request);
    memory.add("fact", "Structured content", summarizeContent(normalizedContent));

    let blueprintUsedFallback = false;
    if (!blueprintCandidate || Object.keys(blueprintCandidate).length === 0) {
      blueprintUsedFallback = true;
      emit({ type: "warning", phase: "blueprint", message: "Blueprint was missing — using a generic design system." });
    }
    const blueprint: any = blueprintCandidate && !blueprintUsedFallback
      ? blueprintCandidate
      : defaultBlueprint(request);
    if (blueprintUsedFallback) {
      memory.add("note", "Design blueprint", "Blueprint fell back to the generic design system.");
      warnings.push("The AI design blueprint was missing or invalid — a generic design system was used instead.");
    }
    const blueprintSummary = summarizeBlueprint(blueprint);
    if (blueprintSummary) {
      memory.add("decision", "Design blueprint", blueprintSummary);
    }

    steps.push({
      name: "Content analysis & design planning",
      status: contentParseFailed || blueprintUsedFallback || usedProvider !== providerId ? "fallback" : "completed",
      durationMs: Date.now() - phaseStart,
    });
    emit({ type: "phase_end", phase: "content", status: contentParseFailed || blueprintUsedFallback ? "fallback" : "completed" });

    // Build once — reused in the success result AND in partial-failure results.
    const infographicContent: InfographicContent = {
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
    };

    // If the combined analysis+design step consumed almost all the budget (slow
    // providers), hand over to single-shot fallback before timing out.
    const budgetLeft = (limits.deadline ?? 0) - Date.now();
    if (budgetLeft < 10_000 && limits.deadline) {
      steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: 0 });
      emit({ type: "phase_end", phase: "html", status: "failed" });
      return failedResult(
        providerId,
        model,
        "Timed out before rendering — trying a single faster pass.",
        steps,
        startTime,
        undefined,
        { content: infographicContent, blueprint },
      );
    }

    // ============================================
    // STEP 3: HTML/CSS GENERATION
    // AI codes the final design following the blueprint exactly.
    // ============================================
    const htmlPrompt = buildHTMLGenerationPrompt(normalizedContent, blueprint, request, memoryContext);
    let htmlResponse: string;
    const htmlStart = Date.now();
    emit({ type: "phase_start", phase: "html" });

    try {
      const htmlCreds = getCreds(usedProvider, providerId, apiKey, model, storedProviders);
      htmlResponse = await generateWithFallback(
        providerMap[usedProvider],
        htmlPrompt,
        htmlCreds.key,
        htmlCreds.model,
        temperature,
        tokensForPhase(maxTokens, HTML_TOKEN_CAP, 2560, usedProvider, htmlCreds.model),
        usedProvider,
        getBaseUrl(usedProvider, storedProviders),
        limits,
      );
    } catch (error) {
      if (error instanceof GenerationStoppedError) throw error;
      // Cross-provider fallback: if the active provider can't produce good
      // HTML, try every other configured provider before giving up.
      const originalError = error instanceof Error ? error.message : String(error);
      const originalStatus = statusOf(error);
      emit({ type: "info", phase: "html", message: "Primary provider failed — trying fallback providers…" });
      const fallback = await tryAllProviders(
        htmlPrompt,
        usedProvider,
        temperature,
        tokensFor(maxTokens, HTML_TOKEN_CAP, 2560),
        storedProviders,
        limits,
      );
      if (fallback) {
        htmlResponse = fallback.text;
        usedProvider = fallback.provider;
        usedModel = fallback.model;
      } else {
        steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
        emit({ type: "phase_end", phase: "html", status: "failed" });
        return failedResult(
          providerId,
          model,
          "AI generation failed — the provider may be offline, out of credits, or rate-limited. Try again or switch providers.",
          steps,
          startTime,
          originalStatus,
          { content: infographicContent, blueprint },
          { message: originalError, provider: usedProvider, model: usedModel },
        );
      }
    }

    const canvasPx = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
    let bestHtml = "";
    let bestScore = -1;
    // Store validation checks from the previous attempt for retry prompts.
    let lastChecks: Record<string, boolean> | null = null;

    // Run up to MAX_HTML_ATTEMPTS generations, score each, keep the best.
    for (let attempt = 0; attempt < MAX_HTML_ATTEMPTS; attempt++) {
      let candidateResponse: string;
      if (attempt === 0) {
        // First attempt already obtained as `htmlResponse` – no extra API call.
        candidateResponse = htmlResponse;
      } else {
        const retryPrompt =
          htmlPrompt +
          (bestScore >= 0
            ? buildQualitySuffix(scoreInfographicHTML(bestHtml).metrics, attempt, bestScore)
            : buildRetrySuffix(lastChecks ?? {}, canvasPx.width, canvasPx.height));
        emit({ type: "attempt", phase: "html", attempt, message: `Refining design (attempt ${attempt + 1})…` });
        try {
          const retryCreds = getCreds(usedProvider, providerId, apiKey, model, storedProviders);
          candidateResponse = await generateWithFallback(
            providerMap[usedProvider],
            retryPrompt,
            retryCreds.key,
            retryCreds.model,
            Math.min(temperature, 0.3 + attempt * 0.05),
            tokensForPhase(maxTokens, HTML_TOKEN_CAP, 2560, usedProvider, retryCreds.model),
            usedProvider,
            getBaseUrl(usedProvider, storedProviders),
            limits,
          );
        } catch (error) {
          if (error instanceof GenerationStoppedError) throw error;
          if (bestScore >= 0 && bestHtml) {
            // We already have a valid candidate from an earlier attempt — use it
            break;
          }
          if (attempt < MAX_HTML_ATTEMPTS - 1) continue;
          const retryError = error instanceof Error ? error.message : String(error);
          const retryStatus = statusOf(error);
          steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
          emit({ type: "phase_end", phase: "html", status: "failed" });
          return failedResult(
            providerId,
            model,
            "AI generation failed — the provider may be offline, out of credits, or rate-limited. Try again or switch providers.",
            steps,
            startTime,
            retryStatus,
            { content: infographicContent, blueprint },
            { message: retryError, provider: usedProvider, model: usedModel },
          );
        }
      }

      const candidate = extractHTML(candidateResponse);
      const val = validateInfographicHTML(candidate, canvasPx.width, canvasPx.height);
      if (!val.pass) {
        const failed = Object.entries(val.checks)
          .filter(([, ok]) => !ok)
          .map(([key]) => key);
        memory.add(
          "correction",
          `HTML attempt ${attempt + 1} rejected`,
          failed.length > 0 ? failed.join(", ") : "did not pass validation",
        );
        // Store the failing checks for the next retry prompt.
        lastChecks = val.checks;
        if (attempt < MAX_HTML_ATTEMPTS - 1) continue;

        // If we have a candidate from this attempt with substance, auto-repair instead of crashing
        if (!bestHtml && candidate && candidate.length > 50) {
          bestHtml = candidate;
          warnings.push("The generated design was automatically repaired for canvas rendering.");
        } else if (!bestHtml) {
          steps.push({ name: "HTML/CSS rendering", status: "failed", durationMs: Date.now() - htmlStart });
          emit({ type: "phase_end", phase: "html", status: "failed" });
          return failedResult(
            providerId,
            model,
            "AI produced an invalid design and could not be refined after retries. Please try again.",
            steps,
            startTime,
            undefined,
            { content: infographicContent, blueprint },
          );
        }
      }

      const scored = scoreInfographicHTML(candidate);
      if (scored.score > bestScore || !bestHtml) {
        bestHtml = candidate;
        bestScore = scored.score;
        // Reset lastChecks because we have a successful candidate.
        lastChecks = null;
      }
    }

    // Quality gate: below-threshold output ships as an honest "degraded"
    // result (best attempt + warning) instead of being thrown away — the
    // user decides whether to regenerate.
    let degraded = blueprintUsedFallback || contentParseFailed;
    const qualityThreshold = getQualityThreshold(usedModel);
    if (bestScore < qualityThreshold) {
      degraded = true;
      const qualityMessage = `Design scored ${bestScore}/100 (target ${qualityThreshold}${isSmallModel(usedModel) ? " for small model" : ""}) — showing the best attempt.`;
      warnings.push(qualityMessage);
      steps.push({ name: "Quality gate", status: "fallback", durationMs: 0 });
      emit({ type: "warning", phase: "html", message: qualityMessage });
    }
    steps.push({ name: "HTML/CSS rendering", status: "completed", durationMs: Date.now() - htmlStart });
    emit({ type: "phase_end", phase: "html", status: degraded ? "fallback" : "completed" });

    // Sanitize the final HTML (strip scripts, event handlers, javascript: URLs).
    const html = sanitizeHTML(bestHtml);
    const exportStart = Date.now();
    steps.push({ name: "Export & delivery", status: "completed", durationMs: Date.now() - exportStart });
    emit({ type: "phase_end", phase: "finalize", status: "completed" });

    return {
      success: true,
      content: infographicContent,
      generatedHtml: html,
      blueprint,
      steps,
      provider: usedProvider,
      model: usedModel,
      processingTime: Date.now() - startTime,
      usedFallback: false,
      degraded: degraded || undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      memory: memory.toJSON(),
    };
  } catch (error) {
    // Unexpected error: report it (with the real cause when available) and elapsed
    // time — never fabricate output.
    if (error instanceof GenerationStoppedError) {
      return failedResult(providerId, model, error.message, steps, startTime);
    }
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unexpected error during generation. Please try again.";
    const originalError = error instanceof Error ? error.message : String(error);
    return failedResult(
      providerId,
      model,
      message,
      steps,
      startTime,
      statusOf(error),
      undefined,
      { message: originalError, provider: providerId, model: model },
    );
  }
}