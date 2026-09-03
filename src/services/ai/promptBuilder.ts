import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// STAGE 1: CONTENT AI — SPELL CHECK, REFINEMENT & EXPANSION
// Evaluates input, corrects typos and grammar, completes missing details,
// and structures high-impact infographic copy.
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
    refinementBlock = `\n## REFINEMENT INSTRUCTION\nUser requested change: "${refinementPrompt || "Update content"}"\nPrevious content: ${JSON.stringify(previousContent || {})}\nApply the user's edit while keeping established facts.\n`;
  }

  return `You are a senior content strategist and editor preparing publication-ready material for an INFOGRAPHIC.
This is STAGE 1 (Content Polish, Spelling Correction & Expansion).

## INSTRUCTIONS
1. **SPELL CHECK & POLISH**: Check spelling, fix grammar mistakes, typos, and clumsy phrasing in the user's input.
2. **COMPLETE & EXPAND**: If the input is brief or a raw topic/draft, expand it with accurate, realistic facts, statistics, percentages, and actionable insights.
3. **TOPIC TYPE**: Detect the semantic topic archetype:
   - "comparison" (e.g. A vs B)
   - "process_steps" (e.g. 5 steps to master X)
   - "metrics_data" (e.g. Market report, statistics)
   - "list_features" (e.g. 7 habits, key tips)
   - "timeline" (e.g. Historical evolution, roadmap)
   - "general" (general informative topic)
4. **STRUCTURE**:
   - Engaging Title (max 8 words, punchy and polished)
   - Subtitle (max 14 words, clear value proposition)
   - Kicker Tag (2-3 words uppercase category, e.g. "2026 INSIGHTS", "EXECUTIVE GUIDE")
   - 3 to 5 distinct Sections with concise description and 2-3 clear bullet points
   - 3 to 4 concrete Statistics with realistic values (e.g. "87%", "$4.2B", "3.5x") and labels
   - ONE Hero Stat representing the primary takeaway
   - Key Takeaway / Conclusion summary (1 sentence)
   - Suggested icon keywords (e.g. "chart", "shield", "rocket", "users", "globe", "bolt") — NEVER emoji.

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
Return ONLY valid JSON (no code fences, no markdown):
{
  "topicType": "comparison | process_steps | metrics_data | list_features | timeline | general",
  "kicker": "CATEGORY TAG (2-3 words)",
  "title": "Polished Engaging Title",
  "subtitle": "Clear supporting subtitle",
  "heroStat": { "value": "95%", "label": "Primary key metric" },
  "statistics": [
    { "id": "stat-1", "value": "95%", "label": "Metric description", "icon": "chart" },
    { "id": "stat-2", "value": "3.5x", "label": "Growth factor", "icon": "rocket" },
    { "id": "stat-3", "value": "80M+", "label": "User reach", "icon": "users" }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Section Title",
      "subtitle": "Short section subtitle or step number",
      "content": "Short 1-2 sentence overview.",
      "bullets": ["Actionable point 1", "Actionable point 2"],
      "icon": "shield"
    }
  ],
  "timeline": [],
  "keyTakeaway": "One sentence key takeaway or conclusion.",
  "suggestedIcons": ["chart", "shield", "rocket", "bolt"],
  "suggestedColors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#0f172a",
    "text": "#f8fafc"
  }
}`;
}

// ============================================================
// STAGE 2: ART DIRECTOR AI — FREEFORM CUSTOM DESIGN & LAYOUT STRATEGY
// The AI analyzes the specific topic and content semantics, and freely
// invents the custom visual layout and design blueprint that fits best.
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
    chatBlock = `\n## CHAT REFINEMENT CONTEXT\n${chatHistory.slice(-3).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (refinementPrompt) {
    chatBlock += `User requested design edit: "${refinementPrompt}"\n`;
  }

  return `You are a visionary Art Director and Master Infographic Designer.
This is STAGE 2 (Custom Layout & Visual Design Strategy).

Your job: Look at the refined content below, determine the best visual layout for this specific subject, and output a complete creative design specification.

DO NOT force a generic card template. Choose the ideal visual layout archetype based on what the content is about:
- If comparison: Design a split/versus two-column layout with contrasting color accents.
- If process/steps: Design a sequential roadmap or step-by-step numbered cards with visual flow.
- If data/metrics: Design a dynamic Bento Grid or metrics dashboard with visual progress meters and stat chips.
- If list/tips: Design an editorial layout with numbered micro-badges and icon containers.
- If timeline: Design a milestone spine connecting key events.

## TARGET CANVAS
- Dimensions: ${dimensions} (${aspectRatio || "1:1"})
- Canvas Aspect: ${isPortrait ? "Portrait (tall)" : isWide ? "Landscape (wide)" : "Square"}
- Aesthetic Intent: "${userIntent || "modern, high-impact, award-winning"}"
${chatBlock}${memoryBlock}
## REFINED CONTENT TO DESIGN
${JSON.stringify(content, null, 2)}

## DESIGN BLUEPRINT INSTRUCTIONS
1. **Layout Strategy**: Explain the exact layout structure chosen for this topic and how sections should be positioned inside ${dimensions}.
2. **Color Harmony (60-30-10 Rule)**:
   - 60% Background & ambient depth (e.g. dark mesh gradient, radial glow, or clean light editorial)
   - 30% Structural cards, panels, or column containers
   - 10% Vibrant highlight accents for stats, badges, and key callouts
   - High contrast WCAG AA compliant.
3. **Typography**: Google Font pairing that matches the topic mood (e.g. "Plus Jakarta Sans" + "Inter", "Space Grotesk" + "Inter", "Outfit" + "Poppins").
4. **Visual Components**: Specify what visual components to build (e.g. progress bar meters, category chips, glowing borders, icon containers, numbered step pills).
5. **CSS Architecture**: Outline custom CSS properties (:root) and responsive layout rules.

## OUTPUT FORMAT
Return ONLY valid JSON (no code fences, no markdown):
{
  "layoutArchetype": "bento_grid | split_comparison | process_roadmap | metrics_dashboard | editorial_list | timeline_spine",
  "concept": "Creative visual concept summary",
  "layoutStructure": {
    "headerStyle": "Large title with category kicker tag and text gradient",
    "mainFlow": "Description of layout arrangement (e.g. 2-column bento, 3-step vertical path)",
    "statPlacement": "Placement of stats (e.g. top banner, hero card with progress bar, sidebar)",
    "sectionCardTreatment": "Description of card styles, borders, and shadows"
  },
  "colorPalette": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#0b0f19",
    "surface": "rgba(18, 26, 43, 0.75)",
    "text": "#f8fafc",
    "textMuted": "#94a3b8",
    "border": "rgba(255, 255, 255, 0.1)",
    "glow": "rgba(59, 130, 246, 0.2)"
  },
  "typography": {
    "headingFont": "Plus Jakarta Sans",
    "bodyFont": "Inter",
    "heroSize": "clamp(36px, 4.5vw, 56px)",
    "h2Size": "clamp(20px, 2.2vw, 28px)",
    "bodySize": "clamp(13px, 1.2vw, 15px)"
  },
  "visualComponents": [
    "Gradient mesh background with radial glow spheres",
    "Glassmorphic cards with subtle 1px border and soft shadow",
    "Visual progress meter for hero statistics",
    "Category badge chips and numbered step indicators",
    "Styled icon wrapper containers"
  ],
  "cssDirectives": [
    "Set outer container to exactly ${dimensions} with overflow: hidden",
    "Use CSS custom properties for all colors, fonts, and spacing",
    "Use inline SVG icons with stroke-width 2 — NO external images or emoji",
    "Ensure zero scrollbars and perfect vertical/horizontal fit"
  ]
}`;
}

// ============================================================
// STAGE 3: CODER AI — HTML/CSS CODE GENERATION
// The Coder AI receives the refined content AND the Art Director's
// custom design strategy, and writes single-file HTML/CSS.
// ============================================================
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest, memoryContext?: string): string {
  const { width, height } = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);

  const memoryBlock = memoryContext ? `\n## WORKING MEMORY\n${memoryContext}\n` : "";

  let chatBlock = "";
  if (request.chatHistory && request.chatHistory.length > 0) {
    chatBlock = `\n## RECENT USER EDITS\n${request.chatHistory.slice(-2).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (request.refinementPrompt) {
    chatBlock += `Apply specific user edit: "${request.refinementPrompt}"\n`;
  }

  return `## STAGE 3: HTML/CSS CODE GENERATION
You are an expert senior frontend engineer and visual designer.
Code the COMPLETE, single-file HTML/CSS document faithfully executing the custom design strategy planned by the Art Director.

### EXACT CANVAS DIMENSIONS (STRICT)
- Width: ${width}px
- Height: ${height}px
- Must fit within ${width}x${height}px with ZERO scrollbars and ZERO overflow.
- Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### ART DIRECTOR DESIGN STRATEGY
${JSON.stringify(blueprint, null, 2)}

### REFINED CONTENT TO RENDER
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### MANDATORY CODING RULES
1. Start with <!DOCTYPE html><html><head><meta charset="UTF-8"><style>...</style></head><body>...</body></html>.
2. Load Google Fonts in <head> via <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">.
3. In <style>, define CSS custom properties (:root) matching the Art Director's palette and typography.
4. Implement the Art Director's visual layout:
   - Ambient background depth (mesh gradients, radial glow, or subtle texture).
   - Category kicker badge chip above the main title.
   - Title with bold styling / text gradient.
   - Layout matching the blueprint (Bento grid, comparison split, sequential steps, etc.).
   - Visual data components: CSS progress bars, stat meters, icon badge wrappers, and step pills.
   - Clean footer with key takeaway or source tag.
5. Icons: Use inline <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">...</svg>. NO emoji, NO external <img> links.
6. Use CSS clamp() sizing and flex/grid so all content naturally fits within ${height}px without overflow.
7. Pure HTML & CSS only — NO <script> tags.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown fences, do NOT add explanations.`;
}

// Combined shortcut for fast single-round-trip calls when needed
export function buildContentBlueprintPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  return buildContentAnalysisPrompt(request, memoryContext);
}