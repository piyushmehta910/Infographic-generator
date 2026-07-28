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
  generatedAt: string;
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
  | "instagram-post"
  | "instagram-carousel"
  | "linkedin-post"
  | "facebook-post"
  | "pinterest-pin"
  | "youtube-thumbnail"
  | "poster"
  | "flyer"
  | "report"
  | "certificate";

export type AspectRatioId =
  "1:1" | "4:5" | "9:16" | "16:9" | "A4-P" | "A4-L" | "letter" | "custom";

export interface AspectRatio {
  id: AspectRatioId;
  label: string;
  width: number;
  height: number;
}

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

export interface TemplateProps {
  content: InfographicContent;
  theme: Theme;
  aspectRatio: AspectRatio;
  settings: TemplateSettings;
  onElementClick?: (elementId: string) => void;
}

export interface TemplateSettings {
  alignment: "left" | "center" | "right" | "justify";
  verticalAlign: "top" | "middle" | "bottom";
  spacing: "compact" | "comfortable" | "spacious";
  padding: number;
  margin: number;
  roundedCorners: number;
  shadow: number;
  border: boolean;
  backgroundColor: string;
  fontFamily: string;
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

export interface Theme {
  id: ThemeId;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  border: string;
  shadow: string;
  cardBackground: string;
  gradient?: string;
}

// --- Font Types ---

export type FontId =
  "inter" | "poppins" | "roboto" | "manrope" | "nunito" | "dm-sans";

export interface Font {
  id: FontId;
  name: string;
  googleFont: string;
  weights: number[];
}

// --- AI Provider Types ---

export type AIProviderId =
  "openai" | "gemini" | "claude" | "openrouter" | "groq" | "nim";

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
  alignment?: string;
  font?: FontId;
  language?: string;
  audience?: string;
  imageData?: string;
  imageUrl?: string;
}

export interface AIGenerationResult {
  success: boolean;
  content?: InfographicContent;
  error?: string;
  provider?: AIProviderId;
  model?: string;
  processingTime?: number;
  generatedHtml?: string;
  blueprint?: unknown;
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

// --- Editor Types ---

export interface EditorState {
  mode: "generating" | "editing" | "exporting";
  selectedElement: string | null;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  history: EditorHistoryEntry[];
  historyIndex: number;
}

export interface EditorHistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  snapshot: InfographicContent;
}

export interface EditorElement {
  id: string;
  type: "text" | "image" | "shape" | "icon" | "chart" | "stat";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: Record<string, unknown>;
}

// --- Project Types ---

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  content: InfographicContent;
  templateId?: string;
  blueprint?: unknown;
  html?: string;
  theme: ThemeId;
  aspectRatio: AspectRatioId;
  settings: TemplateSettings;
  thumbnail?: string;
  tags: string[];
}

// --- Asset Types ---

export interface Asset {
  id: string;
  type: "icon" | "illustration" | "shape" | "arrow" | "pattern" | "user-upload";
  name: string;
  category: string;
  url: string;
  svg?: string;
  tags: string[];
}

// --- Export Types ---

export type ExportFormat = "png" | "svg" | "pdf" | "html" | "json";

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  scale?: number;
  includeMetadata?: boolean;
  fileName?: string;
}

// --- API Types ---

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface APIGenerateRequest {
  text?: string;
  idea?: string;
  image?: string;
  imageUrl?: string;
  templateId?: string;
  theme?: string;
  aspectRatio?: string;
  font?: string;
  language?: string;
  audience?: string;
}

export interface APIGenerateResponse {
  id: string;
  content: InfographicContent;
  template: string;
  preview?: string;
}

// --- Store Types ---

export interface UIState {
  sidebarOpen: boolean;
  templateGalleryOpen: boolean;
  propertiesPanelOpen: boolean;
  exportPanelOpen: boolean;
  aiPromptPanelOpen: boolean;
  activeTab: string;
  toast: Toast | null;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}
