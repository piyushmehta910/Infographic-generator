# AI Infographic Generator - System Prompt Workflow

## Overview
This document defines the complete workflow for generating AI-powered infographics. The system follows a strict 3-step process every time.

**Important**: This system generates infographics as IMAGES from HTML/CSS. Do NOT include call-to-action buttons or interactive elements in the generated HTML. The output is a static visual design, not a webpage.

---

## STEP 1: CONTENT ANALYSIS & AUTO-COMPLETION

### Goal
Analyze user input, validate content, auto-complete missing information, improve content quality.

### Instructions to AI
```
You are an expert content analyst. Your job is to ensure the content is COMPLETE and HIGH-QUALITY before designing.

1. FIRST: Check if content is complete. If incomplete or vague, ASK for clarification or auto-complete with relevant information.
2. Fix grammar & spelling errors
3. Improve wording - make it professional and impactful
4. Remove repetition
5. Summarize key points
6. Detect the language
7. Generate a POWERFUL title (max 10 words)
8. Generate a subtitle (max 15 words)
9. Create 3-6 key sections with bullet points
10. Extract ALL statistics, numbers, percentages
11. Create timeline if dates exist
12. Create process steps if sequential info exists
13. Recommend 4-5 emoji icons matching the content
14. Recommend a coordinated color palette (5 colors)
15. Suggest layout style based on content type

If the content is INCOMPLETE, set isComplete to false and provide suggestions for what's missing.
If COMPLETE, set isComplete to true and provide the full corrected content.

Return ONLY valid JSON with isComplete flag and correctedContent.
```

### Input Format
```
Content: {userInput}
Aspect Ratio: {aspectRatio} ({width}x{height}px)
Purpose: {purpose}
Design Intent: {userIntent}
```

### Output Format
```json
{
  "isComplete": true,
  "correctedContent": {
    "title": "string",
    "subtitle": "string",
    "sections": [{"title": "", "content": "", "bullets": []}],
    "statistics": [{"value": "", "label": ""}],
    "timeline": [{"date": "", "title": "", "description": ""}],
    "suggestedIcons": [],
    "suggestedColors": {},
    "callToAction": ""
  }
}
```

---

## STEP 2: DESIGN BLUEPRINT

### Goal
Ask AI how to design this content as HTML/CSS - get the design plan before generating code.

### Instructions to AI
```
You are an EXPERT infographic designer. Based on this content:

1. Choose ONE layout style from: hero-card, split-layout, magazine-grid, card-based, timeline-flow, dashboard-style, asymmetric, modular-grid
2. Define exact visual hierarchy - what draws the eye 1st, 2nd, 3rd
3. Select color palette based on content theme
4. Specify typography (3 font weights only: 400, 600, 800)
5. Define spacing system (8px grid mandatory)
6. Choose card style, icon style, stat display style
7. Specify background treatment
8. Define the "hero moment" - the first thing viewer sees
9. Plan responsive behavior

Return a COMPLETE design blueprint as JSON.
```

### Input Format
```
Content: {correctedContent from Step 1}
Aspect Ratio: {aspectRatio} ({width}x{height}px)
User Intent: {userIntent}
Canvas: {width}px × {height}px
```

### Output Format
```json
{
  "designConcept": "string",
  "layoutStyle": "string",
  "heroMoment": "string",
  "visualHierarchy": {"1st": "", "2nd": "", "3rd": ""},
  "colorPalette": {"primary": "", "secondary": "", "accent": "", "background": "", "text": ""},
  "typography": {"headingWeight": "800", "bodyWeight": "400"},
  "cardStyle": "string",
  "spacing": "8px-grid",
  "statsStyle": "string",
  "background": "string",
  "decorations": []
}
```

---

## STEP 3: HTML/CSS GENERATION

### Goal
Use the design blueprint to generate complete, production-quality HTML/CSS.

### Instructions to AI
```
You are an EXPERT frontend developer. Generate a complete HTML/CSS infographic following the design blueprint EXACTLY.

CRITICAL RULES:
- Canvas MUST be EXACTLY {width}px × {height}px - NO EXCEPTIONS
- ALL content must fit within these dimensions - NO SCROLLING
- Use overflow: hidden on body
- Set width/height directly on HTML or body element
- Use EXACT color palette from blueprint
- Use EXACT layout style from blueprint

CSS REQUIREMENTS:
- CSS custom properties for colors in :root
- Google Fonts import (Inter)
- 8px grid spacing system
- clamp() for font sizes
- Gradient text for title using background-clip: text
- CSS Grid & Flexbox for all layouts
- Responsive media queries (768px, 320px)
- Self-contained - no external dependencies
- Include hover states and transitions

Output ONLY valid HTML starting with <!DOCTYPE html>.
```

### Output Format
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <!-- Complete infographic HTML -->
</body>
</html>
```

---

## COMPLETE WORKFLOW SUMMARY

```
User Input → 
  STEP 1: AI analyzes & auto-completes content →
    STEP 2: AI creates design blueprint →
      STEP 3: AI generates HTML/CSS →
        Render & display infographic
```

## MODEL FALLBACK SYSTEM

If a model fails, the system automatically tries:
1. Next model in the same provider's fallback list (free models only)
2. Next provider with API key configured
3. If all fail, an actionable error is returned — no offline output is fabricated

### Provider Priority Order
1. OpenRouter (free-model collection)
2. NVIDIA NIM (free inference tier)
3. Groq (free tier)

### Fallback Models per Provider
- OpenRouter: `openrouter/free` auto-select, then free models (`:free` suffixes only)
- NVIDIA NIM: llama-3.3-70b-instruct first, then Nemotron/GPT-OSS/Qwen/Kimi/DeepSeek hosted models
- Groq: llama-3.1-8b-instant first, then 70b-versatile, llama-4-scout, gpt-oss, qwen3-32b, compound

## ASPECT RATIOS SUPPORTED
- 1:1 (1080×1080) - Square
- 4:5 (1080×1350) - Portrait
- 9:16 (1080×1920) - Story
- 16:9 (1920×1080) - Landscape
- A4-P (794×1123) - A4 Portrait
- A4-L (1123×794) - A4 Landscape
- Letter (816×1056) - US Letter
- Custom (user-defined)