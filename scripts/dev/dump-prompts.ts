/**
 * Dumps the exact prompt text sent to the AI in each pipeline phase.
 * Run: npx tsx scripts/dev/dump-prompts.ts  →  writes docs/PROMPTS.md
 */
import { writeFileSync } from "node:fs";
import { buildContentAnalysisPrompt, buildDesignBlueprintPrompt, buildHTMLGenerationPrompt } from "../../src/services/ai/promptBuilder";
import type { AIGenerationRequest } from "../../src/lib/types";

const request: AIGenerationRequest = {
  input: "The rise of electric vehicles: adoption stats, battery tech, charging networks, future outlook.",
  inputType: "text",
  aspectRatio: "1:1",
  aspectRatioWidth: 1000,
  aspectRatioHeight: 1000,
  font: "inter",
  language: "en",
  audience: "general",
};

const content = {
  title: "The Electric Revolution",
  subtitle: "How EVs are rewiring global transport",
  kicker: "2026 MOBILITY",
  heroStat: { value: "41M", label: "EVs sold worldwide in 2025" },
  statistics: [
    { id: "s1", value: "41M", label: "Global EV sales 2025", icon: "chart" },
    { id: "s2", value: "62%", label: "Share of new sales in Norway", icon: "bolt" },
    { id: "s3", value: "$1.3T", label: "Projected market by 2030", icon: "rocket" },
  ],
  sections: [
    { id: "sec-1", title: "Adoption Curve", subtitle: "Global momentum", content: "EV sales grew 35% year over year.", bullets: ["China leads with 60% share", "Europe follows at 25%"], icon: "chart" },
    { id: "sec-2", title: "Battery Tech", subtitle: "The core enabler", content: "Solid-state cells promise 2x density.", bullets: ["1000 km ranges emerging", "Costs down 89% since 2010"], icon: "bolt" },
  ],
  timeline: [],
  keyTakeaway: "EVs are past the tipping point — the 2030s belong to electric.",
};

const blueprint = {
  colorPalette: { primary: "#0ea5e9", accent: "#f59e0b", background: "#ecfeff", text: "#083344" },
  typography: { headingFont: "Space Grotesk", bodyFont: "Inter" },
  layout: "Editorial magazine grid with a full-bleed cyan hero band",
};

const md = [
  "# Pipeline Prompts (as actually sent to the AI)",
  "",
  `_Generated ${new Date().toISOString()} — sample request: "${request.input}"_`,
  "",
  "## PHASE 1 — Content Polish & Expansion (`buildContentAnalysisPrompt`)",
  "",
  "```",
  buildContentAnalysisPrompt(request),
  "```",
  "",
  "## PHASE 2 — Custom Layout & Art Direction (`buildDesignBlueprintPrompt`)",
  "",
  "NOTE: the CREATIVE DIRECTION SEED line is randomized per generation (8 possible seeds).",
  "",
  "```",
  buildDesignBlueprintPrompt(content, request),
  "```",
  "",
  "## PHASE 3 — HTML/CSS Generation (`buildHTMLGenerationPrompt`)",
  "",
  "```",
  buildHTMLGenerationPrompt(content, blueprint, request),
  "```",
  "",
  "## FALLBACK — Single-shot (only if the 3-phase pipeline fails)",
  "",
  "```",
  `Design a complete, self-contained HTML infographic that visualizes the content below.

CONTENT TO VISUALIZE:
${request.input}

CANVAS: exactly 1000px wide and 1000px high. The outer container must be exactly those dimensions with overflow:hidden. Do not use viewport units.
THEME & STYLE: you decide everything — invent a palette, font pairing, composition and visual language that best expresses this specific content. Commit to one coherent creative idea; never default to a generic template.

REQUIREMENTS:
- Return a complete document starting with <!DOCTYPE html> and containing <head><style> and <body>.
- You choose the entire visual approach: background treatment, card/section styling, icon style, hierarchy — make it fit the subject's character.
- Use ONLY real content from the source above. No placeholders, no "lorem ipsum", no "your content here".
- No scripts, no external images, no emoji.
- Output ONLY the raw HTML — no markdown fences, no explanations.`,
  "```",
].join("\n");

writeFileSync("docs/PROMPTS.md", md);
console.log("Wrote docs/PROMPTS.md");
