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

  return `You are a senior content strategist and data journalist preparing material for a PROFESSIONAL INFOGRAPHIC. This is PHASE 1 (Content Analysis & Structuring) of a 4-phase pipeline (Content -> Design Plan -> HTML/CSS Build -> Export). Your ONLY job is content: produce a COMPLETE, clean, publication-ready content package. The design phase will build from it, so give the designer rich, specific, accurate material.

## YOUR JOB
Analyze the source input, then produce a complete content package. If the source is brief, vague, or unstructured, AUTO-COMPLETE it using accurate general knowledge so it becomes a rich, well-structured infographic. Never leave gaps, never use placeholders.

## PROCESS
1. **UNDERSTAND** the source: core message, audience, key facts, tone.
2. **AUTO-COMPLETE** (mandatory): expand thin or missing content into real, relevant, professional copy derived from the source. If the source contains no data, synthesize realistic illustrative data clearly tied to the topic.
3. **REFINE**: fix grammar/spelling, remove fluff, write punchy high-impact copy.
4. **STRUCTURE**: organize into 4-6 ordered sections, extract 3-4 concrete statistics, and add a timeline/process (2-5 items) whenever the content has steps, history, or a progression; otherwise leave the timeline empty.
5. **DESIGN FOR SCANNING**: convert every idea into scannable formats (bullets, stats, short blocks). Pick ONE "hero stat" — the single most important number — and make sure it stands out.

## ABSOLUTE RULES (a violation breaks the whole pipeline)
- NEVER return empty arrays for sections/statistics. Always provide real content.
- NEVER use filler like "TBD", "Lorem ipsum", "placeholder", "...", "text", or empty strings in title, subtitle, section titles, content, or bullets.
- Title: max 8 words, engaging, specific (never generic like "Infographic").
- Subtitle: max 14 words, supports the title.
- Sections: 4 to 6 (hard cap 7 — cognitive load). Each needs "title", "content" (1-2 sentences, max ~25 words), "bullets" (2-4 specific points), an "icon" as a SHORT DESCRIPTIVE KEYWORD (e.g. "growth", "sales", "bulb", "chart", "users") - NOT an emoji, and "type": "mixed".
- Statistics: 3 to 4 with realistic "value" strings and short "label"s. Prefer numbers with units (e.g. "95%", "3.2x", "120M+"). Set "heroStat" to the single most important number.
- Timeline: 2 to 5 items only if the content has a progression/steps/history; otherwise [].
- Visual variety: mix stat cards, icon lists, and a timeline — never a wall of text blocks.
- Language: match the source language when detectable, otherwise ${languageStr}.
- Self-check before output: single clear message? stats contextualized? copy scannable? visual variety? makes sense without the original source?

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
    "heroStat": { "value": "95%", "label": "string" },
    "timeline": [
      { "id": "t-1", "date": "2024", "title": "string", "description": "string", "icon": "keyword" }
    ],
    "suggestedIcons": ["keyword1", "keyword2", "keyword3", "keyword4"],
    "suggestedColors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
    "callToAction": "",
    "language": "detected-language",
    "storyArc": ["opening problem", "development points", "climax insight", "resolution/CTA"],
    "toneAnalysis": { "detectedTone": "professional|casual|playful|urgent|educational|luxury|technical", "languageStyle": "formal|conversational|punchy|narrative" },
    "colorPsychologyRecommendation": { "primaryEmotion": "trust|growth|urgency|calm|energy|luxury|innovation", "suggestedHueFamily": "blue|green|red|orange|purple|teal|monochrome", "rationale": "why this palette fits the content emotion" },
    "contentGaps": ["assumptions or data that needs verification"]
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

  return `You are a world-class UI/UX designer and CSS architect. This is PHASE 2 (Design Architecture & Planning) of a 4-phase pipeline. Your job: produce a COMPLETE design specification — the exact design system an engineer will hand-code into HTML/CSS in PHASE 3. The design MUST look modern, intentional and expensive — never generic, never cluttered, never flat.

## THE CONTENT TO DESIGN (produced in PHASE 1 — use ALL of it)
${JSON.stringify(content, null, 2)}

## HARD CONSTRAINTS
- Canvas: ${dimensions}px (must be filled exactly, nothing clipped, no scrollbars).
- Orientation: ${isPortrait ? "PORTRAIT" : isWide ? "WIDE (landscape)" : "SQUARE"}.
- ${layoutGuidance}
- The PHASE 3 engineer follows this spec VERBATIM. Every value must be concrete and unambiguous: exact hex colors, exact px/clamp font sizes, exact spacing. No vague phrases like "use a nice color".

## USER-SELECTED THEME DIRECTION (this is MANDATORY — design within it)
${themeDirection(theme)}

## USER DESIGN INTENT (override the theme only where the user explicitly asks)
"${userIntent || "none — craft a unique premium look that matches the content"}"

## CONTENT TONE & COLOR PSYCHOLOGY (from PHASE 1 — align your palette to them)
Tone: ${JSON.stringify((content as any)?.tone || "professional")}
Color psychology: ${JSON.stringify((content as any)?.colorPsychology || "match the content emotion")}

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
1. **Visual hierarchy** - Apply an F-pattern (text-heavy content), Z-pattern (story-driven), or pyramid (data/statistical content). The hero stat must be 2-3x larger than body text.
2. **Cohesive 60-30-10 palette** - DOMINANT (~60%) for large fills/background, SECONDARY (~30%) for cards/sections, ACCENT (~10%) for key numbers/highlights, plus neutrals for text. Guarantee WCAG AA contrast (>=4.5:1) between body text and its background. Provide EXACT hex values.
3. **Grid & spacing** - 8px base grid (8/16/24/32/48/64/96). Consistent gutters; breathing room between blocks.
4. **Shape language** - match the design intent: corporate sharp corners (0-4px), playful rounded (12-24px), luxury subtle (4-8px) with thin borders, modern asymmetric/overlapping shapes.
5. **Typography scale** - Max 2 font families (1 display + 1 body), max 3 weights. Use clamp() for fluid scaling: hero 64-120px, h1 48-72px, h2 28-36px, body 16-20px, caption 12-14px. Size and weight drive hierarchy.
6. **Refined details** - subtle gradients, soft shadows, rounded corners, tasteful decorations (badges, chips, dividers, geometric accents, number callouts). Never flat rectangles.
7. **Icons** - descriptive keywords rendered as crisp inline SVG or geometric marks. NEVER emoji.

## OUTPUT FORMAT - Return ONLY valid JSON, no markdown. Be explicit and complete:
{
  "designSystem": { "aspectRatio": "chosen ratio", "canvasDimensions": { "width": ${width}, "height": ${height}, "responsiveBehavior": "scale_down|crop|reflow" }, "designIntent": "chosen intent", "shapeLanguage": { "borderRadius": "px value", "cardStyle": "flat|elevated|outlined|glassmorphism", "cornerTreatment": "sharp|rounded|asymmetric" } },
  "designConcept": "one-line concept for the look and feel",
  "layoutStyle": "descriptive layout approach for THIS orientation",
  "heroMoment": "concrete CSS technique for the title hero",
  "visualHierarchy": { "1st": "element + technique", "2nd": "element + technique", "3rd": "element + technique" },
  "readingFlow": "how the eye moves across the canvas",
  "spacingSystem": "exact gutters on an 8px grid",
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "colorDetails": { "gradients": [ { "name": "hero_gradient", "type": "linear|radial", "direction": "135deg", "stops": ["#hex 0%", "#hex 100%"], "usage": "header background" } ], "neutrals": { "surface": "#hex", "surfaceVariant": "#hex", "textSecondary": "#hex", "border": "#hex" }, "contrastValidation": { "titleOnBackground": "pass", "bodyOnSurface": "pass", "accentOnPrimary": "pass", "wcagAACompliant": true } },
  "typography": { "headingFont": "Google font name", "bodyFont": "Inter", "headingSize": "px", "bodySize": "px", "headingWeight": "800", "subheadingWeight": "600", "bodyWeight": "400", "style": "modern|corporate|playful|elegant|bold|minimal|tech|creative", "typeScale": { "hero": "clamp(64px, 8vw, 120px)", "h1": "clamp(48px, 5vw, 72px)", "h2": "clamp(28px, 3vw, 36px)", "body": "clamp(16px, 1.5vw, 20px)", "caption": "clamp(12px, 1vw, 14px)" }, "specialTreatments": { "heroStat": "extra bold, accent color", "pullQuote": "italic, left border accent", "callout": "bold, accent background" } },
  "icons": { "style": "crisp-svg|geometric-marker|minimal-line", "consistency": "ALL icons use the same stroke/weight", "perSection": ["keyword1","keyword2","keyword3","keyword4"] },
  "cardStyle": "tangible CSS treatment (bg, radius, shadow, border) with exact values",
  "spacing": "8px-grid-based",
  "alignment": "left|center",
  "statsStyle": "big-numbers|metric-tiles|progress-bars|circular-rings",
  "decorations": ["2-3 concrete decorative elements"],
  "background": "concrete, non-flat background treatment with exact colors",
  "header": "concrete header treatment",
  "cta": "no CTA buttons - it is a static image",
  "layoutGrid": { "gridType": "12-column", "sectionsPlacement": [ { "sectionId": 1, "gridArea": "1 / 1 / span 1 / -1", "backgroundTreatment": "solid|gradient|pattern", "minHeight": "20%" } ], "responsiveBehavior": "desktop full grid / tablet 2-col / mobile single column" },
  "visualElements": [ { "type": "icon|chart|connector|badge|shape|pattern", "placement": "section id + position + size", "style": "line|filled|gradient", "animation": "none|fade|slide|scale|draw" } ],
  "cssArchitecture": { "approach": "vanilla_css_inline", "methodology": "BEM", "keyCustomProperties": ["--color-primary", "--font-heading", "--spacing-unit", "--radius-base"], "responsiveStrategy": "desktop-first", "performanceNotes": "inline critical CSS, no external images" },
  "animations": { "pageLoad": "staggered fade-in for sections", "statCounter": "count-up for hero stat", "hoverStates": "subtle scale or shadow", "reducedMotion": "respect prefers-reduced-motion: disable all animation" },
  "specialFeatures": "what makes this design feel premium & unique",
  "animationHints": [],
  "designRationale": "why these specific colors, layout, and fonts best serve the content emotion and user intent (reference design psychology)"
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

  return `## PHASE 3: HTML/CSS GENERATION & REFINEMENT
You are a senior frontend engineer and visual designer. Code the COMPLETE HTML/CSS for this infographic. It will be rendered inside a fixed-size canvas (${width}x${height}px), so it MUST fit perfectly and look polished. This is the final build phase — the output IS the product.

### THE DESIGN SYSTEM (THE CONTRACT — FOLLOW EXACTLY)
The blueprint below is the design system. Use its colors, typography, spacing, card style, stats style, background, decorations, layout grid, and animations VERBATIM. Convert it into CSS custom properties (tokens) in your <style> block, then build every element from those tokens.
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

### CODE ARCHITECTURE
1. Semantic HTML5: <article class="infographic"> wrapper, <header>, <section data-section-id>, <figure>/<figcaption> for data, proper heading hierarchy (h1 -> h2 -> h3, no skips), aria-labels on icon-only/decorative elements.
2. Define CSS custom properties from the blueprint: --primary, --secondary, --accent, --bg, --text, --heading, --body, --radius, --shadow, --spacing, etc.
3. Create a non-flat background treatment per the blueprint (gradient, mesh, pattern, or colored bands) using the exact colors.
4. Build the header/hero per the blueprint's "heroMoment" (e.g. gradient text title, oversized display heading).
5. Render EVERY statistic as a visual element (big number, progress bar, donut via SVG, or icon counter) — never a lone plain number.
6. Render EVERY section inside a styled card (border-radius + shadow + colored background) per "cardStyle".
7. Render the timeline (if any) as the blueprint describes (connected nodes, dates emphasized).
8. Add the blueprint's "decorations" (badges, dividers, geometric accents, number callouts).
9. Verify no content is cut off: reduce font sizes gracefully if a block overflows rather than clipping.

### ANIMATIONS (CSS only — no JavaScript)
- Use CSS keyframes only. Staggered fade-in for sections, count-up feel for hero stats, subtle hover states.
- ALWAYS wrap animations in @media (prefers-reduced-motion: no-preference) and disable them otherwise.

### PRINT STYLES (required)
- Add an @media print block: print-color-adjust: exact, and keep the exact canvas size so nothing clips.

### QUALITY CHECKLIST (every item mandatory — self-evaluate before output)
1. Self-contained valid HTML + CSS starting with <!DOCTYPE html>. No markdown, no code fences, no explanations.
2. Load fonts via Google Fonts <link> (the blueprint heading font + Inter). Max 2 font families, max 3 weights.
3. Readable body text (13px minimum at this resolution, generous line-height).
4. Real contrast (>=4.5:1) between text and background per the palette.
5. Icons as inline SVG or clean geometric marks. NO EMOJI anywhere.
6. Layout matches the orientation (portrait stacks vertically; wide uses side column or multi-column grid).
7. No CTA buttons, links, forms, or interactive controls — this is a static visual.
8. Everything is visible without scrolling within the ${width}x${height}px canvas.
9. No external images, no <script>, no inline event handlers.

### OUTPUT FORMAT
Start with <!DOCTYPE html>. Output ONLY the complete HTML file. End the file with an HTML comment block named DESIGN NOTES that explains your key layout/color/typography choices in 3-4 lines.`;
}