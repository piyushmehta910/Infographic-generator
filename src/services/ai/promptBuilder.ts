import { AIGenerationRequest } from "@/lib/types";

/**
 * STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION
 * First ask AI to analyze, auto-complete missing info, and improve content
 */
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
      ? `${aspectRatioWidth}×${aspectRatioHeight}px`
      : aspectRatioStr === "9:16" ? "1080×1920px"
      : aspectRatioStr === "16:9" ? "1920×1080px"
      : aspectRatioStr === "4:5" ? "1080×1350px"
      : aspectRatioStr === "A4-P" ? "794×1123px"
      : aspectRatioStr === "A4-L" ? "1123×794px"
      : aspectRatioStr === "letter" ? "816×1056px"
      : "1080×1080px";

  let contentText = "";
  switch (inputType) {
    case "text": contentText = `Raw text input:\n${input}`; break;
    case "idea": contentText = `Idea/topic:\n${input}`; break;
    case "image": contentText = `Image uploaded - analyze and extract all relevant information`; break;
    case "image-url": contentText = `Image URL: ${input} - analyze and extract all relevant information`; break;
    default: contentText = `Input:\n${input}`;
  }

  return `You are an expert content analyst creating content for a PROFESSIONAL INFOGRAPHIC.

## YOUR TASK (3-STEPS)
1. **AUTO-COMPLETE**: If the input is incomplete or lacking detail, add relevant information to make it comprehensive. Fill in any gaps.
2. **IMPROVE**: Fix grammar, spelling, wording. Remove repetition. Make it professional and impactful.
3. **STRUCTURE**: Organize into sections, extract statistics, create timeline if applicable.

## CANVAS SPECIFICATIONS
- Canvas: ${dimensionsStr}
- Aspect Ratio: ${aspectRatioStr}
- Purpose: ${purposeStr}
- Design Intent: ${userIntentStr}

## INPUT CONTENT
${contentText}

## OUTPUT FORMAT - Return ONLY valid JSON:
{
  "isComplete": true,
  "primaryAudience": "string",
  "keyMessage": "string",
  "dataDensity": "info-rich|minimal|balanced",
  "correctedContent": {
    "title": "UNIQUE, ENGAGING TITLE (max 10 words)",
    "subtitle": "Supporting subtitle (max 15 words)",
    "sections": [
      {
        "id": "section-1",
        "title": "Section Title",
        "content": "Well-written paragraph",
        "bullets": ["Key point 1", "Key point 2", "Key point 3"],
        "icon": "📊",
        "type": "mixed"
      }
    ],
    "statistics": [
      { "id": "stat-1", "value": "95%", "label": "Label", "prefix": "", "suffix": "%", "icon": "📈" }
    ],
    "timeline": [
      { "id": "t-1", "date": "2024", "title": "Milestone", "description": "Description", "icon": "📍" }
    ],
    "suggestedIcons": ["📊", "📈", "💡", "🎯"],
    "suggestedColors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "text": "#hex"
    },
    "callToAction": "→",
    "language": "detected-language",
    "wordCount": 0,
    "summary": "One sentence summary"
  }
}`;
}

/**
 * STEP 2: DESIGN BLUEPRINT
 * Ask AI how to design this content as HTML/CSS - get the design plan
 */
export function buildDesignBlueprintPrompt(content: unknown, request: AIGenerationRequest): string {
  const { aspectRatio, font, language, audience, userIntent } = request;

  const dimensions =
    aspectRatio === "9:16" ? "1080×1920 (Story/Portrait)"
    : aspectRatio === "16:9" ? "1920×1080 (Landscape)"
    : aspectRatio === "4:5" ? "1080×1350 (Portrait)"
    : aspectRatio === "A4-P" ? "794×1123 (A4 Portrait)"
    : aspectRatio === "A4-L" ? "1123×794 (A4 Landscape)"
    : aspectRatio === "letter" ? "816×1056 (Letter)"
    : "1080×1080 (Square)";

  const seed = Math.floor(Math.random() * 10000);
  const layouts = ["hero-card", "split-layout", "magazine-grid", "card-based", "asymmetric", "Z-pattern", "full-bleed", "stacked-sections", "dashboard-style", "circular-flow", "modular-grid", "timeline-flow"];
  const selectedLayout = layouts[seed % layouts.length];

  return `You are an EXPERT infographic designer and frontend developer.

## YOUR TASK: Design a complete HTML/CSS layout for this infographic content
Plan the EXACT layout, colors, typography, and visual hierarchy. This blueprint will be used to generate the actual HTML/CSS.

🎲 DESIGN SEED: ${seed}
🎯 SUGGESTED LAYOUT: ${selectedLayout}

## CONTENT TO DESIGN
${JSON.stringify(content, null, 2)}

## USER DESIGN INTENT (CRITICAL - Follow this if provided)
${userIntent || "No specific design intent - create a unique design based on the content"}

## CANVAS SPECS
- Canvas: ${dimensions}
- Base font: ${font || "Inter"}
- Language: ${language || "English"}
- Audience: ${audience || "General"}

## DESIGN REQUIREMENTS
1. **Layout**: Choose ONE unique layout style
2. **Color Palette**: 5 coordinated colors based on content theme
3. **Typography**: Exactly 3 font weights (400, 600, 800)
4. **Spacing**: 8px grid system - ALL values must be multiples of 8
5. **Hero Moment**: Bold first element that immediately communicates purpose
6. **Visual Hierarchy**: Define exact 1st, 2nd, 3rd draw with CSS techniques
7. **Card Style**: Unique card treatment
8. **Icon Style**: Consistent style throughout
9. **Stats Display**: Big numbers that pop
10. **Background**: Not plain - use gradient, pattern, or texture

## ANTI-PATTERNS - DO NOT:
- No generic blue gradients
- No flat, lifeless designs
- No more than 3 font weights
- No inconsistent icon styles
- No arbitrary spacing (must be 8px grid)

## OUTPUT FORMAT - Return ONLY valid JSON:
{
  "designConcept": "UNIQUE design concept description",
  "layoutStyle": "${selectedLayout}",
  "heroMoment": "description with specific CSS",
  "visualHierarchy": {
    "1st": "element + CSS technique",
    "2nd": "element + CSS technique", 
    "3rd": "element + CSS technique"
  },
  "sectionCount": 4,
  "readingFlow": "how the eye moves",
  "spacingSystem": "8px grid",
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "headingSize": "32-48px",
    "bodySize": "13-16px",
    "headingWeight": "800",
    "subheadingWeight": "600",
    "bodyWeight": "400",
    "style": "modern|corporate|playful|elegant|bold|minimal|tech|creative"
  },
  "icons": {
    "style": "emoji-in-circle|emoji-in-square|emoji-alone|emoji-with-bg",
    "consistency": "ALL icons use same style",
    "perSection": ["icon1", "icon2", "icon3", "icon4"]
  },
  "cardStyle": "unique card treatment",
  "spacing": "8px-grid-based",
  "alignment": "left|center|right",
  "statsStyle": "big-numbers|progress-bars|circular-rings|metric-tiles|icon-badges",
  "decorations": ["2-3 decorative elements"],
  "background": "unique background treatment",
  "header": "unique header styling",
  "cta": "unique CTA treatment",
  "specialFeatures": "what makes this unique",
  "animationHints": ["hover states", "transitions", "entrance animations"]
}`;
}

/**
 * STEP 3: HTML/CSS GENERATION
 * Use the design blueprint to generate actual HTML/CSS code
 */
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest): string {
  const { aspectRatio } = request;

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

  return `You are an EXPERT frontend developer. Generate a production-quality HTML/CSS infographic following the design blueprint EXACTLY.

## STEP 3: HTML/CSS GENERATION
Use the design blueprint below to generate the actual HTML/CSS code. The blueprint tells you HOW to design it - now implement it.

## CONTENT (Use ALL of this data EXACTLY)
${JSON.stringify(content, null, 2)}

## DESIGN BLUEPRINT (Follow this design EXACTLY)
${JSON.stringify(blueprint, null, 2)}

## CRITICAL: CANVAS DIMENSIONS - MUST BE EXACT
- Canvas: ${width}px WIDTH × ${height}px HEIGHT
- HTML body: width: ${width}px; height: ${height}px; overflow: hidden;
- ALL content MUST fit within these exact dimensions - NO EXCEPTIONS
- If content doesn't fit, reduce font sizes and spacing - DO NOT overflow
- For portrait (9:16, 4:5): Vertical flow with compact spacing
- For landscape (16:9, A4-L): Horizontal flow with side-by-side layouts
- For square (1:1): Balanced grid layout

## CSS REQUIREMENTS (ALL MANDATORY)
1. CSS custom properties for colors in :root
2. Google Fonts: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap')
3. 8px grid spacing - ALL padding/margin/gap must be multiples of 8
4. clamp() for ALL font sizes
5. Gradient text for title: background-clip: text; -webkit-background-clip: text; color: transparent;
6. CSS Grid & Flexbox for layouts
7. Media queries: @media (max-width: 768px) and @media (max-width: 320px)
8. Self-contained - NO external dependencies (except Google Fonts)
9. Hover states with transitions
10. box-shadow with explicit values for depth

## HTML STRUCTURE
1. HEADER: Title (gradient text) + subtitle
2. STATISTICS: Visual stat cards with big numbers (font-weight: 800)
3. SECTIONS: 2-3 column grid of content cards with icons
4. TIMELINE: If content has timeline data
5. CTA: Only if content.callToAction is not empty

## OUTPUT FORMAT
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    :root { --color-primary: #...; --color-secondary: #...; --color-accent: #...; --color-background: #...; --color-text: #...; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: 'Inter', sans-serif; }
    /* COMPLETE STYLING */
  </style>
</head>
<body>
  <div class="container">
    <!-- COMPLETE HTML -->
  </div>
</body>
</html>
\`\`\`

OUTPUT ONLY THE HTML. Start with <!DOCTYPE html>. End with </html>. Make it look professionally designed, not AI-generated.`;
}

/**
 * Revision prompt for user feedback
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