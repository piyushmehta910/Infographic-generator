# Infographic AI — Project Documentation

> AI-powered infographic generator that transforms any text into publication-ready visual infographics using a multi-phase AI pipeline.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Pipeline Phases](#pipeline-phases)
- [Export System](#export-system)
- [Project Architecture](#project-architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Provider System](#provider-system)
- [Settings \& Configuration](#settings--configuration)

---

## Overview

Infographic AI is a web application that:
1. Takes any text input (article, facts, topic description)
2. Runs it through a 3-phase AI pipeline to generate a complete infographic
3. Exports the result as PNG, JPG, PDF, SVG, or JSON

**Key Features:**
- 6 aspect ratios (Square, Post, Story, Banner, A4, Letter)
- 5+ AI providers (OpenRouter, Gemini, Groq, NIM, Mistral, Custom)
- Auto-fallback between providers when one fails
- Real-time progress streaming
- Version history (revisions)
- Keyboard shortcuts
- Local-first (keys stored in browser)

---

## How It Works

```
User Input → Phase 1 (Content) → Phase 2 (Design) → Phase 3 (HTML/CSS) → Live Preview → Export
```

1. **User enters text** in the sidebar input panel
2. **Generate** is clicked (or Ctrl+Enter)
3. **Server runs the 3-phase pipeline** via SSE (Server-Sent Events)
4. **Progress streams** to the browser in real-time
5. **Final HTML renders** in a live preview iframe
6. **User exports** in their preferred format

---

## Pipeline Phases

### Phase 1: Content Polish & Expansion

**Purpose:** Transform raw input into structured, publication-ready content.

**What it does:**
- Fixes spelling, grammar, typos
- Expands brief input with factual information
- Detects topic archetype (comparison, process, metrics, list, timeline, general)
- Structures content into: title, subtitle, kicker, sections, statistics, hero stat, key takeaway
- Suggests icon keywords

**Prompt highlights:**
```
You are a senior content strategist and editor preparing publication-ready material for an INFOGRAPHIC.
This is STAGE 1 (Content Polish, Spelling Correction & Expansion).

1. SPELL CHECK & POLISH: Check spelling, fix grammar mistakes, typos, and clumsy phrasing.
2. COMPLETE & EXPAND: If the input is brief or a raw topic/draft, complete and expand it
   with relevant, factual information. Never invent numbers or statistics.
3. TOPIC TYPE: Detect the semantic topic archetype:
   - comparison (A vs B) · process_steps · metrics_data · list_features · timeline · general
4. STRUCTURE: Engaging Title (max 8 words) · Subtitle (max 14 words) ·
   Kicker Tag (2-3 words) · 3-5 Sections with description + 2-3 bullets ·
   Statistics and Hero Stat ONLY if source contains real numeric data ·
   Key Takeaway · Suggested icon keywords (NEVER emoji)

OUTPUT → JSON only:
{ topicType, kicker, title, subtitle, heroStat, statistics[3-4], sections[3-5], keyTakeaway, suggestedIcons }
NOTE: Do NOT suggest colors or styling — that is the Art Director stage's job.
```

**Output:** Structured JSON content object

---

### Phase 2: Custom Layout & Art Direction

**Purpose:** Design the complete visual system for the infographic.

**What it does:**
- Invents a creative concept based on the content
- Chooses a semantic color palette (WCAG AA contrast)
- Selects Google Fonts pairing
- Defines layout/composition approach
- Decides shapes, textures, borders, shadows, icon treatment
- Plans visual hierarchy

**Prompt highlights:**
```
You are a visionary Art Director and Master Infographic Designer.
This is STAGE 2 (Custom Layout & Visual Design Strategy).

Your job: study the refined content below and INVENT the complete visual design yourself.
You have full creative freedom — structure, palette, typography, composition, decoration,
motion-feel — everything is yours to decide. Do not follow any fixed template, archetype
list, or house style: the design must grow out of what the content is about.

CREATIVE DIRECTION SEED (randomized each generation for variety):
"midnight minimal — deep slate canvas, ONE single accent hue, hairline dividers, no card fills"
(others: dark premium tech, light editorial magazine, vivid gradient poster, corporate clean,
retro print poster, soft pastel dashboard, brutalist bold)

QUALITY BAR — your design MUST:
- Use exact values (#hex, px/clamp(), weights as numbers), never adjectives
- Define 3+ hierarchy levels (hero → section → detail) differing in scale, weight, and color
- Include ONE memorable visual anchor (giant number / bold motif / unusual composition)
- Plan density to fit all sections + statistics inside the canvas
- Be a DIFFERENT direction from previous designs in this session

OUTPUT → JSON object (minimum contract, add your own keys):
{ colorPalette: {...}, typography: {...}, layout: {...}, ...your own design dimensions }
```

**Output:** Design system JSON (color palette, typography, layout, decorations)

---

### Phase 3: HTML/CSS Code Generation

**Purpose:** Code the final infographic as a single self-contained HTML file.

**What it does:**
- Implements the art director's design system
- Renders all content sections, statistics, and icons
- Ensures exact canvas dimensions with no overflow
- Uses inline SVG icons (no emoji)
- Applies WCAG AA contrast
- Outputs raw HTML

**Prompt highlights:**
```
## STAGE 3: HTML/CSS CODE GENERATION
You are a senior frontend engineer bringing the ART DIRECTOR'S design to life. The design
system JSON below is the SOURCE OF TRUTH — implement it faithfully and creatively. The
markup structure, CSS architecture, class naming, composition, and all visual decisions
are entirely YOURS; do NOT fall back to any fixed template or house style.

### HARD TECHNICAL CONSTRAINTS (non-negotiable)
1. EXACT canvas: {W}x{H}px. html,body { width:{W}px; height:{H}px; overflow:hidden; box-sizing:border-box; }
2. One self-contained file: <!DOCTYPE html> + Google Fonts <link> + single <style> block.
   No JavaScript, no external images, no iframes.
3. Icons: inline <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">. NO emoji.
4. All content rendered — no placeholders, no "lorem ipsum".
5. WCAG AA contrast; clamp()-based font sizing; fits {H}px perfectly.
6. NEVER use vw/vh/vmin/vmax — use px only.
7. Output: ONLY the raw HTML starting with <!DOCTYPE html>.

### BEFORE YOU OUTPUT — SELF-CHECK (verify silently; fix anything that fails)
- Every section and statistic appears — nothing dropped or replaced.
- Fits exactly {W}x{H}px — no overflow, no scrollbars, no clipped text.
- All colors trace to the design system; contrast meets WCAG AA.
- Typography follows the brief's pairing and scale; nothing below 11px.
- The composition is distinctive and executes the brief's signature idea.
- Spacing balanced: no giant empty voids, no cramped clusters.
```

**Output:** Complete self-contained HTML document

---

### Fallback: Single-Shot Generation

If any phase fails (provider error, timeout, malformed output), the pipeline automatically falls back to a single-shot generation that creates the complete infographic in one call.

**Prompt highlights:**
```
Design a complete, self-contained HTML infographic that visualizes the content below.

THEME & STYLE: you decide everything — invent a palette, font pairing, composition and
visual language that best expresses this specific content. Commit to one coherent creative
idea; never default to a generic template.

REQUIREMENTS:
- Complete <!DOCTYPE html> document with <head><style> and <body>
- You choose the entire visual approach
- Use ONLY real content from the source — no placeholders, no "lorem ipsum"
- No scripts, no external images, no emoji
- Output ONLY the raw HTML — no markdown fences, no explanations
```

---

## Export System

The export system captures the generated infographic in multiple formats.

### Export Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **PNG** | High-res image (2x pixel ratio) | Social media, web |
| **JPG** | Compressed image (white background) | Email, documents |
| **PDF** | Print-ready document | Printing, sharing |
| **SVG** | Vector (editable) | Design tools, scaling |
| **JSON** | Raw HTML markup | Re-importing, editing |

### How Export Works

1. **Preview renders** the HTML in an `<iframe srcDoc>`
2. **Export re-renders** the same HTML inline in a detached offscreen container (because html-to-image cannot rasterize nested iframes)
3. **Google Fonts are loaded** and awaited before capture
4. **html-to-image** rasterizes the element at 2x pixel ratio
5. **File is downloaded** via blob URL

### Export Flow Diagram

```
Live Preview (iframe srcDoc)
        ↓
Export Clicked → showToast("Exporting as PNG…")
        ↓
renderOffscreenForCapture(html, W, H)
   - Parse HTML with DOMParser
   - Clone <style> rules, scope body/html selectors
   - Transfer body attributes to inner container
   - Append body children to inner
   - Attach offscreen container to document
   - Wait for fonts.ready
        ↓
html-to-image (toJpeg / toSvg / toPng)
   - quality: 1, pixelRatio: 2
   - backgroundColor: "#ffffff" (JPG only)
        ↓
PDF path: jsPDF.addImage → pdf.save("infographic.pdf")
Image/SVG path: anchor click → download
        ↓
showToast("Exported as PNG")
```

### Server-Side Canvas Enforcement

Before the HTML reaches the client, `enforceCanvas()` in `src/services/ai/response.ts`:
- Converts viewport units (vw/vh/vmin/vmax) to exact px
- Enforces 11px font-size floor
- Fixes WCAG AA contrast failures
- Injects `html,body { width/height: {WxH}px !important; overflow:hidden !important; box-sizing:border-box }`

### Client-Side Fit-to-Frame

`AIDesignRenderer` measures the rendered content and applies `transform: scale(...)` to ensure it always fits the preview frame (scales up small designs AND down overflowing ones).

---

## Project Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # SSE endpoint — runs the pipeline
│   │   ├── health/route.ts        # Health check
│   │   ├── models/route.ts        # Provider model catalog
│   │   └── test-provider/route.ts # Test provider connection
│   ├── generate/page.tsx          # Main generation UI
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/
│   ├── generate/
│   │   ├── CanvasView.tsx         # Canvas + toolbar + export
│   │   ├── InputPanel.tsx         # Sidebar input form
│   │   └── ProviderSettings.tsx   # Provider configuration modal
│   ├── templates/
│   │   └── AIDesignRenderer.tsx   # Live iframe preview + fit-to-frame
│   ├── ui/
│   │   ├── Button.tsx             # Button component
│   │   └── Toast.tsx              # Toast notifications
│   └── landing/                   # Landing page sections
├── services/ai/
│   ├── pipeline.ts                # 3-phase pipeline orchestrator
│   ├── promptBuilder.ts           # Prompt construction for each phase
│   ├── providers.ts               # Provider implementations
│   ├── response.ts                # Response extraction + enforceCanvas
│   ├── fallback.ts                # Auto-fallback chain
│   ├── quality.ts                 # HTML quality scoring
│   ├── memory.ts                  # Session memory
│   └── normalize.ts               # Input normalization
├── lib/
│   ├── export/
│   │   └── capture.ts             # Offscreen rendering for export
│   ├── canvas.ts                  # Canvas size calculations
│   ├── constants.ts               # App constants (aspect ratios, intents)
│   ├── schemas.ts                 # Zod validation schemas
│   ├── types.ts                   # TypeScript type definitions
│   └── site.ts                    # Site metadata
└── stores/
    ├── aiStore.ts                 # AI provider state
    ├── editorStore.ts             # Editor/infographic state
    └── uiStore.ts                 # UI state (toast)
```

---

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + Enter` | Generate infographic | Textarea focused |
| `Ctrl/Cmd + S` | Export as PNG | When HTML exists |
| `Ctrl/Cmd + Shift + S` | Export as PDF | When HTML exists |
| `Ctrl/Cmd + R` | Regenerate | Not in input, has content |
| `Escape` | Close Settings | When settings open |

---

## Provider System

### Supported Providers

| Provider | Auth | Notes |
|----------|------|-------|
| **OpenRouter** | API Key | Default; access to 100+ models |
| **Google Gemini** | API Key | Gemini 2.0/2.5 models |
| **Groq** | API Key | Fast inference |
| **NVIDIA NIM** | API Key | Local/cloud NIM |
| **Mistral** | API Key | Mistral models |
| **Custom** | API Key + URL | OpenAI-compatible endpoint |

### Auto-Fallback

If the active provider fails, the pipeline automatically tries:
1. Same provider, different model
2. Different provider (in priority order)
3. Single-shot fallback generation

---

## Settings & Configuration

### API Keys
- Stored in browser localStorage (never sent to our servers)
- Only sent to the selected AI provider
- Can be tested via "Test Connection" button

### Design Intents
- **Auto** — AI decides the style
- **Modern** — Clean, minimal
- **Corporate** — Professional, formal
- **Creative** — Bold, artistic
- **Retro** — Vintage, nostalgic
- **Minimal** — Simple, whitespace-rich

### Aspect Ratios
| ID | Name | Dimensions | Use Case |
|----|------|------------|----------|
| 1:1 | Square | 1000×1000 | Instagram, social |
| 4:5 | Post | 1000×1250 | Instagram portrait |
| 9:16 | Story | 1000×1778 | Stories, Reels |
| 16:9 | Banner | 1000×563 | YouTube, web |
| A4-P | A4 | 1000×1414 | Documents |
| letter | Letter | 1000×1294 | US Letter |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | No | Server-side OpenRouter key (optional) |
| `GEMINI_API_KEY` | No | Server-side Gemini key (optional) |
| `GROQ_API_KEY` | No | Server-side Groq key (optional) |

> All keys can be entered in-browser via Settings — no server config needed.

---

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Run production server
npm start
```

---

## License

MIT



