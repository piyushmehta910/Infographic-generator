import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// STEP 1: CONTENT ASSESSMENT, EXPANSION & STRUCTURING
// The AI analyzes the user's input, checks if it is sufficient,
// auto-completes and structures it into a rich publication-ready package.
// ============================================================
export function buildContentAnalysisPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const userIntentStr = userIntent || "Clean and modern";

  const { width, height } = getCanvasDimensions(aspectRatio, aspectRatioWidth, aspectRatioHeight);
  const dimensionsStr = `${width}x${height}px`;

  const memoryBlock = memoryContext ? `\n## CONTEXT MEMORY\n${memoryContext}\n` : "";

  let conversationBlock = "";
  if (chatHistory && chatHistory.length > 0) {
    const historyText = chatHistory.slice(-4).map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");
    conversationBlock = `\n## CONVERSATION HISTORY\n${historyText}\n`;
  }

  let refinementBlock = "";
  if (refinementPrompt || previousContent) {
    refinementBlock = `\n## EDIT / REFINEMENT INSTRUCTION\nUser requested edit: "${refinementPrompt || "Update content"}"\nPrevious content: ${JSON.stringify(previousContent || {})}\nApply the user's edit while preserving established core facts and structure.\n`;
  }

  return `You are a senior content strategist and data journalist preparing material for a PROFESSIONAL INFOGRAPHIC.
This is PHASE 1 (Content Analysis & Structuring). Your job is to produce a rich, high-quality, publication-ready content package in clean JSON.

## TASK INSTRUCTIONS
1. **ASSESS**: Check the input. Whether it is a single phrase, an idea, a draft, or an article, evaluate what it needs to become an engaging infographic.
2. **AUTO-EXPAND & ENRICH**: If the input is brief or minimal, expand it using accurate general knowledge. Add concrete, realistic statistics (percentages, multipliers, counts), actionable insights, and structured bullet points.
3. **STRUCTURE**:
   - Engaging Title (max 8 words)
   - Clear Subtitle (max 14 words)
   - 3 to 5 distinct Sections with concise description (1-2 sentences) and 2 to 3 actionable bullets
   - 3 to 4 concrete Statistics with realistic values (e.g. "87%", "$4.2B", "3.5x", "10M+") and clear labels
   - ONE "heroStat" that represents the primary takeaway
   - Optional Timeline / Process steps (2-4 items) if relevant to the topic, otherwise []
   - 4-6 descriptive icon keywords (e.g. "chart", "shield", "rocket", "users", "globe", "bolt") — NEVER emoji.

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr})
- Input Mode: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Tone / Intent: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## SOURCE INPUT
"${input}"

## OUTPUT FORMAT
Return ONLY valid JSON (no code fences, no explanations):
{
  "title": "string (engaging, max 8 words)",
  "subtitle": "string (supporting, max 14 words)",
  "heroStat": { "value": "95%", "label": "Key primary metric" },
  "statistics": [
    { "id": "stat-1", "value": "95%", "label": "Metric description", "icon": "keyword" },
    { "id": "stat-2", "value": "3.5x", "label": "Metric description", "icon": "keyword" },
    { "id": "stat-3", "value": "80M+", "label": "Metric description", "icon": "keyword" }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Section Title",
      "content": "Short 1-2 sentence overview.",
      "bullets": ["Concrete actionable point 1", "Concrete actionable point 2"],
      "icon": "keyword"
    }
  ],
  "timeline": [],
  "suggestedIcons": ["chart", "shield", "rocket", "bolt"],
  "suggestedColors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#ffffff",
    "text": "#0f172a"
  }
}`;
}

// ============================================================
// STEP 1+2 COMBINED: CONTENT ANALYSIS & DESIGN BLUEPRINT
// ONE AI call returns BOTH the enriched content package AND the visual
// design blueprint. Merging the two phases into a single round-trip halves
// the number of sequential provider calls, which is what makes generation
// fit inside the serverless time budget on slow free-tier models.
// ============================================================
export function buildContentBlueprintPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const userIntentStr = userIntent || "Clean and modern";

  const isPortrait = aspectRatio === "9:16" || aspectRatio === "4:5" || aspectRatio === "A4-P";
  const isWide = aspectRatio === "16:9" || aspectRatio === "A4-L";

  const { width, height } = getCanvasDimensions(aspectRatio, aspectRatioWidth, aspectRatioHeight);
  const dimensionsStr = `${width}x${height}px`;

  const memoryBlock = memoryContext ? `\n## CONTEXT MEMORY\n${memoryContext}\n` : "";

  let conversationBlock = "";
  if (chatHistory && chatHistory.length > 0) {
    const historyText = chatHistory.slice(-4).map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");
    conversationBlock = `\n## CONVERSATION HISTORY\n${historyText}\n`;
  }

  let refinementBlock = "";
  if (refinementPrompt || previousContent) {
    refinementBlock = `\n## EDIT / REFINEMENT INSTRUCTION\nUser requested edit: "${refinementPrompt || "Update content"}"\nPrevious content: ${JSON.stringify(previousContent || {})}\nApply the user's edit while preserving established core facts and structure.\n`;
  }

  const layoutGuidance = isPortrait
    ? "PORTRAIT: Vertical card stack from top to bottom. Bold hero header, compact horizontal stat band, then 3-4 distinct cards. Ensure vertical rhythm fits within height without scrolling."
    : isWide
      ? "WIDE: Horizontal balance. Left hero/stats column with right multi-card grid, or wide top header with a 3-column card layout."
      : "SQUARE: Symmetrical grid. Prominent top header, central 2-column or 3-column card layout, and highlighted bottom hero stat.";

  return `You are a senior content strategist AND art director preparing a PROFESSIONAL INFOGRAPHIC.
In this ONE step, do two things in a single JSON response: (1) analyze/enrich the input into a rich content package, and (2) produce the complete visual design specification.

## TASK 1 — CONTENT (key "content")
1. **ASSESS**: Check the input. Whether it is a single phrase, an idea, a draft, or an article, evaluate what it needs to become an engaging infographic.
2. **AUTO-EXPAND & ENRICH**: If the input is brief or minimal, expand it using accurate general knowledge. Add concrete, realistic statistics (percentages, multipliers, counts), actionable insights, and structured bullet points.
3. **STRUCTURE**: Engaging Title (max 8 words), Clear Subtitle (max 14 words), 3 to 5 distinct Sections with description (1-2 sentences) and 2-3 actionable bullets, 3-4 concrete Statistics with realistic values and labels, ONE "heroStat", optional Timeline (2-4 items) or [], 4-6 descriptive icon keywords (e.g. "chart", "users", "globe", "rocket") — NEVER emoji.

## TASK 2 — DESIGN BLUEPRINT (key "blueprint")
Design how the infographic will be built in HTML/CSS:
- **60-30-10 Palette**: 60% background/neutrals, 30% card/sections, 10% vibrant accent for stats. WCAG AA contrast (>=4.5:1).
- **Typography**: Google Font pairing (e.g. "Plus Jakarta Sans", "Inter", "Poppins", "Outfit", "Space Grotesk").
- **Card styling**: border-radius 12-20px, subtle border, soft drop shadow, gradient accents.
- **Layout guidance for this canvas**: ${layoutGuidance}

## SOURCE INPUT
"${input}"

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr})
- Input Mode: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Tone / Intent: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## OUTPUT FORMAT
Return ONLY ONE valid JSON object (no code fences, no markdown, no explanations) with EXACTLY these two keys:

{
  "content": {
    "title": "string (max 8 words)",
    "subtitle": "string (max 14 words)",
    "heroStat": { "value": "95%", "label": "Key primary metric" },
    "statistics": [
      { "id": "stat-1", "value": "95%", "label": "Metric description", "icon": "keyword" },
      { "id": "stat-2", "value": "3.5x", "label": "Metric description", "icon": "keyword" }
    ],
    "sections": [
      { "id": "sec-1", "title": "Section Title", "content": "Short 1-2 sentence overview.", "bullets": ["Concrete point 1", "Concrete point 2"], "icon": "keyword" }
    ],
    "timeline": [],
    "suggestedIcons": ["chart", "shield", "rocket", "bolt"],
    "suggestedColors": { "primary": "#3b82f6", "secondary": "#8b5cf6", "accent": "#ec4899", "background": "#ffffff", "text": "#0f172a" }
  },
  "blueprint": {
    "concept": "One-line visual theme summary",
    "layoutStyle": "${isPortrait ? "vertical-flow" : isWide ? "multi-column-grid" : "balanced-grid"}",
    "colorPalette": { "primary": "#3b82f6", "secondary": "#8b5cf6", "accent": "#ec4899", "background": "#0f172a", "surface": "#1e293b", "text": "#f8fafc", "textMuted": "#94a3b8", "border": "rgba(255,255,255,0.1)" },
    "typography": { "headingFont": "Plus Jakarta Sans", "bodyFont": "Inter", "heroSize": "clamp(36px, 4vw, 56px)", "h2Size": "clamp(20px, 2vw, 28px)", "bodySize": "clamp(13px, 1.2vw, 15px)" },
    "cardStyle": { "borderRadius": "16px", "background": "rgba(30, 41, 59, 0.7)", "border": "1px solid rgba(255,255,255,0.08)", "shadow": "0 8px 32px rgba(0,0,0,0.24)", "backdropFilter": "blur(12px)" },
    "heroStatStyle": { "fontSize": "clamp(48px, 5vw, 72px)", "fontWeight": "800", "color": "#ec4899", "gradient": "linear-gradient(135deg, #ec4899, #8b5cf6)" },
    "cssDirectives": [
      "Use CSS custom properties for all colors and typography",
      "Set the outer container to exactly ${width}x${height}px with overflow:hidden and zero scrollbars",
      "Render each section inside a distinct styled card",
      "Use inline SVG icons — no emoji, no external images"
    ]
  }
}`;
}

// ============================================================
// STEP 2: DESIGN ARCHITECTURE & CSS BLUEPRINT
// AI specifies exactly how to design the infographic in HTML/CSS
// for the chosen aspect ratio, theme, and aesthetic mood.
// ============================================================
export function buildDesignBlueprintPrompt(content: unknown, request: AIGenerationRequest, memoryContext?: string): string {
  const { aspectRatio, userIntent, chatHistory, refinementPrompt } = request;
  const isPortrait = aspectRatio === "9:16" || aspectRatio === "4:5" || aspectRatio === "A4-P";
  const isWide = aspectRatio === "16:9" || aspectRatio === "A4-L";

  const { width, height } = getCanvasDimensions(aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);
  const dimensions = `${width}x${height}px`;

  const memoryBlock = memoryContext ? `\n## MEMORY CONTEXT\n${memoryContext}\n` : "";

  let chatBlock = "";
  if (chatHistory && chatHistory.length > 0) {
    chatBlock = `\n## CHAT / REFINEMENT CONTEXT\n${chatHistory.slice(-3).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (refinementPrompt) {
    chatBlock += `User requested design edit: "${refinementPrompt}"\n`;
  }

  const layoutGuidance = isPortrait
    ? "PORTRAIT: Vertical card stack from top to bottom. Bold hero header, compact horizontal stat band, then 3-4 distinct cards. Ensure vertical rhythm fits within height without scrolling."
    : isWide
      ? "WIDE: Horizontal balance. Left hero/stats column with right multi-card grid, or wide top header with a 3-column card layout."
      : "SQUARE: Symmetrical grid. Prominent top header, central 2-column or 3-column card layout, and highlighted bottom hero stat.";

  return `You are a world-class Art Director and CSS Architect.
This is PHASE 2 (Design Architecture & Planning). Your job is to create a complete visual design specification that an engineer will code into HTML/CSS in Phase 3.

## TARGET CANVAS
- Size: ${dimensions}
- Layout Guidance: ${layoutGuidance}
- Design Mood / Intent: "${userIntent || "modern, high-end, clean"}"
${chatBlock}${memoryBlock}
## CONTENT TO DESIGN
${JSON.stringify(content, null, 2)}

## DESIGN RULES
1. **60-30-10 Palette**: 60% background/neutrals, 30% structural cards/sections, 10% vibrant accent for key stats/highlights. Ensure strong WCAG AA contrast (>=4.5:1).
2. **Typography**: Google Font pairing (e.g. "Plus Jakarta Sans", "Inter", "Poppins", "Outfit", "Space Grotesk").
3. **Card Styling**: Tangible visual depth (border-radius 12-20px, subtle border like 1px solid rgba(255,255,255,0.1) or rgba(0,0,0,0.06), soft drop shadow, gradient header).
4. **Icons**: Crisp inline SVG keywords. NO EMOJI.

## OUTPUT FORMAT
Return ONLY valid JSON (no code fences, no markdown):
{
  "concept": "One-line visual theme summary",
  "layoutStyle": "${isPortrait ? "vertical-flow" : isWide ? "multi-column-grid" : "balanced-grid"}",
  "colorPalette": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc",
    "textMuted": "#94a3b8",
    "border": "rgba(255, 255, 255, 0.1)"
  },
  "typography": {
    "headingFont": "Plus Jakarta Sans",
    "bodyFont": "Inter",
    "heroSize": "clamp(36px, 4vw, 56px)",
    "h2Size": "clamp(20px, 2vw, 28px)",
    "bodySize": "clamp(13px, 1.2vw, 15px)"
  },
  "cardStyle": {
    "borderRadius": "16px",
    "background": "rgba(30, 41, 59, 0.7)",
    "border": "1px solid rgba(255, 255, 255, 0.08)",
    "shadow": "0 8px 32px rgba(0, 0, 0, 0.24)",
    "backdropFilter": "blur(12px)"
  },
  "heroStatStyle": {
    "fontSize": "clamp(48px, 5vw, 72px)",
    "fontWeight": "800",
    "color": "#ec4899",
    "gradient": "linear-gradient(135deg, #ec4899, #8b5cf6)"
  },
  "cssDirectives": [
    "Use CSS custom properties for all colors and typography",
    "Set outer container to exactly ${dimensions} with overflow: hidden",
    "Render each section inside a distinct styled card with 2-3 bullets",
    "Use inline SVG icons for sections and stats"
  ]
}`;
}

// ============================================================
// STEP 3: HTML/CSS GENERATION
// The AI receives the COMPLETED content AND the blueprint, then codes
// the final single-file HTML/CSS document fitting the exact canvas dimensions.
// ============================================================
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest, memoryContext?: string): string {
  const { width, height } = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);

  const memoryBlock = memoryContext ? `\n## WORKING MEMORY\n${memoryContext}\n` : "";

  let chatBlock = "";
  if (request.chatHistory && request.chatHistory.length > 0) {
    chatBlock = `\n## RECENT REFINEMENT INSTRUCTIONS\n${request.chatHistory.slice(-2).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (request.refinementPrompt) {
    chatBlock += `Apply specific user edit: "${request.refinementPrompt}"\n`;
  }

  return `## PHASE 3: HTML/CSS CODE GENERATION
You are an expert senior frontend engineer and visual designer. Code the COMPLETE, single-file HTML/CSS for this infographic.

### CANVAS DIMENSIONS (CRITICAL)
- Width: ${width}px
- Height: ${height}px
- The entire layout MUST fit within ${width}x${height}px with ZERO scrollbars and ZERO clipping.
- Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### DESIGN BLUEPRINT SPECIFICATION
${JSON.stringify(blueprint, null, 2)}

### CONTENT TO RENDER (ALL SECTIONS & STATS)
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### MANDATORY TECHNICAL REQUIREMENTS
1. Start with <!DOCTYPE html><html><head><meta charset="UTF-8"><style>...</style></head><body>...</body></html>.
2. Load required Google Fonts in <head> using <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">.
3. In <style>, define CSS custom properties (:root) from the blueprint palette and typography.
4. Structure:
   - Root wrapper <div class="infographic-root" style="width: ${width}px; height: ${height}px; ...">
   - Header with Title and Subtitle
   - Stat Callouts / Hero Stat with large number, label, and icon
   - Structured Section Cards with card background, border, radius, title, and bullet points
   - Clean footer / source tag
5. Icons: Use inline <svg> with viewBox, stroke="currentColor", and width/height 16-24px. DO NOT use emoji or external image URLs.
6. Responsive fit: Use CSS flexbox/grid and clamp() font sizes so content naturally fits without overflowing ${height}px.
7. Pure HTML & CSS only — NO <script> tags, NO external JavaScript.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown code fences, do NOT add explanations.`;
}