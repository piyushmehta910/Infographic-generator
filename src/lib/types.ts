// ============================================================
// Infographic Generator - Core Type Definitions
// ============================================================

import type { MemoryEntry } from "@/services/ai/memory";

// --- Content Types ---

export interface InfographicContent {
  title: string;
  subtitle: string;
  sections: Section[];
  statistics: Statistic[];
  timeline: TimelineEvent[];
  heroStat?: { value: string; label: string };
  colors: string[];
  icons: string[];
  callToAction: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
  image?: string;
  icon?: string;
  type?: "text" | "image" | "bullets" | "mixed";
}

export interface Statistic {
  id: string;
  value: string;
  label: string;
  icon?: string;
  prefix?: string;
  suffix?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon?: string;
}

// --- Aspect Ratio Types ---

export type AspectRatioId =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "A4-P"
  | "A4-L"
  | "letter"
  | "custom";

export interface AspectRatio {
  id: AspectRatioId;
  label: string;
  ratio: string;
  width: number;
  height: number;
}

// --- Font Types ---

export type FontId =
  "inter" | "poppins" | "roboto" | "manrope" | "nunito" | "dm-sans";

// --- AI Provider Types ---

export type AIProviderId = "openrouter" | "groq" | "nim" | "mistral" | "custom";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  baseUrl?: string;
}

export interface AIProviderOption {
  id: AIProviderId;
  name: string;
  models: AIModelOption[];
  requiresApiKey: boolean;
  docsUrl: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
}

export interface AIGenerationRequest {
  input: string;
  inputType: "text" | "idea";
  aspectRatio?: AspectRatioId;
  aspectRatioWidth?: number;
  aspectRatioHeight?: number;
  font?: FontId;
  language?: string;
  audience?: string;
  userIntent?: string;
}

export interface AIGenerationStep {
  name: string;
  status: "completed" | "fallback" | "failed";
  durationMs?: number;
}

export type AIGenerationErrorType =
  | "rate_limit"
  | "auth_failed"
  | "invalid_request"
  | "upstream_error"
  | "timeout";

export interface AIGenerationResult {
  success: boolean;
  content?: InfographicContent;
  error?: string;
  /** Coarse failure class so API routes can map to proper HTTP statuses. */
  errorType?: AIGenerationErrorType;
  provider?: AIProviderId;
  model?: string;
  processingTime?: number;
  generatedHtml?: string;
  /** True when the output came from a fallback provider (not the primary). */
  usedFallback?: boolean;
  /**
   * True when the result shipped with a known quality compromise
   * (generic fallback blueprint, below-threshold quality score, …).
   */
  degraded?: boolean;
  /** Non-fatal issues the user should know about, even on success. */
  warnings?: string[];
  blueprint?: unknown;
  /** Ordered record of the pipeline phases that ran, with per-phase timing. */
  steps?: AIGenerationStep[];
  /** Working-memory distilled from this run; send it back on the next generation. */
  memory?: MemoryEntry[];
}

/**
 * The full pipeline context of one generation, kept together so the user's
 * request, completed content, design blueprint, and final HTML/CSS stay
 * linked in the same place (e.g. persisted per user/browser).
 */
export interface GenerationContext {
  request: AIGenerationRequest;
  content: InfographicContent | null;
  blueprint: unknown;
  html: string | null;
  provider?: AIProviderId;
  model?: string;
  steps?: AIGenerationResult["steps"];
  processingTime?: number;
  usedFallback?: boolean;
  createdAt: number;
}

// --- Toast Types ---

export interface ToastMessage {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export interface Toast extends ToastMessage {
  id: string;
}
