import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// THEME DIRECTION (user-selected ThemeId → concrete style guide)
// Injected into every downstream prompt so the whole pipeline
// (content → blueprint → HTML) stays on the chosen theme.
// ============================================================

const THEME_DIRECTIONS: Record<string, string> = {
  auto: "Choose a cohesive palette that best matches the content and mood — premium and intentional.",
  light:
    "Light background (#f8fafc or #ffffff), dark slate text (#0f172a), one vibrant accent. Airy, crisp, high contrast, minimal decoration.",
  dark:
    "Deep near-black background (#0f172a / #020617), light text, glowing neon accent (violet or emerald). Moody, premium, high contrast.",
  minimal:
    "Near-monochrome. White/gray background, dark text, a single subtle accent. Generous whitespace, thin 1px borders, flat, no heavy shadows.",
  glassmorphism:
    "Frosted-glass panels floating over a soft gradient background. Semi-transparent white cards with backdrop blur, thin light borders, subtle top-edge highlights.",
  neumorphism:
    "Soft light-gray (#e0e5ec) background, extruded soft shadows (light from top-left, dark from bottom-right), barely-there accent. Tactile and understated.",
  corporate:
    "Blues and grays on a clean base, structured grid, restrained decoration, sans-serif typography. Trustworthy and professional.",
  modern:
    "Violet (#8b5cf6) + emerald (#10b981) accents on a clean base, soft rounded corners, subtle gradients and soft shadows. Fresh and contemporary.",
  gradient:
    "Vivid multi-color gradient fills (violet → pink → emerald) across headings, cards, and background bands. Energetic and eye-catching.",
  "midnight-blue":
    "Deep navy background with electric blue and cyan accents, subtle glow. Sleek and tech-forward.",
  "midnight-green":
    "Deep teal-green background with mint and gold accents. Sophisticated and calm.",
  material:
    "Google Material Design: bold primary color fills, elevation shadows, dense grid, colorful but ordered.",
  custom: "Follow the user's design intent exactly.",
};

function themeDirection(theme?: string): string {
  return THEME_DIRECTIONS[theme || "auto"] || THEME_DIRECTIONS.auto;
}

// ============================================================
// STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
// The AI receives the raw user input, COMPLETES and structures it
// into a rich content package. Everything downstream is built from
// this package, so it must be complete, accurate and publication-ready.
// ============================================================
export function buildContentAnalysisPrompt(request: AIGenerationRequest): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, purpose, userIntent, theme } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const purposeStr = purpose || "Not specified";
  const userIntentStr = userIntent || "No specific design intent";

  const { width, height } = getCanvasDimensions(aspectRatio, aspectRatioWidth, aspectRatioHeight);
  const dimensionsStr = `${width}x${height}px`;

  let contentText = "";
  switch (inputType) {
    case "text": contentText = `Raw text input:\n${input}`; break;
    case "idea": contentText = `Idea/topic:\n${input}`; break;
    case "image": contentText = `Image uploaded - analyze and extract all relevant information`; break;
    case "image-url": contentText = `Image URL: ${input} - analyze and extract all relevant information`; break;
    default: contentText = `Input:\n${input}`;
  }

  return `You are a senior content strategist and data journalist preparing material for a PROFESSIONAL INFOGRAPHIC. This is STEP 1 of a 3-step generation pipeline. Your ONLY job is content: produce a COMPLETE, clean, publication-ready content package. A later step will design it, so give the designer rich, specific, accurate material.

## YOUR JOB
Analyze the source input, then produce a complete content package. If the source is brief, vague, or unstructured, AUTO-COMPLETE it using accurate general knowledge so it becomes a rich, well-structured infographic. Never leave gaps, never use placeholders.

## PROCESS
1. **UNDERSTAND** the source: core message, audience, key facts.
2. **AUTO-COMPLETE** (mandatory): expand thin or missing content into real, relevant, professional copy derived from the source. If the source contains no data, synthesize realistic illustrative data clearly tied to the topic.
3. **REFINE**: fix grammar/spelling, remove fluff, write punchy high-impact copy.
4. **STRUCTURE**: organize into 4-6 ordered sections, extract 3-4 concrete statistics, and add a timeline/process (2-5 items) whenever the content has steps, history, or a progression; otherwise leave the timeline empty.

## ABSOLUTE RULES (a violation breaks the whole pipeline)
- NEVER return empty arrays for sections/statistics. Always provide real content.
- NEVER use filler like "TBD", "Lorem ipsum", "placeholder", "...", "text", or empty strings in title, subtitle, section titles, content, or bullets.
- Title: max 8 words, engaging, specific (never generic like "Infographic").
- Subtitle: max 14 words, supports the title.
- Sections: 4 to 6. Each needs "title", "content" (1-2 sentences), "bullets" (2-4 specific points), an "icon" as a SHORT DESCRIPTIVE KEYWORD (e.g. "growth", "sales", "bulb", "chart", "users") - NOT an emoji, and "type": "mixed".
- Statistics: 3 to 4 with realistic "value" strings and short "label"s. Prefer numbers with units (e.g. "95%", "3.2x", "120M+").
- Timeline: 2 to 5 items only if the content has a progression/steps/history; otherwise [].
- Language: match the source language when detectable, otherwise ${languageStr}.
- BEFORE OUTPUT: re-read your JSON and confirm every required field is present, non-empty, and derived from real content.

## CONTEXT
- Canvas: ${dimensionsStr}, Aspect Ratio: ${aspectRatioStr}
- Font preference: ${fontStr}, Purpose: ${purposeStr}
- Audience: ${audienceStr}
- Design Intent: ${userIntentStr}
- User-selected theme direction: ${themeDirection(theme)}

## SOURCE
${contentText}

## OUTPUT FORMAT - Return ONLY valid JSON, no markdown:
{
  "isComplete": true,
  "primaryAudience": "string",
  "keyMessage": "one crisp sentence",
  "dataDensity": "info-rich|minimal|balanced",
  "correctedContent": {
    "title": "string",
    "subtitle": "string",
    "sections": [
      { "id": "section-1", "title": "string", "content": "string", "bullets": ["string"], "icon": "keyword", "type": "mixed" }
    ],
    "statistics": [
      { "id": "stat-1", "value": "95%", "label": "string", "prefix": "", "suffix": "%", "icon": "keyword" }
    ],
    "timeline": [
      { "id": "t-1", "date": "2024", "title": "string", "description": "string", "icon": "keyword" }
    ],
    "suggestedIcons": ["keyword1", "keyword2", "keyword3", "keyword4"],
    "suggestedColors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
    "callToAction": "",
    "language": "detected-language"
  }
}`;
}

// ============================================================
// STEP 2: DESIGN BLUEPRINT
// The AI receives the COMPLETED content and specifies EXACTLY how
// to design it in HTML/CSS for the chosen aspect ratio, honoring the
// user's theme + design intent. This blueprint is the contract for STEP 3.
// ============================================================
export function buildDesignBlueprintPrompt(content: unknown, request: AIGenerationRequest): string {
  const { aspectRatio, userIntent, purpose, theme } = request;
  const isPortrait = aspectRatio === "9:16" || aspectRatio === "4:5" || aspectRatio === "A4-P";
  const isWide = aspectRatio === "16:9" || aspectRatio === "A4-L";

  const { width, height } = getCanvasDimensions(aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
  const dimensions = `${width}x${height}`;

  const layoutGuidance = isPortrait
    ? "PORTRAIT: stack sections vertically top-to-bottom; a strong header block on top, stats in a row, then a clean vertical flow of cards. Keep vertical rhythm tight so everything fits without scrolling."
    : isWide
      ? "WIDE: use a bold left header column and a right content zone, or a strong full-width hero with a multi-column grid below. Balance horizontal space."
      : "SQUARE: balanced all-around; header on top, stats band, and a tidy grid that fills the square without overflow.";

  return `You are a world-class visual designer and frontend engineer. This is STEP 2 of a 3-step pipeline. Your job: produce a COMPLETE design blueprint — a precise design-system spec — that will be hand-coded into HTML/CSS in STEP 3. The design MUST look modern, intentional and expensive — never generic, never cluttered, never flat.

## THE CONTENT TO DESIGN (produced in STEP 1 — use ALL of it)
${JSON.stringify(content, null, 2)}

## HARD CONSTRAINTS
- Canvas: ${dimensions}px (must be filled exactly, nothing clipped, no scrollbars).
- Orientation: ${isPortrait ? "PORTRAIT" : isWide ? "WIDE (landscape)" : "SQUARE"}.
- ${layoutGuidance}
- The STEP 3 engineer follows this blueprint VERBATIM. Every value must be concrete and unambiguous: exact hex colors, exact px font sizes, exact spacing. No vague phrases like "use a nice color".

## USER-SELECTED THEME DIRECTION (this is MANDATORY — design within it)
${themeDirection(theme)}

## USER DESIGN INTENT (override the theme only where the user explicitly asks)
"${userIntent || "none — craft a unique premium look that matches the content"}"

## LAYOUT BY PURPOSE (pick the structure that fits, then adapt to the orientation)
- timeline/history: vertical timeline with connected nodes, alternating content, dates emphasized.
- comparison vs: 2-3 clear columns with contrasting headers and a visual divider.
- statistics/data: 3-6 large-number cards with icons, progress bars, or mini charts.
- process/how-to: numbered steps with connecting arrows, horizontal or vertical.
- listicle/tips: numbered or icon cards in a tidy grid.
- educational/explainer: header + two-column (text | visual) or full-width sections.
- social/marketing: bold headline, one hero stat, punchy sub-points, branded colors.
Chosen purpose: ${purpose || "auto (pick the most fitting structure)"}

## DESIGN PRINCIPLES (non-negotiable)
1. **Cohesive palette (60-30-10)** - Build a 4-5 color palette that matches the theme direction AND content: DOMINANT (~60%) for large fills/background, SECONDARY (~30%) for cards/sections, ACCENT (~10%) for key numbers/highlights, plus neutrals for text. Guarantee WCAG AA contrast (>=4.5:1) between body text and its background. Provide EXACT hex values.
2. **Strong hierarchy** - A hero (title) that pops, obvious 1st/2nd/3rd reading order, big stats that command attention.
3. **Generous structured spacing** - 8px grid; consistent gutters; breathing room between blocks.
4. **Refined details** - subtle gradients, soft shadows, rounded corners, tasteful decorations (badges, chips, dividers, geometric accents, number callouts). Never flat rectangles.
5. **Typography** - Max 2 font families (1 display + 1 body). Weight and size drive hierarchy. At most 3 text colors. Give EXACT sizes in px readable at ${width}x${height}.
6. **Icons** - descriptive keywords rendered as crisp inline SVG or geometric marks. NEVER emoji.

## OUTPUT FORMAT - Return ONLY valid JSON, no markdown. Be explicit and complete:
{
  "designConcept": "one-line concept for the look and feel",
  "layoutStyle": "descriptive layout approach for THIS orientation",
  "heroMoment": "concrete CSS technique for the title hero",
  "visualHierarchy": { "1st": "element + technique", "2nd": "element + technique", "3rd": "element + technique" },
  "readingFlow": "how the eye moves across the canvas",
  "spacingSystem": "exact gutters on an 8px grid",
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "typography": { "headingFont": "Google font name", "bodyFont": "Inter", "headingSize": "px", "bodySize": "px", "headingWeight": "800", "subheadingWeight": "600", "bodyWeight": "400", "style": "modern|corporate|playful|elegant|bold|minimal|tech|creative" },
  "icons": { "style": "crisp-svg|geometric-marker|minimal-line", "consistency": "ALL icons use the same stroke/weight", "perSection": ["keyword1","keyword2","keyword3","keyword4"] },
  "cardStyle": "tangible CSS treatment (bg, radius, shadow, border) with exact values",
  "spacing": "8px-grid-based",
  "alignment": "left|center",
  "statsStyle": "big-numbers|metric-tiles|progress-bars|circular-rings",
  "decorations": ["2-3 concrete decorative elements"],
  "background": "concrete, non-flat background treatment with exact colors",
  "header": "concrete header treatment",
  "cta": "no CTA buttons - it is a static image",
  "specialFeatures": "what makes this design feel premium & unique",
  "animationHints": []
}`;
}

// ============================================================
// STEP 3: HTML/CSS GENERATION
// The AI receives the COMPLETED content AND the blueprint, then codes
// the final HTML/CSS exactly as the blueprint specifies. The result is
// validated and scored, then kept if it passes quality gates.
// ============================================================
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest): string {
  const { width, height } = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);

  return `## STEP 3: HTML/CSS GENERATION
You are a senior frontend engineer. Code the COMPLETE HTML/CSS for this infographic. It will be rendered inside a fixed-size canvas (${width}x${height}px), so it MUST fit perfectly and look polished. This is the final step — the output IS the product.

### THE DESIGN SYSTEM (THE CONTRACT — FOLLOW EXACTLY)
The blueprint below is the design system. Use its colors, typography, spacing, card style, stats style, background, decorations, and layout VERBATIM. Convert it into CSS custom properties (tokens) in your <style> block, then build every element from those tokens.
${JSON.stringify(blueprint, null, 2)}

### THEME DIRECTION (keep the design inside it)
${themeDirection(request.theme)}

### USER DESIGN INTENT
"${request.userIntent || "none"}"

### CONTENT TO DISPLAY (ALL of it — nothing empty, nothing omitted)
${JSON.stringify(content, null, 2)}

### CANVAS DIMENSIONS (MUST match exactly; content MUST FIT — no overflow, no clipping)
- Width: ${width}px
- Height: ${height}px
- html & body: exactly these dimensions, overflow hidden, no scrollbars.
- Print ratios (A4/Letter): keep the same px dimensions (96dpi) but use generous margins so nothing is cut off when printed.

### CONSTRUCTION CHECKLIST (build in this order)
1. Define CSS custom properties from the blueprint: --primary, --secondary, --accent, --bg, --text, --heading, --body, --radius, --shadow, --spacing, etc.
2. Create a non-flat background treatment per the blueprint (gradient, mesh, pattern, or colored bands) using the exact colors.
3. Build the header/hero per the blueprint's "heroMoment" (e.g. gradient text title, oversized display heading).
4. Render EVERY statistic as a visual element (big number, progress bar, donut via SVG, or icon counter) — never a lone plain number.
5. Render EVERY section inside a styled card (border-radius + shadow + colored background) per "cardStyle".
6. Render the timeline (if any) as the blueprint describes (connected nodes, dates emphasized).
7. Add the blueprint's "decorations" (badges, dividers, geometric accents, number callouts).
8. Verify no content is cut off: reduce font sizes gracefully if a block overflows rather than clipping.

### QUALITY CHECKLIST (every item mandatory)
1. Self-contained valid HTML + CSS starting with <!DOCTYPE html>. No markdown, no code fences, no explanations.
2. Load fonts via Google Fonts <link> (the blueprint heading font + Inter). Max 2 font families, max 3 weights.
3. Readable body text (13px minimum at this resolution, generous line-height).
4. Real contrast (>=4.5:1) between text and background per the palette.
5. Icons as inline SVG or clean geometric marks. NO EMOJI anywhere.
6. Layout matches the orientation (portrait stacks vertically; wide uses side column or multi-column grid).
7. No CTA buttons, links, forms, or interactive controls — this is a static visual.
8. Everything is visible without scrolling within the ${width}x${height}px canvas.

### OUTPUT FORMAT
Start with <!DOCTYPE html>. Output ONLY the complete HTML file.`;
}