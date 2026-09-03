import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// STEP 1: CONTENT ASSESSMENT, EXPANSION & TOPIC-SPECIFIC STRUCTURING
// The AI analyzes the user's input, assesses what the topic represents,
// and extracts or enriches it with natural data tailored to the subject.
// ============================================================
export function buildContentAnalysisPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const userIntentStr = userIntent || "Creative and visually engaging";

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

  return `You are an elite content strategist and data journalist.
Your goal is to prepare rich, publication-ready material for an infographic.

## INSTRUCTIONS
1. **UNDERSTAND THE TOPIC**: Determine what type of information this is (e.g. Comparison, History/Timeline, Step-by-Step Guide, Statistics & Metrics, Best Practices/Listicle, Hierarchy, or Concept Explanation).
2. **EXPAND & ENRICH**: If the user's input is brief or minimal, expand it with realistic, credible facts, concrete metrics (percentages, counts, multipliers, currencies), and actionable points.
3. **STRUCTURE APPROPRIATELY**:
   - Compelling Title (max 8 words)
   - Supporting Subtitle (max 14 words)
   - Key statistics/metrics with clear labels and values (e.g. "94%", "$2.4M", "4.8x", "150K+")
   - 3 to 5 core sections or steps or comparison items
   - Descriptive icon keywords (e.g. "rocket", "chart", "shield", "globe", "zap", "cpu", "users", "target") — NO EMOJIS.

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr})
- Input Mode: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Mood / Intent: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## SOURCE INPUT
"${input}"

## OUTPUT FORMAT
Return ONLY valid JSON (no code fences, no explanations):
{
  "title": "string (max 8 words)",
  "subtitle": "string (max 14 words)",
  "topicType": "comparison | timeline | process | dashboard | bento-grid | hierarchy | editorial",
  "heroStat": { "value": "95%", "label": "Primary takeaway metric" },
  "statistics": [
    { "id": "stat-1", "value": "88%", "label": "Metric description", "icon": "keyword" },
    { "id": "stat-2", "value": "3.5x", "label": "Metric description", "icon": "keyword" }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Section / Step / Item Title",
      "content": "Concise 1-2 sentence explanation.",
      "bullets": ["Concrete actionable detail 1", "Concrete actionable detail 2"],
      "icon": "keyword"
    }
  ],
  "timeline": [],
  "suggestedIcons": ["chart", "shield", "rocket", "bolt"],
  "suggestedColors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#0b0f19",
    "text": "#f8fafc"
  }
}`;
}

// ============================================================
// STEP 1+2 COMBINED: CONTENT ANALYSIS & BESPOKE CREATIVE BLUEPRINT
// The AI analyzes the topic, enriches the content, and AS AN ART DIRECTOR
// invents the bespoke visual layout best suited for this exact subject.
// ============================================================
export function buildContentBlueprintPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  const { input, inputType, aspectRatio, font, language, audience, aspectRatioWidth, aspectRatioHeight, userIntent, chatHistory, refinementPrompt, previousContent } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const userIntentStr = userIntent || "Modern, creative, and visually stunning";

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

  return `You are a visionary Art Director and senior Information Designer.
Your mission is to craft a **bespoke, visually captivating infographic design** tailored specifically to the subject matter.

DO NOT force a generic boilerplate or a boring grid of identical text boxes. Look at the topic and invent the visual layout that BEST communicates this idea on a ${dimensionsStr} (${aspectRatioStr}) canvas.

## TASK 1 — CONTENT (key "content")
- Enrich the input into structured, compelling content with high-impact numbers, punchy headers, and clear takeaways.
- Include 3 to 5 clear sections/steps/points with concise explanations and actionable bullets.

## TASK 2 — BESPOKE ART DIRECTION (key "blueprint")
Ask yourself: **"How should this specific topic be visually designed to look stunning and unique?"**
Choose the most compelling **Visual Layout Archetype**:
- **Comparison / Versus**: (e.g. React vs Vue, Before vs After) $\\rightarrow$ Split-screen dual column, high-contrast colors, middle VS badge, parallel comparison rows.
- **Roadmap / Timeline**: (e.g. History of Space, Evolutionary Stages) $\\rightarrow$ Flowing chronological roadmap with interconnected milestone nodes.
- **Process / Step-by-Step Journey**: (e.g. How-To, Frameworks, Sales Funnels) $\\rightarrow$ Numbered modular step flow with directional badges.
- **Data & Metric Dashboard**: (e.g. Market Benchmarks, Financials, Tech Stats) $\\rightarrow$ Prominent hero stat gauge, visual progress bars, metric highlight cards.
- **Bento Grid Showcase**: (e.g. Tips, Principles, Feature Roundup) $\\rightarrow$ Dynamic asymmetric bento cards with distinct visual hierarchy.
- **Hub & Spoke / Central Focus**: (e.g. Core System Architecture, Ecosystem) $\\rightarrow$ Central thematic hero element with radiating feature cards.
- **Editorial Magazine Showcase**: (e.g. Thought Leadership, Deep Dive) $\\rightarrow$ Expressive typography, pull-quote callouts, and clean asymmetrical blocks.

## SOURCE INPUT
"${input}"

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr} - ${isPortrait ? "Vertical" : isWide ? "Horizontal / Wide" : "Square"})
- Input Mode: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Aesthetic Tone: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## OUTPUT FORMAT
Return ONLY ONE valid JSON object (no markdown, no code fences, no explanations) with EXACTLY these two keys:

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
    "suggestedColors": { "primary": "#3b82f6", "secondary": "#8b5cf6", "accent": "#ec4899", "background": "#0b0f19", "text": "#f8fafc" }
  },
  "blueprint": {
    "visualArchetype": "comparison | timeline | process-flow | metric-dashboard | bento-grid | hub-and-spoke | editorial",
    "concept": "Creative vision for how this topic is visually depicted",
    "layoutStructure": "Description of how the canvas space is divided for this topic",
    "colorPalette": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "accent": "#ec4899",
      "background": "#0b0f19",
      "surface": "rgba(255, 255, 255, 0.05)",
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
      "borderRadius": "18px",
      "background": "rgba(18, 26, 43, 0.7)",
      "border": "1px solid rgba(255, 255, 255, 0.08)",
      "shadow": "0 16px 36px -10px rgba(0, 0, 0, 0.4)",
      "backdropFilter": "blur(16px)"
    },
    "bespokeGraphicElements": [
      "Description of specific visual elements to draw (e.g. progress bars, comparison badges, step nodes, stat meters, category tags)"
    ]
  }
}`;
}

// ============================================================
// STEP 2: DESIGN ARCHITECTURE & BESPOKE VISUAL BLUEPRINT
// Standalone prompt when running multi-phase pipeline.
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

  return `You are a world-class Art Director and Creative Technologist.
Given this specific content, invent the **most engaging, bespoke visual design layout** for an infographic.

DO NOT produce a generic box layout. Match the visual composition to the soul of the topic.

## CONTENT TO VISUALIZE
${JSON.stringify(content, null, 2)}

## TARGET CANVAS
- Size: ${dimensions} (${aspectRatio || "1:1"} - ${isPortrait ? "Portrait" : isWide ? "Landscape / Wide" : "Square"})
- Aesthetic Tone / Intent: "${userIntent || "Visually creative, polished, modern"}"
${chatBlock}${memoryBlock}
## YOUR DESIGN DECISIONS
1. **Choose the Visual Archetype**: (Comparison Split, Milestone Timeline, Sequential Process Flow, Data Dashboard, Asymmetric Bento Grid, Hub & Spoke, or Editorial Magazine).
2. **Color Palette & Atmosphere**: Pick colors that evoke the theme (e.g. Cyber Tech, Fintech Navy/Gold, Bio Emerald, Editorial Warm, Sunset Gradient). Ensure strong contrast (>=4.5:1).
3. **Typography**: Google Fonts with high visual personality (e.g. Plus Jakarta Sans, Outfit, Poppins, Space Grotesk).
4. **Graphic Components**: Define the custom visual elements to code (e.g. visual progress bars, numbered step badges, icon wrapper chips, comparison rows, quote highlights).

## OUTPUT FORMAT
Return ONLY valid JSON (no code fences, no explanations):
{
  "visualArchetype": "comparison | timeline | process-flow | metric-dashboard | bento-grid | hub-and-spoke | editorial",
  "concept": "One-line visual theme summary",
  "layoutStructure": "How the canvas is structured to fit ${dimensions}",
  "colorPalette": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#0b0f19",
    "surface": "rgba(255, 255, 255, 0.05)",
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
    "borderRadius": "18px",
    "background": "rgba(18, 26, 43, 0.7)",
    "border": "1px solid rgba(255, 255, 255, 0.08)",
    "shadow": "0 16px 36px -10px rgba(0, 0, 0, 0.4)",
    "backdropFilter": "blur(16px)"
  },
  "bespokeGraphicElements": [
    "List of graphic treatments to implement in CSS/HTML (meters, badges, connectors, etc.)"
  ]
}`;
}

// ============================================================
// STEP 3: BESPOKE HTML/CSS CODE GENERATION
// The AI coder translates the custom blueprint into clean, single-file HTML/CSS.
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

  return `## PHASE 3: BESPOKE HTML/CSS INFOGRAPHIC CREATION
You are an award-winning creative frontend engineer and visual graphic designer.
Your goal: Code the COMPLETE, single-file HTML/CSS for this infographic, executing the **Art Director's custom design blueprint**.

### CRITICAL CANVAS CONSTRAINTS
- Exact Canvas Size: ${width}px width × ${height}px height
- The layout MUST fit within ${width}x${height}px with ZERO scrollbars and ZERO clipping.
- Set: html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### DESIGN BLUEPRINT & CREATIVE VISION
${JSON.stringify(blueprint, null, 2)}

### CONTENT TO RENDER
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### DESIGN EXECUTION GUIDELINES
1. **Faithfully Build the Visual Archetype**:
   - If the blueprint chose **Comparison/Versus**: Build a split-screen or dual-column contrast with a prominent center "VS" badge and side-by-side comparison cards.
   - If **Timeline/Roadmap**: Build an interconnected milestone path with numbered nodes and connecting lines.
   - If **Process/Step Flow**: Build a directional sequence with styled step badges ("01", "02", "03") and flow indicators.
   - If **Data Dashboard**: Build bold numeric typography, visual progress bar meters (<div class="bar-fill" style="width: ...">), and stat badges.
   - If **Bento Grid / Editorial**: Build dynamic asymmetric cards with varying visual weight, accent glow, and pull-quote callouts.
   - If **Hub & Spoke**: Build a central anchor feature with radiating thematic nodes.
2. **Visual Depth & Background**:
   - Do NOT use a plain flat background. Use a rich multi-layer gradient or ambient glow mesh (e.g. radial-gradient highlights + dark/tinted background).
   - Give cards depth: subtle semi-transparent backgrounds (rgba), frosted glassmorphism (backdrop-filter: blur), subtle borders, and soft layered shadows.
3. **Rich Visual Typography & Icons**:
   - Load Google Fonts in <head> via <link rel="stylesheet" href="...">.
   - Use clean inline <svg> with viewBox, stroke="currentColor", and width/height 16-24px for all iconography. (NO external images, NO emojis).
   - Use uppercase category kicker tags, letter-spacing, and text-fill gradients where appropriate.
4. **Clean Pure HTML/CSS**:
   - Pure HTML & CSS only — NO <script> tags, NO external JavaScript.
   - Start with <!DOCTYPE html>.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown code fences, do NOT add explanations.`;
}