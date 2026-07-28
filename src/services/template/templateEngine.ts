import React from "react";
import {
  InfographicContent,
  TemplateConfig,
  Theme,
  AspectRatio,
  TemplateSettings,
  ThemeId,
  AspectRatioId,
  FontId,
} from "@/lib/types";
import { THEMES, ASPECT_RATIOS, FONTS } from "@/lib/constants";

export function getTheme(themeId: ThemeId): Theme {
  return THEMES[themeId] || THEMES.light;
}

export function getAspectRatio(ratioId: AspectRatioId): AspectRatio {
  return ASPECT_RATIOS[ratioId] || ASPECT_RATIOS["1:1"];
}

export function getGoogleFontUrl(fontId: FontId): string {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font) return "";
  const weights = font.weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${font.googleFont}:wght@${weights}&display=swap`;
}

export function getCanvasStyle(
  aspectRatio: AspectRatio,
  theme: Theme,
  settings: TemplateSettings,
): React.CSSProperties {
  const scale = Math.min(800 / aspectRatio.width, 600 / aspectRatio.height, 1);

  return {
    width: `${aspectRatio.width}px`,
    height: `${aspectRatio.height}px`,
    backgroundColor: settings.backgroundColor || theme.colors.cardBackground,
    color: theme.colors.text,
    fontFamily: settings.fontFamily || "Inter, sans-serif",
    padding: `${settings.padding}px`,
    borderRadius: `${settings.roundedCorners}px`,
    boxShadow: settings.shadow
      ? `0 ${settings.shadow}px ${settings.shadow * 2}px ${theme.colors.shadow}`
      : "none",
    border: settings.border ? `1px solid ${theme.colors.border}` : "none",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    overflow: "hidden",
    position: "relative",
  };
}

export function generateId(): string {
  return `el-${crypto.randomUUID().slice(0, 8)}`;
}

export function getSpacingValue(
  spacing: "compact" | "comfortable" | "spacious",
): number {
  switch (spacing) {
    case "compact":
      return 8;
    case "comfortable":
      return 16;
    case "spacious":
      return 32;
  }
}

export function getAlignmentStyle(
  alignment: "left" | "center" | "right" | "justify",
): React.CSSProperties {
  switch (alignment) {
    case "left":
      return { textAlign: "left" };
    case "center":
      return { textAlign: "center" };
    case "right":
      return { textAlign: "right" };
    case "justify":
      return { textAlign: "justify" };
  }
}

// Template configs for the 8 built-in templates
export const BUILT_IN_TEMPLATES: TemplateConfig[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean, minimal design with bold colors and geometric shapes",
    category: "technology",
    aspectRatios: ["1:1", "4:5", "16:9", "9:16", "A4-P"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Subtitle",
        defaultValue: "{{subtitle}}",
        required: false,
      },
      {
        id: "sections",
        type: "list",
        label: "Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Statistics",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "dark", "modern", "gradient"],
    fonts: ["inter", "poppins", "manrope"],
    version: "1.0.0",
  },
  {
    id: "business",
    name: "Business",
    description:
      "Professional corporate design for business presentations and reports",
    category: "business",
    aspectRatios: ["16:9", "A4-P", "A4-L", "1:1"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Subtitle",
        defaultValue: "{{subtitle}}",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Key Metrics",
        defaultValue: "",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "corporate", "dark", "midnight-blue"],
    fonts: ["inter", "roboto", "dm-sans"],
    version: "1.0.0",
  },
  {
    id: "timeline",
    name: "Timeline",
    description:
      "Chronological layout for history, roadmaps, and project timelines",
    category: "timeline",
    aspectRatios: ["16:9", "A4-L", "1:1", "4:5"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "timeline",
        type: "timeline",
        label: "Timeline Events",
        defaultValue: "",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Additional Content",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "dark", "minimal", "modern"],
    fonts: ["inter", "nunito", "poppins"],
    version: "1.0.0",
  },
  {
    id: "comparison",
    name: "Comparison",
    description:
      "Side-by-side comparison layout for products, features, or concepts",
    category: "comparison",
    aspectRatios: ["16:9", "A4-L", "1:1"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Comparison Items",
        defaultValue: "",
        required: true,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "dark", "corporate", "modern"],
    fonts: ["inter", "roboto", "dm-sans"],
    version: "1.0.0",
  },
  {
    id: "education",
    name: "Education",
    description:
      "Clean educational layout for learning materials and tutorials",
    category: "education",
    aspectRatios: ["1:1", "4:5", "A4-P", "A4-L"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Subtitle",
        defaultValue: "{{subtitle}}",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Learning Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Key Facts",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "minimal", "modern", "corporate"],
    fonts: ["nunito", "inter", "poppins"],
    version: "1.0.0",
  },
  {
    id: "medical",
    name: "Medical",
    description:
      "Healthcare-focused design for medical information and statistics",
    category: "medical",
    aspectRatios: ["1:1", "4:5", "A4-P", "A4-L"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Medical Stats",
        defaultValue: "",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Information Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "timeline",
        type: "timeline",
        label: "Timeline",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["light", "minimal", "corporate"],
    fonts: ["inter", "roboto", "dm-sans"],
    version: "1.0.0",
  },
  {
    id: "technology",
    name: "Technology",
    description:
      "Tech-forward design with modern aesthetics for digital content",
    category: "technology",
    aspectRatios: ["16:9", "1:1", "9:16", "4:5"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Tech Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Statistics",
        defaultValue: "",
        required: false,
      },
      {
        id: "timeline",
        type: "timeline",
        label: "Timeline",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["dark", "midnight-blue", "modern", "gradient"],
    fonts: ["inter", "poppins", "manrope"],
    version: "1.0.0",
  },
  {
    id: "startup",
    name: "Startup",
    description: "Energetic, modern design for startups and pitch decks",
    category: "startup",
    aspectRatios: ["16:9", "1:1", "4:5", "A4-P"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Company Name",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Tagline",
        defaultValue: "{{subtitle}}",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Key Metrics",
        defaultValue: "",
        required: true,
      },
      {
        id: "sections",
        type: "list",
        label: "Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: false,
      },
    ],
    themes: ["modern", "light", "dark", "gradient"],
    fonts: ["poppins", "inter", "manrope"],
    version: "1.0.0",
  },
  {
    id: "marketing",
    name: "Marketing",
    description:
      "Social-optimized design for marketing campaigns and social media",
    category: "marketing",
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Headline",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Subheadline",
        defaultValue: "{{subtitle}}",
        required: false,
      },
      {
        id: "sections",
        type: "list",
        label: "Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Stats",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: true,
      },
    ],
    themes: ["light", "modern", "dark", "gradient"],
    fonts: ["poppins", "inter", "nunito"],
    version: "1.0.0",
  },
  {
    id: "custom",
    name: "AI Custom Design",
    description: "Unique AI-generated layout with dynamic colors and shapes",
    category: "startup",
    aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    placeholders: [
      {
        id: "title",
        type: "text",
        label: "Title",
        defaultValue: "{{title}}",
        required: true,
      },
      {
        id: "subtitle",
        type: "text",
        label: "Subtitle",
        defaultValue: "{{subtitle}}",
        required: false,
      },
      {
        id: "sections",
        type: "list",
        label: "Sections",
        defaultValue: "",
        required: true,
      },
      {
        id: "statistics",
        type: "stat",
        label: "Stats",
        defaultValue: "",
        required: false,
      },
      {
        id: "cta",
        type: "cta",
        label: "Call to Action",
        defaultValue: "{{cta}}",
        required: true,
      },
    ],
    themes: ["modern", "gradient"],
    fonts: ["inter", "poppins"],
    version: "1.0.0",
  },
];

export function getTemplateById(id: string): TemplateConfig | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): TemplateConfig[] {
  if (category === "all") return BUILT_IN_TEMPLATES;
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}
