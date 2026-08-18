// ============================================================
// Infographic Generator - Core Type Definitions
// ============================================================

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
  metadata?: ContentMetadata;
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

export interface ContentMetadata {
  language: string;
  wordCount: number;
  readingTime: number;
  source?: string;
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

// --- Template Types ---

export type TemplateCategory =
  | "business"
  | "marketing"
  | "sales"
  | "finance"
  | "startup"
  | "technology"
  | "ai"
  | "education"
  | "healthcare"
  | "medical"
  | "fitness"
  | "food"
  | "travel"
  | "real-estate"
  | "timeline"
  | "roadmap"
  | "process"
  | "comparison"
  | "checklist"
  | "statistics"
  | "flowchart"
  | "swot"
  | "pyramid"
  | "circular"
  | "instagram"
  | "instagram-carousel"
  | "linkedin"
  | "facebook"
  | "pinterest"
  | "youtube"
  | "poster"
  | "flyer"
  | "report"
  | "certificate";

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  aspectRatios: AspectRatioId[];
  placeholders: Placeholder[];
  themes: string[];
  fonts: string[];
  preview?: string;
  version: string;
}

export interface Placeholder {
  id: string;
  type: "text" | "image" | "stat" | "list" | "timeline" | "cta";
  label: string;
  defaultValue: string;
  required: boolean;
}

// --- Theme Types ---

export type ThemeId =
  | "auto"
  | "light"
  | "dark"
  | "minimal"
  | "glassmorphism"
  | "neumorphism"
  | "corporate"
  | "modern"
  | "gradient"
  | "midnight-blue"
  | "midnight-green"
  | "material"
  | "custom";

// --- Font Types ---

export type FontId =
  "inter" | "poppins" | "roboto" | "manrope" | "nunito" | "dm-sans";

// --- AI Provider Types ---

export type AIProviderId = "openrouter" | "groq" | "nim" | "mistral";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
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
  inputType: "text" | "idea" | "image" | "image-url" | "design";
  templateId?: string;
  theme?: ThemeId;
  aspectRatio?: AspectRatioId;
  aspectRatioWidth?: number;
  aspectRatioHeight?: number;
  purpose?: string;
  alignment?: string;
  font?: FontId;
  language?: string;
  audience?: string;
  imageData?: string;
  imageUrl?: string;
  userIntent?: string;
}

export interface AIGenerationStep {
  name: string;
  status: "completed" | "fallback" | "failed";
  durationMs?: number;
}

export interface AIGenerationResult {
  success: boolean;
  content?: InfographicContent;
  error?: string;
  provider?: AIProviderId;
  model?: string;
  processingTime?: number;
  generatedHtml?: string;
  /** True when the output came from a fallback provider (not the primary). */
  usedFallback?: boolean;
  blueprint?: unknown;
  /** Ordered record of the pipeline phases that ran, with per-phase timing. */
  steps?: AIGenerationStep[];
  concepts?: Array<{
    id: string;
    title: string;
    description: string;
    colorPalette: Record<string, string>;
    layoutStyle: string;
    vibe: string;
    keyFeatures: string[];
  }>;
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
