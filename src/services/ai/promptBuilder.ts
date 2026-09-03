import { AIGenerationRequest } from "@/lib/types";
import { getCanvasDimensions } from "@/lib/canvas";

// ============================================================
// STAGE 1: UNIFIED CONTENT ANALYSIS & ART DIRECTOR BLUEPRINT
// Generates a rich, publication-grade content package AND the custom
// visual layout architecture in ONE smart, high-speed round-trip.
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
    refinementBlock = `\n## REFINEMENT INSTRUCTION\nUser requested change: "${refinementPrompt || "Update content"}"\nPrevious content: ${JSON.stringify(previousContent || {})}\nApply the user's edit while preserving established core facts.\n`;
  }

  return `You are a world-class Infographic Content Strategist AND visionary Art Director.
Produce (1) an extensively enriched, publication-ready content package, and (2) a custom visual design layout specification.

## SOURCE TOPIC / INPUT
"${input}"

## CRITICAL CONTENT RULES
1. **SPELL CHECK & POLISH**: Fix all typos, grammar mistakes, and awkward phrasing.
2. **COMPREHENSIVE EXPANSION**: Even if the input is only 2-3 words (e.g. "what is ai"), you MUST expand it into a deep, educational, complete infographic package:
   - Punchy Title (max 8 words)
   - Descriptive Subtitle (max 14 words)
   - Kicker Tag (2-3 words uppercase category, e.g. "2026 AI BLUEPRINT", "EXECUTIVE BRIEF")
   - EXACTLY 4 substantial Sections (each with bold title, 1-2 sentence overview, and 2-3 concrete bullet points with actionable details)
   - EXACTLY 3 or 4 concrete Statistics with realistic high-impact numbers (e.g. "88%", "$1.3T", "3.7x", "500M+"), clear labels, and percentage growth context
   - ONE Hero Stat representing the primary metric
   - ONE Key Takeaway summary sentence
   - 4 to 6 icon keywords (e.g. "brain", "cpu", "network", "shield", "rocket", "chart") — NO emoji.

## CRITICAL ART DIRECTOR LAYOUT RULES
1. **CUSTOM LAYOUT FOR THIS TOPIC**: Analyze the topic semantics and choose the best layout archetype:
   - "bento_grid": 2x2 or 3-panel dynamic bento box for balanced topics
   - "split_comparison": 2-column versus contrast for comparisons
   - "process_roadmap": 4-step progressive flow for timelines/how-to guides
   - "metrics_dashboard": Stat-heavy analytics report
2. **COLOR HARMONY (60-30-10 Rule)**:
   - 60% Background: Deep ambient mesh gradient (e.g. dark navy #0b0f19 with radial glowing spheres, or crisp editorial light)
   - 30% Surface: Elevated glassmorphic cards with 1px border and soft drop shadow
   - 10% Accent: High-energy vibrant neon/electric accent for stats and meters
3. **TYPOGRAPHY**: High-contrast pairing (e.g. "Plus Jakarta Sans" for bold titles + "Inter" for body text).

## CONTEXT
- Canvas: ${dimensionsStr} (${aspectRatioStr} ${isPortrait ? "Portrait" : isWide ? "Landscape" : "Square"})
- Mode: ${inputType || "text"}
- Preferred Font: ${fontStr}
- Target Audience: ${audienceStr}
- Aesthetic Tone: ${userIntentStr}
- Language: ${languageStr}
${conversationBlock}${refinementBlock}${memoryBlock}
## OUTPUT FORMAT
Return ONLY valid JSON (no markdown code fences, no explanations) with EXACTLY "content" and "blueprint":
{
  "content": {
    "topicType": "general | comparison | process_steps | metrics_data | list_features",
    "kicker": "2026 EXECUTIVE GUIDE",
    "title": "Comprehensive Title Here",
    "subtitle": "Detailed engaging subtitle explaining the core value",
    "heroStat": { "value": "88%", "label": "Enterprise Adoption Rate", "change": "+34% YoY" },
    "statistics": [
      { "id": "stat-1", "value": "$1.3T", "label": "Global Market Impact", "icon": "chart" },
      { "id": "stat-2", "value": "88%", "label": "Enterprise Adoption", "icon": "users" },
      { "id": "stat-3", "value": "3.7x", "label": "Productivity Multiplier", "icon": "rocket" },
      { "id": "stat-4", "value": "500M+", "label": "Daily Active Users", "icon": "globe" }
    ],
    "sections": [
      {
        "id": "sec-1",
        "title": "1. Core Architecture",
        "subtitle": "Foundation & Models",
        "content": "Comprehensive overview explaining the fundamental mechanism.",
        "bullets": ["Key technical capability 1", "Actionable architectural insight 2"],
        "icon": "cpu"
      },
      {
        "id": "sec-2",
        "title": "2. Natural Language Processing",
        "subtitle": "Large Language Models",
        "content": "Deep breakdown of language understanding and generative reasoning.",
        "bullets": ["Context awareness & reasoning", "Multimodal transformer models"],
        "icon": "brain"
      },
      {
        "id": "sec-3",
        "title": "3. Computer Vision & Robotics",
        "subtitle": "Perception & Action",
        "content": "Visual perception systems enabling autonomous decisions in real time.",
        "bullets": ["Real-time object detection", "Autonomous spatial navigation"],
        "icon": "eye"
      },
      {
        "id": "sec-4",
        "title": "4. Enterprise Impact & Future",
        "subtitle": "Automation & Scale",
        "content": "Accelerating workflow automation and delivering measurable ROI.",
        "bullets": ["10x operational efficiency", "Ethical guardrails & safety"],
        "icon": "rocket"
      }
    ],
    "timeline": [],
    "keyTakeaway": "AI transforms complex workflows into automated, high-precision operations.",
    "suggestedIcons": ["brain", "cpu", "network", "chart", "rocket", "shield"],
    "suggestedColors": { "primary": "#3b82f6", "secondary": "#8b5cf6", "accent": "#ec4899", "background": "#0b0f19", "text": "#f8fafc" }
  },
  "blueprint": {
    "layoutArchetype": "bento_grid",
    "concept": "Modern glassmorphic tech dashboard",
    "colorPalette": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6",
      "accent": "#ec4899",
      "background": "#0b0f19",
      "surface": "rgba(18, 26, 43, 0.75)",
      "text": "#ffffff",
      "textMuted": "#94a3b8",
      "border": "rgba(255, 255, 255, 0.12)",
      "glow": "rgba(59, 130, 246, 0.25)"
    },
    "typography": {
      "headingFont": "Plus Jakarta Sans",
      "bodyFont": "Inter",
      "heroSize": "clamp(38px, 4.5vw, 52px)",
      "h2Size": "clamp(20px, 2.2vw, 26px)",
      "bodySize": "clamp(14px, 1.4vw, 17px)"
    },
    "visualComponents": [
      "Deep ambient radial glow background",
      "Top header banner with kicker tag chip and text gradient",
      "Horizontal 4-card metric band with progress bars",
      "2x2 equal height content grid filling the entire center canvas",
      "Bottom key takeaway bar with gradient border"
    ]
  }
}`;
}

export function buildContentAnalysisPrompt(request: AIGenerationRequest, memoryContext?: string): string {
  return buildContentBlueprintPrompt(request, memoryContext);
}

export function buildDesignBlueprintPrompt(content: unknown, request: AIGenerationRequest, memoryContext?: string): string {
  return buildContentBlueprintPrompt(request, memoryContext);
}

// ============================================================
// STAGE 2: CODER AI — HTML/CSS CODE GENERATION
// Codes single-file HTML/CSS strictly adhering to full-canvas
// layout distribution so the canvas is rich, balanced, and stunning.
// ============================================================
export function buildHTMLGenerationPrompt(content: any, blueprint: any, request: AIGenerationRequest, memoryContext?: string): string {
  const { width, height } = getCanvasDimensions(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);

  const memoryBlock = memoryContext ? `\n## WORKING MEMORY\n${memoryContext}\n` : "";

  let chatBlock = "";
  if (request.chatHistory && request.chatHistory.length > 0) {
    chatBlock = `\n## RECENT USER EDITS\n${request.chatHistory.slice(-2).map((m) => `${m.role}: ${m.content}`).join("\n")}\n`;
  }
  if (request.refinementPrompt) {
    chatBlock += `Apply user edit: "${request.refinementPrompt}"\n`;
  }

  return `## STAGE 2: HTML/CSS CODE GENERATION
You are an expert senior frontend engineer and visual designer.
Code the COMPLETE, single-file HTML/CSS infographic document.

### EXACT CANVAS DIMENSIONS (CRITICAL)
- Width: ${width}px
- Height: ${height}px
- The layout MUST fit within ${width}x${height}px with ZERO scrollbars and ZERO clipping.
- Set html, body { width: ${width}px; height: ${height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }

### ART DIRECTOR DESIGN BLUEPRINT
${JSON.stringify(blueprint, null, 2)}

### FULL CONTENT PACKAGE TO RENDER (RENDER ALL 4 SECTIONS & ALL STATS)
${JSON.stringify(content, null, 2)}
${chatBlock}${memoryBlock}
### CRITICAL CANVAS PROPORTION & LAYOUT RULES (NO EMPTY SPACES)
1. **FULL-CANVAS ROOT CONTAINER**:
   \`\`\`css
   .infographic-canvas {
     width: ${width}px;
     height: ${height}px;
     box-sizing: border-box;
     padding: 36px 40px;
     display: flex;
     flex-direction: column;
     justify-content: space-between;
     overflow: hidden;
     position: relative;
     background: radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.22) 0%, transparent 45%),
                 radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.18) 0%, transparent 45%),
                 radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
                 #0b0f19;
     font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
     color: #f8fafc;
   }
   \`\`\`

2. **ZONE 1: HEADER (top 15-18% of canvas)**:
   - Kicker tag: \`<span class="kicker-chip">\${content.kicker || "EXECUTIVE SUMMARY"}</span>\`
     (style: uppercase, letter-spacing 1.5px, font-size 13px, font-weight 700, padding 6px 14px, border-radius 999px, background rgba(59,130,246,0.18), border 1px solid rgba(59,130,246,0.4), color #60a5fa, display inline-block)
   - Title: \`<h1 class="hero-title">\${content.title}</h1>\`
     (style: font-size clamp(36px, 4.2vw, 48px), font-weight 800, line-height 1.15, margin 8px 0 4px 0, background linear-gradient(135deg, #ffffff 40%, #c7d2fe 100%), -webkit-background-clip text, -webkit-text-fill-color transparent)
   - Subtitle: \`<p class="hero-subtitle">\${content.subtitle}</p>\`
     (style: font-size clamp(16px, 1.8vw, 20px), color #94a3b8, margin 0)

3. **ZONE 2: STAT METRICS BAND (15-18% of canvas)**:
   - Render a horizontal row of 3 or 4 stat cards with equal width (\`display: flex; gap: 14px; width: 100%;\`).
   - Each card has:
     - Stat Number (\`font-size: clamp(34px, 4.2vw, 46px); font-weight: 800; color: #38bdf8; line-height: 1;\`)
     - Stat Label (\`font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase;\`)
     - Horizontal gradient progress bar:
       \`<div class="meter-track" style="height: 6px; border-radius: 999px; background: rgba(255,255,255,0.1); margin-top: 8px; overflow: hidden;"><div class="meter-fill" style="height: 100%; width: 85%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 999px;"></div></div>\`

4. **ZONE 3: CORE CONTENT GRID (fills 55-60% of canvas — NO EMPTY SPACE)**:
   - Render ALL 4 sections in a balanced 2x2 grid:
     \`\`\`css
     .content-grid {
       display: grid;
       grid-template-columns: repeat(2, 1fr);
       gap: 16px;
       flex: 1;
       margin: 14px 0;
     }
     \`\`\`
   - Each section card:
     \`\`\`css
     .section-card {
       background: rgba(18, 26, 43, 0.75);
       border: 1px solid rgba(255, 255, 255, 0.12);
       border-radius: 18px;
       padding: 20px 22px;
       backdrop-filter: blur(12px);
       box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
       display: flex;
       flex-direction: column;
       justify-content: space-between;
     }
     \`\`\`
   - Card Top: Inline SVG icon in a styled \`42px\` square box (\`background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 10px;\`) + Section Title (\`font-size: clamp(18px, 2vw, 22px); font-weight: 700; color: #f8fafc;\`).
   - Card Body: Description overview (\`font-size: clamp(13px, 1.3vw, 15px); color: #cbd5e1; line-height: 1.5;\`).
   - Card Bullets: Actionable bullet points rendered as styled pill chips or list items with bullet SVGs.

5. **ZONE 4: BOTTOM TAKEAWAY FOOTER (6-8% of canvas)**:
   - Full-width takeaway pill:
     \`\`\`html
     <div class="footer-takeaway" style="padding: 12px 22px; border-radius: 999px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: #e2e8f0;">
       <span>✦ <strong>KEY TAKEAWAY:</strong> \${content.keyTakeaway || "Automates workflows and delivers measurable scale."}</span>
       <span style="color: #60a5fa; font-size: 12px; text-transform: uppercase;">Infographic Studio • 2026</span>
     </div>
     \`\`\`

6. **TECHNICAL CODING REQUIREMENTS**:
   - Start with <!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Inter:wght@400;500;600&display=swap"><style>...</style></head><body>...</body></html>.
   - Use crisp inline SVGs with stroke="currentColor" and stroke-width="2". NO emoji, NO external <img> links.
   - Pure HTML & CSS only — NO <script> tags.

### OUTPUT FORMAT
Output ONLY the raw self-contained HTML code starting with <!DOCTYPE html>. Do NOT add markdown code fences, do NOT add explanations.`;
}