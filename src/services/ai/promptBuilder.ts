import { AIGenerationRequest } from "@/lib/types";

// ============================================================
// STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
// Analyze the input. If it is brief, thin, or missing structure,
// AUTO-COMPLETE it with accurate, relevant, professional content so
// the downstream designer always has rich material to work with.
// ============================================================
export function buildContentAnalysisPrompt(request: AIGenerationRequest): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, purpose, userIntent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const purposeStr = purpose || "Not specified";
  const userIntentStr = userIntent || "No specific design intent";

  const dimensionsStr =
    aspectRatioWidth && aspectRatioHeight
      ? `${aspectRatioWidth}x${aspectRatioHeight}px`
      : aspectRatioStr === "9:16" ? "1080x1920px"
      : aspectRatioStr === "16:9" ? "1920x1080px"
      : aspectRatioStr === "4:5" ? "1080x1350px"
      : aspectRatioStr === "A4-P" ? "794x1123px"
      : aspectRatioStr === "A4-L" ? "1123x794px"
      : aspectRatioStr === "letter" ? "816x1056px"
      : "1080x1080px";

  let contentText = "";
  switch (inputType) {
    case "text": contentText = `Raw text input:\n${input}`; break;
    case "idea": contentText = `Idea/topic:\n${input}`; break;
    case "image": contentText = `Image uploaded - analyze and extract all relevant information`; break;
    case "image-url": contentText = `Image URL: ${input} - analyze and extract all relevant information`; break;
    default: contentText = `Input:\n${input}`;
  }

  return `You are a senior content strategist preparing material for a PROFESSIONAL INFOGRAPHIC.

## YOUR JOB
Analyze the source input, then produce a COMPLETE, clean, publication-ready content package. This content will be rendered as a gorgeous visual design, so quality and completeness are critical.

## PROCESS
1. **UNDERSTAND** the source. What is the core message, audience, and data?
2. **AUTO-COMPLETE** - This is MANDATORY. If the source is brief, vague, or missing structure, use accurate general knowledge to EXPAND it into a rich, relevant, well-structured infographic. Never leave gaps. Never output placeholders.
3. **REFINE** - Fix grammar/spelling, remove repetition and fluff, write punchy, high-impact copy.
4. **STRUCTURE** - Organize everything into ordered sections, extract real statistics, and create a timeline/process when it fits.

## ABSOLUTE RULES (a violation breaks the design)
- NEVER return empty arrays for sections/statistics/timeline. Always provide real content.
- NEVER use filler like "TBD", "Lorem ipsum", "placeholder", "...", "text", or empty strings in title, subtitle, section titles or content.
- Title: max 8 words, engaging, specific (never generic like "Infographic").
- Subtitle: max 14 words, supports the title.
- Sections: 4 to 6. Each needs "title", "content" (1-2 sentences), "bullets" (2-4 specific points), a "type" of "text"|"mixed", and an "icon" as a SHORT DESCRIPTIVE KEYWORD (e.g. "growth", "sales", "bulb", "chart", "users") - NOT an emoji.
- Statistics: 3 to 4 with realistic "value" strings and short "label"s. Prefer numbers with units (e.g. "95%", "3.2x", "120M+").
- Timeline: 2 to 5 items only if the content has a progression/steps/history; otherwise [].
- Language: match the source language when detectable, otherwise ${languageStr}.

## CANVAS
- Canvas: ${dimensionsStr}, Aspect Ratio: ${aspectRatioStr}
- Font preference: ${fontStr}, Purpose: ${purposeStr}
- Audience: ${audienceStr}
- Design Intent: ${userIntentStr}

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
// Ask AI HOW to design the content as premium HTML/CSS that fits
// the canvas. This becomes the exact design contract for Step 3.
// ============================================================
export function buildDesignBlueprintPrompt(content: unknown, request: AIGenerationRequest): string {
  const { aspectRatio, font, language, audience, userIntent } = request;
  const isPortrait = aspectRatio === "9:16" || aspectRatio === "4:5" || aspectRatio === "A4-P";
  const isWide = aspectRatio === "16:9" || aspectRatio === "A4-L";

  const dimensions =
    aspectRatio === "9:16" ? "1080x1920 (Tall Story/Portrait)"
    : aspectRatio === "16:9" ? "1920x1080 (Wide Landscape)"
    : aspectRatio === "4:5" ? "1080x1350 (Portrait)"
    : aspectRatio === "A4-P" ? "794x1123 (A4 Portrait)"
    : aspectRatio === "A4-L" ? "1123x794 (A4 Landscape)"
    : aspectRatio === "letter" ? "816x1056 (Letter)"
    : "1080x1080 (Square)";

  const layoutGuidance = isPortrait
    ? "PORTRAIT: stack sections vertically top-to-bottom; a strong header block on top, stats in a row, then a clean vertical flow of cards. Keep vertical rhythm tight so everything fits without scrolling."
    : isWide
    ? "WIDE: use a bold left header column and a right content zone, or a strong full-width hero with a multi-column grid below. Balance horizontal space."
    : "SQUARE: balanced all-around; header on top, stats band, and a tidy grid that fills the square without overflow.";

  return `You are a world-class visual designer and frontend engineer. Your job: produce a COMPLETE design blueprint for a BEAUTIFUL, premium infographic that will be hand-coded into HTML/CSS.

The design MUST look modern, intentional and expensive - never generic, never cluttered, never flat.

## DESIGN PRINCIPLES (non-negotiable)
1. **Cohesive palette** - Pick 4-5 harmonious colors that match the content theme. Use a dominant color, 1 accent, and neutrals with real contrast between text and background (never dark-on-dark or light-on-light for body text).
2. **Strong hierarchy** - A clear hero (title) that pops, obvious 1st/2nd/3rd reading order, big stats that command attention.
3. **Generous, structured spacing** - 8px grid; consistent gutters; breathing room between blocks (balanced empty areas are good, NOT cramped).
4. **Refined details** - subtle gradients, soft shadows, rounded corners, tasteful decorations (badge, chip, divider, geometric accents, number callouts). Avoid flat rectangles with no styling.
5. **Typography** - 1 display font for headings + Inter for body (2 weights max for headings, 1 for body). Sizes that are readable at the given canvas resolution.
6. **Layout fits the orientation** (see below).

## ORIENTATION GUIDANCE
${layoutGuidance}

## ANTI-PATTERNS - NEVER design:
- The default bootstrap "blue gradient button" look
- More than 2-3 font families or weights mixed randomly
- Emoji as icons (we use crisp keywords rendered as SVG/geometric marks)
- Text so small it is unreadable
- Unbalanced whitespace or floating empty regions
- Clashing, loud rainbow palettes with no logic

## CONTENT TO DESIGN
${JSON.stringify(content, null, 2)}

## USER DESIGN INTENT (follow it if provided)
${userIntent || "No specific design intent - craft a unique look that matches the content"}

## CANVAS SPECS
- Canvas: ${dimensions}
- Font: ${font || "Inter"}
- Language: ${language || "English"}
- Audience: ${audience || "General"}

## OUTPUT FORMAT - Return ONLY valid JSON, no markdown:
{
  "designConcept": "one-line concept for the look and feel",
  "layoutStyle": "descriptive layout approach for THIS orientation",
  "heroMoment": "concrete CSS technique for the title hero",
  "visualHierarchy": { "1st": "element + technique", "2nd": "element + technique", "3rd": "element + technique" },
  "readingFlow": "how the eye moves across the canvas",
  "spacingSystem": "8px grid with exact gutters",
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "typography": { "headingFont": "Google font name", "bodyFont": "Inter", "headingSize": "px", "bodySize": "px", "headingWeight": "800", "subheadingWeight": "600", "bodyWeight": "400", "style": "modern|corporate|playful|elegant|bold|minimal|tech|creative" },
  "icons": { "style": "crisp-svg|geometric-marker|minimal-line", "consistency": "ALL icons use the same stroke/weight", "perSection": ["keyword1","keyword2","keyword3","keyword4"] },
  "cardStyle": "tangible CSS treatment (bg, radius, shadow, border)",
  "spacing": "8px-grid-based",
  "alignment": "left|center",
  "statsStyle": "big-numbers|metric-tiles|progress-bars|circular-rings",
  "decorations": ["2-3 concrete decorative elements"],
  "background": "concrete, non-flat background treatment",
  "header": "concrete header treatment",
  "cta": "no CTA buttons - it is a static image",
  "specialFeatures": "what makes this design feel premium & unique",
  "animationHints": []
}`;
}

// ============================================================
// STEP 3: HTML/CSS GENERATION
// Translate the blueprint into hand-coded HTML/CSS that EXACTLY
// fills the canvas and never clips or looks unfinished.
// ============================================================
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest): string {
  const aspectRatio = request.aspectRatio || "1:1";
  let width = 1080, height = 1080;
  switch (aspectRatio) {
    case "9:16": width = 1080; height = 1920; break;
    case "16:9": width = 1920; height = 1080; break;
    case "4:5": width = 1080; height = 1350; break;
    case "A4-P": width = 794; height = 1123; break;
    case "A4-L": width = 1123; height = 794; break;
    case "letter": width = 816; height = 1056; break;
    default: width = 1080; height = 1080;
  }
  if (request.aspectRatioWidth && request.aspectRatioHeight) {
    width = request.aspectRatioWidth;
    height = request.aspectRatioHeight;
  }

  return `## STEP 3: HTML/CSS GENERATION
You are a senior frontend engineer. Build the COMPLETE HTML/CSS for this infographic. It will be rendered inside a fixed-size canvas, so it MUST fit perfectly and look polished.

### THE DESIGN CONTRACT (FOLLOW EXACTLY)
Use the blueprint's colors, typography, layout, spacing, card style, stats style, background and decorations verbatim:
${JSON.stringify(blueprint, null, 2)}

### CONTENT TO DISPLAY (ALL of it - nothing empty)
${JSON.stringify(content, null, 2)}

### CANVAS DIMENSIONS (MUST match exactly; content must FIT - do not overflow or clip)
- Width: ${width}px
- Height: ${height}px
- Set html & body to exactly these dimensions, overflow hidden, no scrollbars.

### QUALITY CHECKLIST (every item is mandatory)
1. Self-contained, valid HTML + CSS in one file starting with <!DOCTYPE html>.
2. Load fonts via Google Fonts <link> (the blueprint heading font + Inter). Use at most 2 font families and 3 weights total.
3. Readable body text (13px minimum at the canvas resolution, generous line-height).
4. Real contrast between text and background (use the blueprint palette; tweak shade if needed).
5. Use CSS custom properties (--primary, --secondary, --accent, --bg, --text, etc.).
6. Consistent spacing on an 8px grid.
7. Gradient text or styled hero for the title so it feels premium.
8. Fully styled cards (border-radius + shadow + subtle background) - no bare flat boxes.
9. Icons: render as inline SVG or clean geometric marks from the blueprint keywords. NO EMOJI anywhere.
10. Layout matches the orientation (portrait stacks vertically; wide uses a side column or multi-column grid).
11. For portrait/wide, make sure longer content fits by using flexbox/grid with controlled font sizes - reduce sizes gracefully rather than clipping text.
12. Background is not plain white - apply the blueprint treatment (gradient, mesh, pattern, shapes).

### CRITICAL - NO CALL-TO-ACTION
This is a static image/generic design, NOT a webpage. Do NOT include any buttons, links, "Click here", forms, or interactive controls. Pure visual design only.

### OUTPUT FORMAT
Start with <!DOCTYPE html>. Output ONLY the complete HTML file. No markdown, no explanations, no code fences.`;
}

/**
 * Revision prompt for design feedback (unused in the main flow)
 */
export function buildDesignRevisionPrompt(currentBlueprint: any, userFeedback: string, content: any): string {
  return `You are an expert designer revising an infographic design based on feedback.

## CURRENT BLUEPRINT
${JSON.stringify(currentBlueprint, null, 2)}

## CONTENT (unchanged)
${JSON.stringify(content, null, 2)}

## USER FEEDBACK
"${userFeedback}"

## YOUR TASK
Revise the design based on this feedback. Return the COMPLETE revised blueprint in the same JSON format.`;
}

/**
 * Image analysis prompt
 */
export function buildImageAnalysisPrompt(imageData: string): string {
  return `Analyze this image and extract detailed information in JSON format.

## EXTRACT:
### Colors: Dominant palette (5-8 hex colors), mood
### Text: Any visible text via OCR, font style
### Layout: Structure, visual hierarchy, spacing
### Theme: Visual theme, mood, aesthetic style
### Content: Subject matter, suggested sections, statistics

## OUTPUT FORMAT
{
  "colors": { "palette": [], "background": "", "primary": "", "accent": "", "text": "", "mood": "" },
  "text": { "ocrText": "", "fontStyle": "", "hierarchy": [] },
  "layout": { "structure": "", "visualHierarchy": [], "spacing": "", "alignment": "" },
  "visualTheme": { "theme": "", "mood": "", "style": "" },
  "suggestedSections": [],
  "subject": "",
  "objects": []
}

Image data: ${imageData.substring(0, 100)}...`;
}

export function buildPrompt(request: AIGenerationRequest): string {
  return buildContentAnalysisPrompt(request);
}
