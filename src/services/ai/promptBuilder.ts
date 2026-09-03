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
You are an expert senior frontend engineer and award-winning visual designer.
Code the COMPLETE, single-file HTML/CSS document faithfully executing the custom design strategy.

### EXACT CANVAS DIMENSIONS (STRICT)
- Width: ${width}px
- Height: ${height}px
- The design MUST fill the canvas (${width}x${height}px) harmoniously from top to bottom with ZERO scrollbars and ZERO clipping.
- Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### ART DIRECTOR DESIGN STRATEGY
${JSON.stringify(blueprint, null, 2)}

### REFINED CONTENT TO RENDER (ALL SECTIONS & STATS)
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### CRITICAL LAYOUT & PROPORTIONAL BALANCE RULES
1. **NO EMPTY VOIDS**: Distribute content evenly across the entire ${height}px height:
   - **Header (~18-20% height)**: Category kicker tag chip + Bold Title (with text gradient) + Subtitle.
   - **Stat / Metrics Band (~15-18% height)**: Hero stat + key statistics with glowing numbers, labels, and mini visual progress bars.
   - **Core Content Area (~55-60% height)**: Render all 3-4 sections as styled cards (Bento grid / multi-column flex) with icon badges, section titles, subtitles, descriptions, and clear bullet points.
   - **Footer (~5-8% height)**: Key takeaway banner / source tag.
2. **STYLING & DEPTH**:
   - Background: Layered mesh gradient with radial ambient glow spheres (e.g. radial-gradient(circle at 15% 15%, ...), radial-gradient(circle at 85% 85%, ...), #0b0f19).
   - Cards: Glassmorphic or elevated surface (\`background: rgba(18, 26, 43, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);\`).
   - Icon wrappers: Styled badge containers (\`display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #6366f1;\`).
   - Visual meters: Add visual progress tracks under stats (\`<div style="height: 6px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden;"><div style="height: 100%; width: 85%; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 999px;"></div></div>\`).
3. **ICONS**: Use inline <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">...</svg>. NO emoji, NO external <img> links.
4. **RESPONSIVE FIT**: Use CSS \`clamp()\` fonts and flex/grid with \`gap\` so everything fits inside ${height}px without overflow.
5. **DOCUMENT STRUCTURE (MANDATORY)**:
   You MUST return a complete, valid document formatted exactly like this:
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap">
     <style>
       * { margin: 0; padding: 0; box-sizing: border-box; }
       html, body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
       /* All your CSS classes, custom properties, and styling rules here */
     </style>
   </head>
   <body>
     <!-- ALL HTML content, containers, headers, cards, and SVGs go inside body -->
   </body>
   </html>
6. Pure HTML & CSS only — NO <script> tags.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown code fences, do NOT add explanations.`;
}