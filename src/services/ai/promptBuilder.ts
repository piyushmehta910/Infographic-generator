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

Your job: Look at the refined content below, determine the best visual layout for this specific subject, and output a complete creative design specification.

DO NOT force a generic card template. Choose the ideal visual layout archetype based on what the content is about:
- If comparison: Design a split/versus two-column layout with contrasting color accents.
- If process/steps: Design a sequential roadmap or step-by-step numbered cards with visual flow.
- If data/metrics: Design a dynamic Bento Grid or metrics dashboard with visual progress meters and stat chips.
- If list/tips: Design an editorial layout with numbered micro-badges and icon containers.
- If timeline: Design a milestone spine connecting key events.

## CREATIVE DIRECTION SEED (inspiration — interpret creatively, never copy verbatim)
${direction}
Take this seed as a starting point and adapt it to the topic's semantics. Repeated generations must produce visibly DIFFERENT designs — commit fully to the seed's palette mood, font character, and card treatment.

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

  const palette = (blueprint && typeof blueprint === "object" ? blueprint.colorPalette : null) || {};
  const typography = (blueprint && typeof blueprint === "object" ? blueprint.typography : null) || {};
  const headingFont = String(typography.headingFont || "Plus Jakarta Sans");
  const bodyFont = String(typography.bodyFont || "Inter");
  const fontQuery = `${headingFont.replace(/ /g, "+")}:wght@400;600;700;800&family=${bodyFont.replace(/ /g, "+")}:wght@400;500;600;700`;
  const colors = {
    primary: palette.primary || "#6366f1",
    secondary: palette.secondary || "#8b5cf6",
    accent: palette.accent || "#ec4899",
    background: palette.background || "#0b0f19",
    surface: palette.surface || "rgba(18, 26, 43, 0.75)",
    text: palette.text || "#f8fafc",
    textMuted: palette.textMuted || "#94a3b8",
    border: palette.border || "rgba(255, 255, 255, 0.1)",
  };

  return `## STAGE 3: HTML/CSS CODE GENERATION
You are an expert senior frontend engineer and award-winning visual designer.
Code the COMPLETE, single-file HTML/CSS document faithfully executing the ART DIRECTOR'S design strategy below. The blueprint is the SOURCE OF TRUTH for colors, fonts, layout archetype, and visual components — do NOT substitute a generic template.

### EXACT CANVAS DIMENSIONS (STRICT)
- Width: ${width}px
- Height: ${height}px
- The design MUST fill the canvas (${width}x${height}px) harmoniously from top to bottom with ZERO scrollbars and ZERO clipping.
- Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### ART DIRECTOR DESIGN STRATEGY (SOURCE OF TRUTH)
${JSON.stringify(blueprint, null, 2)}

### REFINED CONTENT TO RENDER (ALL SECTIONS & STATS)
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### MANDATORY DESIGN EXECUTION RULES
1. **CSS VARIABLES (from the blueprint)**: define :root with:
   --primary: ${colors.primary}; --secondary: ${colors.secondary}; --accent: ${colors.accent};
   --background: ${colors.background}; --surface: ${colors.surface}; --text: ${colors.text};
   --text-muted: ${colors.textMuted}; --border: ${colors.border};
   --font-heading: '${headingFont}', sans-serif; --font-body: '${bodyFont}', sans-serif;
   Every later rule must reference these variables — never hardcode a different palette.
2. **FONTS**: load the blueprint's exact pairing:
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap">
   Headings use var(--font-heading), body text uses var(--font-body).
3. **LAYOUT ARCHETYPE**: follow blueprint.layoutArchetype and layoutStructure exactly:
   - bento_grid / metrics_dashboard → CSS grid with mixed row/column span cards and a stats band.
   - split_comparison → two contrasting halves (primary vs secondary tint) with a versus divider.
   - process_roadmap → numbered sequential cards with visual connectors/arrows.
   - editorial_list → single editorial column with numbered micro-badges.
   - timeline_spine → vertical/horizontal milestone spine with nodes.
   Distribute content across the FULL canvas: header ~15-20% height, stat band ~15%, main content ~55-60%, takeaway footer ~5-8%. ZERO large empty voids.
4. **BACKDROP & CARDS**: implement the background mood implied by the blueprint palette (dark background → layered mesh gradient with radial glow spheres; light background → clean editorial surface with soft tint washes). Cards use var(--surface), 1px var(--border), border-radius and soft shadows per blueprint.sectionCardTreatment.
5. **HIERARCHY & METERS**: kicker chip, big title with gradient text (primary→accent), glowing hero stat, and visual progress tracks under statistics (rounded 6px bars filled with a primary→accent gradient).
6. **ICONS**: inline <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">...</svg>. NO emoji, NO external <img> links.
7. **RESPONSIVE FIT**: use CSS clamp() fonts and flex/grid with gap so everything fits inside ${height}px without overflow.
8. **DOCUMENT STRUCTURE (MANDATORY)**:
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap">
     <style>
       :root { /* variables from rule 1 */ }
       * { margin: 0; padding: 0; box-sizing: border-box; }
       html, body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: var(--font-body); background: var(--background); color: var(--text); }
       .infographic-root { width: 100%; height: 100%; padding: 32px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
       /* Header, stat band, content grid, footer — styled per the blueprint */
     </style>
   </head>
   <body>
     <div class="infographic-root">
       <!-- Header: kicker chip, gradient title, subtitle -->
       <!-- Stat band: hero stat + stats with meters -->
       <!-- Content area: layout archetype from the blueprint -->
       <!-- Footer: key takeaway banner -->
     </div>
   </body>
   </html>
9. Pure HTML & CSS only — NO <script> tags.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown code fences, do NOT add explanations.`;
}