import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// STAGE 1: CONTENT AI — SPELL CHECK, REFINEMENT & EXPANSION
// Evaluates input, corrects typos and grammar, completes missing details,
// and structures high-impact infographic copy.
// ============================================================
export function buildContentAnalysisPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, language, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const languageStr = language || "English";
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
2. **COMPLETE & EXPAND**: If the input is brief or a raw topic/draft, complete and expand it with relevant, factual information. Never invent numbers or statistics.
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
   - Statistics and ONE Hero Stat ONLY if the source content contains real numeric data — otherwise use empty arrays/omit
   - Key Takeaway / Conclusion summary (1 sentence)
   - Suggested icon keywords (e.g. "chart", "shield", "rocket", "users", "globe", "bolt") — NEVER emoji.

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr})
- Input Mode: ${inputType || "text"}
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
  "heroStat": { "value": "real value from the source, or omit", "label": "Primary key metric" },
  "statistics": [
    { "id": "stat-1", "value": "real value from the source", "label": "Metric description", "icon": "chart" }
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
  "suggestedIcons": ["chart", "shield", "rocket", "bolt"]
}
NOTE: Do NOT suggest colors or styling — that is the Art Director stage's job. Content only.`;
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

  // Randomized creative seed so the AI genuinely DECIDES the design and
  // repeated generations of the same topic look different every time.
  const DIRECTIONS = [
    "dark premium tech — near-black canvas, neon accent glow, glassmorphic cards, thin luminous borders",
    "light editorial magazine — warm paper background, bold serif-feel headings, hairline rules, generous whitespace",
    "vivid gradient poster — bright duotone gradient canvas, white high-contrast cards, chunky rounded shapes",
    "corporate clean — pure white canvas, strong brand-color section headers, flat cards with soft shadows",
    "retro print poster — cream background, oversized condensed headings, offset color blocks, sticker-like badges",
    "midnight minimal — deep slate canvas, ONE single accent hue, hairline dividers, no card fills",
    "soft pastel dashboard — pale tinted background, pastel stat chips, rounded friendly typography",
    "brutalist bold — stark high-contrast blocks, thick borders, oversized numerals, no shadows",
  ];
  const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

  let chatBlock = "";
  if (chatHistory && chatHistory.length > 0) {
    chatBlock = `\n## CHAT REFINEMENT CONTEXT\n${chatHistory.slice(-3).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (refinementPrompt) {
    chatBlock += `User requested design edit: "${refinementPrompt}"\n`;
  }

  return `You are a visionary Art Director and Master Infographic Designer.
This is STAGE 2 (Custom Layout & Visual Design Strategy).

Your job: study the refined content below and INVENT the complete visual design yourself. You have full creative freedom — structure, palette, typography, composition, decoration, motion-feel — everything is yours to decide. Do not follow any fixed template, archetype list, or house style: the design must grow out of what the content is about.

## CREATIVE DIRECTION SEED (a single spark of inspiration — interpret freely, twist it, or ignore it if the content suggests something better)
${direction}
Repeated generations must produce visibly DIFFERENT designs. Commit fully to one coherent creative idea.

## TARGET CANVAS
- Dimensions: ${dimensions} (${aspectRatio || "1:1"})
- Canvas Aspect: ${isPortrait ? "Portrait (tall)" : isWide ? "Landscape (wide)" : "Square"}
- Aesthetic Intent: "${userIntent || "your choice — decide what serves this topic best"}"
${chatBlock}${memoryBlock}
## REFINED CONTENT TO DESIGN
${JSON.stringify(content, null, 2)}

## WHAT TO DECIDE (non-exhaustive — add anything else the design needs)
- A creative concept and the layout/composition that expresses it
- A semantic color palette that fits the subject's mood (ensure WCAG AA contrast)
- A Google Fonts pairing with character matching the topic
- Shapes, textures, borders, shadows, icon treatment, visual metaphors, decorative systems
- How statistics, sections, and the takeaway are given visual hierarchy

## OUTPUT FORMAT
Return ONLY one valid JSON object (no code fences, no markdown) describing your complete design system. The three required keys below are the minimum contract with the coder stage — beyond them, YOU choose the structure and add as many of your own keys as the design needs:

{
  "colorPalette": { "primary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex", "...": "any other color roles you want" },
  "typography": { "headingFont": "Google Font name", "bodyFont": "Google Font name", "...": "sizes, weights, scales — your call" },
  "layout": { "...": "describe the composition however you like" },
  "...": "any additional design dimensions you decide on"
}`;
}

// ============================================================
// STAGE 1+2 COMBINED: CONTENT EXPANSION & CUSTOM DESIGN BLUEPRINT
// Generates BOTH rich publication-ready copy AND the Art Director's
// custom layout architecture in a single fast, coordinated AI round-trip.
// ============================================================
export function buildContentBlueprintPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const userIntentStr = userIntent || "Clean, high-impact, modern";

  const { width, height } = getCanvasDimensions(aspectRatio, aspectRatioWidth, aspectRatioHeight);
  const dimensionsStr = `${width}x${height}px`;

  const isPortrait = aspectRatio === "9:16" || aspectRatio === "4:5" || aspectRatio === "A4-P";
  const isWide = aspectRatio === "16:9" || aspectRatio === "A4-L";

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

  return `You are a world-class Content Strategist AND Art Director creating a studio-grade INFOGRAPHIC.
In this single step, you will:
1. **EXPAND & POLISH CONTENT**: Fix any spelling/grammar errors in the user's input, auto-expand brief ideas into rich, comprehensive, informative copy with real metrics and actionable bullet points.
2. **INVENT A CUSTOM VISUAL LAYOUT**: Determine the best visual layout for this specific topic and canvas size (${dimensionsStr}). Do NOT force a generic template. Choose the layout archetype that best fits the subject (e.g. Bento Grid, Split Comparison, Sequential Roadmap, Metrics Dashboard, Editorial Hierarchy).

## TARGET CANVAS
- Dimensions: ${dimensionsStr} (${aspectRatioStr})
- Orientation: ${isPortrait ? "Portrait (tall)" : isWide ? "Landscape (wide)" : "Square"}
- Input Type: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Aesthetic Tone: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## SOURCE TOPIC / INPUT
"${input}"

## OUTPUT FORMAT
Return ONLY ONE valid JSON object (no markdown, no code fences):
{
  "content": {
    "topicType": "general | comparison | process_steps | metrics_data | list_features | timeline",
    "kicker": "2-3 WORD CATEGORY TAG (e.g. 2026 TECH RADAR)",
    "title": "Engaging, Punchy Main Title (max 8 words)",
    "subtitle": "Clear, Informative Subtitle Explaining the Value (max 14 words)",
    "heroStat": { "value": "95%", "label": "Key primary metric headline" },
    "statistics": [
      { "id": "stat-1", "value": "10x", "label": "Productivity Acceleration", "icon": "rocket" },
      { "id": "stat-2", "value": "$1.3T", "label": "Market Valuation", "icon": "chart" },
      { "id": "stat-3", "value": "85%", "label": "Automation Rate", "icon": "bolt" }
    ],
    "sections": [
      {
        "id": "sec-1",
        "title": "Core Definition & Mechanics",
        "subtitle": "Foundational Principles",
        "content": "Clear 1-2 sentence overview explaining the fundamental mechanism.",
        "bullets": ["Concrete actionable detail 1", "Concrete actionable detail 2"],
        "icon": "shield"
      },
      {
        "id": "sec-2",
        "title": "Key Capabilities & Use Cases",
        "subtitle": "Real-world Applications",
        "content": "Clear 1-2 sentence overview of applications and impact.",
        "bullets": ["Real-world application 1", "Real-world application 2"],
        "icon": "spark"
      },
      {
        "id": "sec-3",
        "title": "Strategic Implementation",
        "subtitle": "Best Practices",
        "content": "Clear 1-2 sentence overview of implementation.",
        "bullets": ["Key practice 1", "Key practice 2"],
        "icon": "target"
      },
      {
        "id": "sec-4",
        "title": "Future Horizon & Impact",
        "subtitle": "Next Generation",
        "content": "Clear 1-2 sentence overview on what comes next.",
        "bullets": ["Emerging trend 1", "Emerging trend 2"],
        "icon": "globe"
      }
    ],
    "timeline": [],
    "keyTakeaway": "One-sentence comprehensive concluding takeaway summarizing the entire infographic.",
    "suggestedIcons": ["shield", "spark", "target", "globe", "rocket", "chart"],
    "suggestedColors": {
      "primary": "#6366f1",
      "secondary": "#ec4899",
      "accent": "#06b6d4",
      "background": "#0b0f19",
      "text": "#f8fafc"
    }
  },
  "blueprint": {
    "layoutArchetype": "bento_grid",
    "concept": "Modern High-Impact Information Matrix",
    "layoutStructure": {
      "headerStyle": "Compact hero header (~18% height) with category kicker badge, bold gradient title, and subtitle",
      "mainFlow": "Harmonious multi-card layout filling the canvas without large empty voids",
      "statPlacement": "Horizontal stat band with glowing icons, numbers, and visual progress meters",
      "sectionCardTreatment": "Glassmorphic cards with subtle borders, background blur, and soft ambient shadow"
    },
    "colorPalette": {
      "primary": "#6366f1",
      "secondary": "#ec4899",
      "accent": "#06b6d4",
      "background": "#0b0f19",
      "surface": "rgba(18, 26, 43, 0.8)",
      "text": "#f8fafc",
      "textMuted": "#94a3b8",
      "border": "rgba(255, 255, 255, 0.1)",
      "glow": "rgba(99, 102, 241, 0.25)"
    },
    "typography": {
      "headingFont": "Plus Jakarta Sans",
      "bodyFont": "Inter",
      "heroSize": "clamp(28px, 3.5vw, 44px)",
      "h2Size": "clamp(16px, 1.8vw, 22px)",
      "bodySize": "clamp(11px, 1vw, 13px)"
    },
    "visualComponents": [
      "Layered mesh background with radial ambient lighting",
      "Glowing icon badge containers",
      "Visual gradient progress bars and metric percentage tracks",
      "Category chips and numbered step indicators"
    ],
    "cssDirectives": [
      "Fill the entire canvas (${dimensionsStr}) harmoniously from top to bottom with ZERO large empty spaces",
      "Use CSS custom properties for all colors, fonts, and spacing",
      "Render inline SVG icons — no emoji, no external images",
      "Ensure zero scrollbars and perfect layout balance"
    ]
  }
}`;
}

// ============================================================
// STAGE 3: CODER AI — HTML/CSS CODE GENERATION
// The Coder AI receives the rich content AND the Art Director's
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
You are a senior frontend engineer bringing the ART DIRECTOR'S design to life. The design system JSON below is the SOURCE OF TRUTH — implement it faithfully and creatively. The markup structure, CSS architecture, class naming, composition, and all visual decisions are entirely YOURS; do NOT fall back to any fixed template or house style.

### HARD TECHNICAL CONSTRAINTS (non-negotiable)
1. **EXACT canvas**: ${width}x${height}px. Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; } and fill the canvas with ZERO scrollbars and ZERO clipped content.
2. **One self-contained file**: a complete document starting with <!DOCTYPE html> — <head> containing the Google Fonts <link> for the design system's chosen fonts plus a single <style> block, then <body>. No JavaScript, no external images, no iframes.
3. **Icons**: inline <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">...</svg>. NO emoji.
4. **All content, real content**: render EVERY section and statistic below with clear visual hierarchy — nothing dropped, no placeholders, no "lorem ipsum".
5. **Readable & fitted**: honor the palette's WCAG AA contrast; use clamp()-based font sizing and fluid layout so the design fits ${height}px perfectly.
6. **Output**: ONLY the raw HTML starting with <!DOCTYPE html> — no markdown code fences, no explanations.

### ART DIRECTOR'S DESIGN SYSTEM (your creative brief)
${JSON.stringify(blueprint, null, 2)}

### CONTENT TO RENDER (all sections & stats)
${JSON.stringify(content, null, 2)}${chatBlock}${memoryBlock}`;
}