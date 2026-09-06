# Pipeline Prompts (as actually sent to the AI)

_Generated 2026-09-06T23:23:06.495Z — sample request: "The rise of electric vehicles: adoption stats, battery tech, charging networks, future outlook."_

## PHASE 1 — Content Polish & Expansion (`buildContentAnalysisPrompt`)

```
You are a senior content strategist and editor preparing publication-ready material for an INFOGRAPHIC.
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
- Canvas: 1000x1000px (1:1)
- Input Mode: text
- Tone / Intent: Clean and modern
- Language: en

## SOURCE INPUT
"The rise of electric vehicles: adoption stats, battery tech, charging networks, future outlook."

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
NOTE: Do NOT suggest colors or styling — that is the Art Director stage's job. Content only.
```

## PHASE 2 — Custom Layout & Art Direction (`buildDesignBlueprintPrompt`)

NOTE: the CREATIVE DIRECTION SEED line is randomized per generation (8 possible seeds).

```
You are a visionary Art Director and Master Infographic Designer.
This is STAGE 2 (Custom Layout & Visual Design Strategy).

Your job: study the refined content below and INVENT the complete visual design yourself. You have full creative freedom — structure, palette, typography, composition, decoration, motion-feel — everything is yours to decide. Do not follow any fixed template, archetype list, or house style: the design must grow out of what the content is about.

## CREATIVE DIRECTION SEED (a single spark of inspiration — interpret freely, twist it, or ignore it if the content suggests something better)
soft pastel dashboard — pale tinted background, pastel stat chips, rounded friendly typography
Repeated generations must produce visibly DIFFERENT designs. Commit fully to one coherent creative idea.

## TARGET CANVAS
- Dimensions: 1000x1000px (1:1)
- Canvas Aspect: Square
- Aesthetic Intent: "your choice — decide what serves this topic best"

## REFINED CONTENT TO DESIGN
{
  "title": "The Electric Revolution",
  "subtitle": "How EVs are rewiring global transport",
  "kicker": "2026 MOBILITY",
  "heroStat": {
    "value": "41M",
    "label": "EVs sold worldwide in 2025"
  },
  "statistics": [
    {
      "id": "s1",
      "value": "41M",
      "label": "Global EV sales 2025",
      "icon": "chart"
    },
    {
      "id": "s2",
      "value": "62%",
      "label": "Share of new sales in Norway",
      "icon": "bolt"
    },
    {
      "id": "s3",
      "value": "$1.3T",
      "label": "Projected market by 2030",
      "icon": "rocket"
    }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Adoption Curve",
      "subtitle": "Global momentum",
      "content": "EV sales grew 35% year over year.",
      "bullets": [
        "China leads with 60% share",
        "Europe follows at 25%"
      ],
      "icon": "chart"
    },
    {
      "id": "sec-2",
      "title": "Battery Tech",
      "subtitle": "The core enabler",
      "content": "Solid-state cells promise 2x density.",
      "bullets": [
        "1000 km ranges emerging",
        "Costs down 89% since 2010"
      ],
      "icon": "bolt"
    }
  ],
  "timeline": [],
  "keyTakeaway": "EVs are past the tipping point — the 2030s belong to electric."
}

## WHAT TO DECIDE (non-exhaustive — add anything else the design needs)
- A creative concept and the layout/composition that expresses it
- A semantic color palette that fits the subject's mood (ensure WCAG AA contrast)
- A Google Fonts pairing with character matching the topic
- Shapes, textures, borders, shadows, icon treatment, visual metaphors, decorative systems
- How statistics, sections, and the takeaway are given visual hierarchy

## QUALITY BAR (what separates an award-winning infographic from a generic one)
- **Exact values, never adjectives**: every color as #hex, every font size in px or clamp(),
  every weight as a number. "Modern and clean" is not a specification.
- **3+ levels of visual hierarchy** (hero → section → detail) that differ clearly in scale,
  weight, AND color — a reader must parse the order of importance within 2 seconds.
- **ONE memorable visual anchor**: a giant hero number, a bold graphic motif, or an unusual
  composition — the thing people will remember.
- **Density plan**: this design must fit 2 sections + 3 statistics
  inside 1000x1000px with deliberate whitespace rhythm — state what share of the canvas
  each zone gets (percentages) so nothing crowds and nothing floats in emptiness.
- **A repeating decorative system**: one corner-radius family, one stroke width, one icon
  style used everywhere — coherence beats more decoration.

## OUTPUT FORMAT
Return ONLY one valid JSON object (no code fences, no markdown) describing your complete design system. The three required keys below are the minimum contract with the coder stage — beyond them, YOU choose the structure and add as many of your own keys as the design needs:

{
  "colorPalette": { "primary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex", "...": "any other color roles you want" },
  "typography": { "headingFont": "Google Font name", "bodyFont": "Google Font name", "...": "sizes, weights, scales — your call" },
  "layout": { "...": "describe the composition however you like" },
  "...": "any additional design dimensions you decide on"
}
```

## PHASE 3 — HTML/CSS Generation (`buildHTMLGenerationPrompt`)

```
## STAGE 3: HTML/CSS CODE GENERATION
You are a senior frontend engineer bringing the ART DIRECTOR'S design to life. The design system JSON below is the SOURCE OF TRUTH — implement it faithfully and creatively. The markup structure, CSS architecture, class naming, composition, and all visual decisions are entirely YOURS; do NOT fall back to any fixed template or house style.

### HARD TECHNICAL CONSTRAINTS (non-negotiable)
1. **EXACT canvas**: 1000x1000px. Set html, body { width: 1000px; height: 1000px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; } and fill the canvas with ZERO scrollbars and ZERO clipped content.
2. **One self-contained file**: a complete document starting with <!DOCTYPE html> — <head> containing the Google Fonts <link> for the design system's chosen fonts plus a single <style> block, then <body>. No JavaScript, no external images, no iframes.
3. **Icons**: inline <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">...</svg>. NO emoji.
4. **All content, real content**: render EVERY section and statistic below with clear visual hierarchy — nothing dropped, no placeholders, no "lorem ipsum".
5. **Readable & fitted**: honor the palette's WCAG AA contrast; use clamp()-based font sizing and fluid layout so the design fits 1000px perfectly.
6. **Output**: ONLY the raw HTML starting with <!DOCTYPE html> — no markdown code fences, no explanations.

### ART DIRECTOR'S DESIGN SYSTEM (your creative brief)
{
  "colorPalette": {
    "primary": "#0ea5e9",
    "accent": "#f59e0b",
    "background": "#ecfeff",
    "text": "#083344"
  },
  "typography": {
    "headingFont": "Space Grotesk",
    "bodyFont": "Inter"
  },
  "layout": "Editorial magazine grid with a full-bleed cyan hero band"
}

### CONTENT TO RENDER (all sections & stats)
Density to plan for: 2 sections, 3 statistics, 1 key takeaway — inside exactly 1000x1000px.
{
  "title": "The Electric Revolution",
  "subtitle": "How EVs are rewiring global transport",
  "kicker": "2026 MOBILITY",
  "heroStat": {
    "value": "41M",
    "label": "EVs sold worldwide in 2025"
  },
  "statistics": [
    {
      "id": "s1",
      "value": "41M",
      "label": "Global EV sales 2025",
      "icon": "chart"
    },
    {
      "id": "s2",
      "value": "62%",
      "label": "Share of new sales in Norway",
      "icon": "bolt"
    },
    {
      "id": "s3",
      "value": "$1.3T",
      "label": "Projected market by 2030",
      "icon": "rocket"
    }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Adoption Curve",
      "subtitle": "Global momentum",
      "content": "EV sales grew 35% year over year.",
      "bullets": [
        "China leads with 60% share",
        "Europe follows at 25%"
      ],
      "icon": "chart"
    },
    {
      "id": "sec-2",
      "title": "Battery Tech",
      "subtitle": "The core enabler",
      "content": "Solid-state cells promise 2x density.",
      "bullets": [
        "1000 km ranges emerging",
        "Costs down 89% since 2010"
      ],
      "icon": "bolt"
    }
  ],
  "timeline": [],
  "keyTakeaway": "EVs are past the tipping point — the 2030s belong to electric."
}
### BEFORE YOU OUTPUT — SELF-CHECK (verify silently; fix anything that fails before answering)
- Every section and statistic from the content appears, nothing dropped or replaced.
- Total composition fits exactly 1000x1000px — no overflow, no scrollbars, no clipped text.
- All colors trace to the design system; text/background contrast meets WCAG AA everywhere.
- Typography follows the brief's pairing and scale; nothing below 11px.
- The composition is distinctive and executes the brief's signature idea — not a generic card grid.
- Spacing is balanced: no giant empty voids, no cramped clusters.
```

## FALLBACK — Single-shot (only if the 3-phase pipeline fails)

```
Design a complete, self-contained HTML infographic that visualizes the content below.

CONTENT TO VISUALIZE:
The rise of electric vehicles: adoption stats, battery tech, charging networks, future outlook.

CANVAS: exactly 1000px wide and 1000px high. The outer container must be exactly those dimensions with overflow:hidden. Do not use viewport units.
THEME & STYLE: you decide everything — invent a palette, font pairing, composition and visual language that best expresses this specific content. Commit to one coherent creative idea; never default to a generic template.

REQUIREMENTS:
- Return a complete document starting with <!DOCTYPE html> and containing <head><style> and <body>.
- You choose the entire visual approach: background treatment, card/section styling, icon style, hierarchy — make it fit the subject's character.
- Use ONLY real content from the source above. No placeholders, no "lorem ipsum", no "your content here".
- No scripts, no external images, no emoji.
- Output ONLY the raw HTML — no markdown fences, no explanations.
```