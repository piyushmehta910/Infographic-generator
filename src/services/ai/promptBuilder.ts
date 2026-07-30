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
1. **VALIDATE**: FIRST check if the content is complete. If incomplete or vague, auto-complete with relevant details.
2. **IMPROVE**: Fix grammar, spelling, wording. Remove repetition. Make it professional and impactful.
3. **STRUCTURE**: Organize into sections, extract statistics, create timeline if applicable.

## IMPORTANT
- If content is INCOMPLETE, set isComplete to false and provide suggestions
- If COMPLETE, set isComplete to true and provide full corrected content

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

  return `## STEP 3: HTML/CSS GENERATION
You are an EXPERT frontend developer. Your job is to translate the design blueprint into actual HTML/CSS code.

### ⚠️ CRITICAL RULE: FOLLOW THE BLUEPRINT EXACTLY
The blueprint below is your DESIGN DECISION. You MUST implement it exactly:
- Use the EXACT layout style specified
- Use the EXACT color palette specified
- Use the EXACT typography specified
- Follow the EXACT visual hierarchy specified
- Apply the EXACT spacing system specified
- Use the EXACT card style, stats style, and icon style specified
- Implement the EXACT background treatment specified

### CONTENT TO DISPLAY
${JSON.stringify(content, null, 2)}

### DESIGN DECISION (FOLLOW THIS EXACTLY)
${JSON.stringify(blueprint, null, 2)}

### CANVAS DIMENSIONS
- Width: ${width}px
- Height: ${height}px
- HTML/body: width: ${width}px; height: ${height}px; overflow: hidden;
- ALL content MUST fit - reduce sizes if needed, never overflow

### IMPLEMENTATION RULES
1. CSS custom properties for ALL colors from blueprint
2. Google Fonts: Inter (400, 600, 800 only)
3. 8px grid spacing
4. Gradient text for title
5. CSS Grid/Flexbox
6. Media queries for responsiveness

### ⚠️ CRITICAL: NO CALL-TO-ACTION BUTTONS
This is an IMAGE/GENERIC DESIGN, not a webpage. Do NOT include:
- No CTA buttons
- No "Click here" links
- No interactive elements
- No buttons of any kind
Just pure visual design content.

### OUTPUT FORMAT
Start with <!DOCTYPE html>. Output ONLY the complete HTML file. No markdown, no explanations.`;
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