import { AIGenerationRequest } from "@/lib/types";

/**
 * STEP 1: INPUT
 * STEP 2: ANALYZE the content through AI
 * STEP 3: IMPROVE the content through AI
 */
export function buildContentAnalysisPrompt(
  request: AIGenerationRequest,
): string {
  const { input, inputType, aspectRatio, theme, font, language, audience, aspectRatioWidth, aspectRatioHeight, purpose } = request;
  const aspectRatioStr = aspectRatio || "1:1";
  const themeStr = theme || "modern";
  const fontStr = font || "Inter";
  const languageStr = language || "English";
  const audienceStr = audience || "General";
  const purposeStr = purpose || "Not specified";

  // Derive exact canvas dimensions
  const dimensionsStr =
    aspectRatioWidth && aspectRatioHeight
      ? `${aspectRatioWidth}×${aspectRatioHeight}px`
      : aspectRatioStr === "9:16" ? "1080×1920px"
      : aspectRatioStr === "16:9" ? "1920×1080px"
      : aspectRatioStr === "4:5" ? "1080×1350px"
      : aspectRatioStr === "A4-P" ? "794×1123px"
      : aspectRatioStr === "A4-L" ? "1123×794px"
      : aspectRatioStr === "letter" ? "816×1056px"
      : "1080×1080px";

  const metadata = `\n[Config: Aspect Ratio: ${aspectRatioStr} | Canvas: ${dimensionsStr} | Theme: ${themeStr} | Font: ${fontStr} | Language: ${languageStr} | Audience: ${audienceStr} | Purpose: ${purposeStr}]`;

  let contentText = "";
  switch (inputType) {
    case "text":
      contentText = `Raw text input:\n${input}`;
      break;
    case "idea":
      contentText = `Idea/topic:\n${input}`;
      break;
    case "image":
      contentText = `Image uploaded - analyze and extract all relevant information`;
      break;
    case "image-url":
      contentText = `Image URL: ${input} - analyze and extract all relevant information`;
      break;
    default:
      contentText = `Input:\n${input}`;
  }

  return `You are an expert content analyst and editor creating content for a PROFESSIONAL INFOGRAPHIC. Your output will be used to design a visual infographic layout.

## CRITICAL: This content is for an INFOGRAPHIC — NOT a blog post, article, or document.
- Content must be VISUALLY STRUCTURED for an infographic layout
- Use short, scannable text blocks
- Prioritize key statistics and data points
- Create clear visual hierarchy in the content structure
- Every section should work as a standalone visual card

## CANVAS SPECIFICATIONS
- Canvas dimensions: ${dimensionsStr}
- Aspect ratio: ${aspectRatioStr}
- Purpose: ${purposeStr}
- Design every element to fit perfectly within these exact pixel dimensions

## STEP 1: INPUT — Receive the user's content
## STEP 2: ANALYZE — Analyze the content through AI — extract every key detail, fact, statistic, date, and theme
## STEP 3: IMPROVE — Improve the content through AI — fix grammar, polish wording, remove repetition, make it professional and impactful

## INPUT CONTENT
${contentText}${metadata}

## YOUR TASK — Complete ALL of the following:
1. **Fix grammar & spelling** — correct every error
2. **Improve wording** — rewrite professionally, make it impactful and clear
3. **Remove repetition** — delete duplicate information
4. **Summarize** — condense while preserving key meaning
5. **Detect the language** of the input
6. **Identify the PRIMARY audience** — who is this infographic for? (e.g., executives, students, general public, professionals). Be specific about demographics, knowledge level, and what they care about.
7. **Identify the ONE key message** — what is the single most important thing the viewer should understand or feel instantly? This is the "billboard test" — if someone glances for 2 seconds, what should they grasp?
8. **Determine data density** — should this be info-rich (data-dense, many statistics) or minimal (clean, spacious, few data points)? Justify your choice based on the audience and content type.
9. **Create a visual priority order** — rank every piece of information from most visually prominent (1st) to least prominent (last). Specify exactly which elements draw the eye first, second, third, etc.
10. **Fix grammar & spelling** — correct every error
11. **Improve wording** — rewrite professionally, make it impactful and clear
12. **Remove repetition** — delete duplicate information
13. **Summarize** — condense while preserving key meaning
14. **Generate a POWERFUL title** — max 10 words, engaging, attention-grabbing
15. **Generate a subtitle** — max 15 words, adds context
16. **Create 3-6 key sections** — each with title, content paragraph, and 2-3 bullet points
17. **Extract ALL statistics** — any numbers, percentages, figures as standalone stat cards
18. **Create timeline** — if any dates or chronological information exists
19. **Create process steps** — if step-by-step information exists
20. **Generate call-to-action** — ONLY if the user explicitly asks for a CTA in their input. Otherwise, leave "callToAction" as an empty string. Do NOT generate CTAs by default.
21. **Recommend 4-5 emoji icons** — that match the content's theme and tone
22. **Recommend a coordinated color palette** — 5 colors (primary, secondary, accent, background, text) that work together harmoniously. Colors MUST be coordinated — use color theory principles (complementary, analogous, or triadic schemes). Do NOT pick random colors. Ensure the palette is cohesive and purposeful.
23. **Verify WCAG AA contrast compliance** — ensure all text-to-background color combinations meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text). Specify the contrast ratio for each color pair used.

## UNIQUE CONTENT REQUIREMENTS
- Each analysis must be UNIQUE — different title, different section structure, different organization
- Be creative in how you organize the information
- Choose colors that match the theme of the content (not generic blue)
- Select icons that are specific to the content topic
- The color palette MUST be coordinated — all 5 colors should work together as a unified system, not as independent choices
- Every text color MUST have verified WCAG AA contrast against its intended background

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "inputType": "${inputType}",
  "isComplete": true,
  "missingInfo": [],
  "primaryAudience": "Specific audience description",
  "keyMessage": "One sentence — the single most important message",
  "dataDensity": "info-rich|minimal|balanced",
  "visualPriorityOrder": [
    "1st: most prominent element and why",
    "2nd: second most prominent and why",
    "3rd: third most prominent and why"
  ],
  "correctedContent": {
    "title": "UNIQUE, ENGAGING TITLE SPECIFIC TO THIS CONTENT",
    "subtitle": "Supporting subtitle unique to this content",
    "sections": [
      {
        "id": "section-1",
        "title": "Section Title Related to Content",
        "content": "Well-written paragraph about this specific content",
        "bullets": ["Key point 1", "Key point 2", "Key point 3"],
        "icon": "📊",
        "type": "mixed"
      }
    ],
    "statistics": [
      {
        "id": "stat-1",
        "value": "95%",
        "label": "Extracted Label",
        "prefix": "",
        "suffix": "%",
        "icon": "📈"
      }
    ],
    "timeline": [
      {
        "id": "t-1",
        "date": "2024",
        "title": "Milestone",
        "description": "Description",
        "icon": "📍"
      }
    ],
    "suggestedIcons": ["📊", "📈", "💡", "🎯"],
    "suggestedColors": {
      "primary": "#unique-hex",
      "secondary": "#unique-hex",
      "accent": "#unique-hex",
      "background": "#unique-hex",
      "text": "#unique-hex"
    },
    "wcagCompliance": {
      "contrastRatios": {
        "primaryOnBackground": "4.5:1",
        "textOnBackground": "7:1",
        "accentOnBackground": "4.5:1"
      },
      "aaCompliant": true
    },
    "callToAction": "Unique CTA for this content →",
    "language": "detected-language",
    "wordCount": 0,
    "summary": "One sentence summary"
  }
}`;
}

/**
 * STEP 4: DESIGN — Ask AI how to design this in HTML and CSS in the best possible way
 * Each call must produce a UNIQUE design approach
 */
export function buildDesignBlueprintPrompt(
  content: unknown,
  request: AIGenerationRequest,
): string {
  const { aspectRatio, font, language, audience } = request;

  const dimensions =
    aspectRatio === "9:16"
      ? "1080×1920 (Story/Portrait)"
      : aspectRatio === "16:9"
        ? "1920×1080 (Landscape)"
        : aspectRatio === "4:5"
          ? "1080×1350 (Portrait)"
          : aspectRatio === "A4-P"
            ? "794×1123 (A4 Portrait)"
            : aspectRatio === "A4-L"
              ? "1123×794 (A4 Landscape)"
              : aspectRatio === "letter"
                ? "816×1056 (Letter)"
                : "1080×1080 (Square)";

  // Generate a random design seed to ensure variety
  const seed = Math.floor(Math.random() * 10000);
  const layouts = [
    "hero-card",
    "split-layout",
    "magazine-grid",
    "card-based",
    "asymmetric",
    "Z-pattern",
    "F-pattern",
    "full-bleed",
    "stacked-sections",
    "dashboard-style",
    "circular-flow",
    "modular-grid",
    "sidebar-layout",
    "timeline-flow",
  ];
  const selectedLayout = layouts[seed % layouts.length];

  return `You are an EXPERT infographic designer and frontend developer.

## STEP 4: DESIGN — Ask AI how to design this in HTML and CSS in the best possible way

🎲 DESIGN SEED: ${seed} (use this to generate a unique design)
🎯 SUGGESTED LAYOUT: ${selectedLayout}

You must create a COMPLETELY UNIQUE design blueprint. Do NOT repeat any design pattern you've used before. Every response must have a different:
- Layout structure
- Color combination
- Visual style
- Decorative approach
- Section arrangement

## CONTENT TO VISUALIZE
${JSON.stringify(content, null, 2)}

## CANVAS SPECS
- Exact dimensions: ${dimensions}
- Target audience: ${audience || "General"}
- Language: ${language || "English"}
- Base font: ${font || "Inter"}

## VISUAL HIERARCHY (MANDATORY — specify EXACTLY)
You MUST define the exact visual hierarchy — which element draws the eye first, second, third, and so on. For each level, specify the CSS techniques used:

1. **First draw (Hero element)**: What is the VERY FIRST thing the viewer sees? Use specific CSS: e.g., "large heading with font-size: clamp(32px, 8vw, 72px), font-weight: 800, color: var(--primary), text-shadow for depth"
2. **Second draw (Supporting element)**: What catches the eye next? Specify CSS: e.g., "stat number with font-size: clamp(24px, 5vw, 48px), font-weight: 700, color: var(--accent), positioned above the fold"
3. **Third draw (Context element)**: What provides context next? Specify CSS: e.g., "section title with font-size: clamp(18px, 3vw, 28px), font-weight: 600, colored accent bar on the left"
4. **Fourth draw (Detail elements)**: Body text, icons, secondary stats
5. **Fifth draw (CTA and footer)**: Call-to-action and closing elements

## SPACING SYSTEM (8px grid — MANDATORY)
ALL spacing MUST follow an 8px grid system. Every padding, margin, gap, and size value must be a multiple of 8 (8px, 16px, 24px, 32px, 40px, 48px, 64px, etc.). Do NOT use arbitrary pixel values. This ensures consistent rhythm and visual harmony throughout the design.

## TYPOGRAPHY & TEXT STYLING (EXACT 3 FONT WEIGHTS)
Use exactly 3 font weights — no more, no less:
- **400 (Regular)**: Body text, descriptions, captions
- **600 (Semi-Bold)**: Subheadings, section titles, stat labels
- **800 (Extra-Bold)**: Main headings, hero numbers, key highlights

## HERO MOMENT (MANDATORY)
The first element the viewer sees must be a bold "hero moment" — a single striking visual or typographic element that immediately communicates the infographic's purpose. This could be a massive statistic number, a dramatic heading, or an iconic visual element. It must be impossible to miss.

## DESIGN INSTRUCTIONS
Create a detailed design plan covering ALL these aspects. Make it DIFFERENT every time:

### 1. LAYOUT STYLE (pick ONE that you haven't used recently)
Options: hero-card | split-layout | magazine-grid | card-based | timeline-flow | dashboard-style | asymmetric | circular-flow | stacked-sections | Z-pattern | F-pattern | full-bleed | sidebar-layout | modular-grid

### 2. COLOR PALETTE (5 unique hex colors)
Choose colors based on the content theme:
- Technology: blues, cyans, dark backgrounds
- Healthcare: greens, teals, whites
- Education: warm oranges, yellows, cream
- Business: navy, gold, white
- Creative: bold purples, pinks, gradients
- Nature: earthy greens, browns, sage
- NEVER use the same color combination twice
- Colors MUST be coordinated — use color theory (complementary, analogous, triadic) to ensure harmony
- ALL colors must pass WCAG AA contrast requirements when paired with each other

### 3. TYPOGRAPHY & TEXT STYLING
- Heading: bold, impactful sizing using font-weight: 800
- Body: clean, readable using font-weight: 400
- Subheadings: font-weight: 600
- Different text treatments (uppercase, colored spans, gradient text via background-clip: text, drop caps)

### 4. VISUAL ELEMENTS & DECORATIONS
- Background: solid | gradient | mesh | geometric pattern | abstract shapes | dotted pattern | wave | curves
- Card style: rounded-xl | sharp | glass-effect | neubrutalism | minimal-border | elevated | gradient-border | outlined
- Icons: emoji in colored circles | emoji in gradient squares | emoji with background blur | emoji alone
- Dividers: gradient lines | dashed lines | decorative dots | wave separators | arrow dividers

### 5. STATISTICS DISPLAY (different style each time)
Options: big-number cards | progress bars | circular rings | icon-badges | horizontal bars | grid of numbers | stats with icons | metric tiles

### 6. SPECIAL EFFECTS (with specific CSS techniques)
- Gradient text for titles: use background-clip: text with -webkit-background-clip: text and transparent color
- Layered shadows: use box-shadow with multiple values for depth
- Glassmorphism: use backdrop-filter: blur() with semi-transparent backgrounds
- Subtle animations: use CSS transitions on hover (transform, opacity) — even for static HTML, include :hover states
- Overlapping elements: use negative margins or z-index layering
- Border gradients: use border-image or background gradients on borders
- Glow effects: use box-shadow with spread radius and colored shadows

### 7. SECTION HEADERS
- Accent bars | colored backgrounds | icon headers | underline styles | ribbon style | pill badges

### 8. ICON STYLE CONSISTENCY (MANDATORY)
All icons throughout the infographic MUST use the SAME style consistently. Pick ONE icon style (emoji-in-circle, emoji-in-square, emoji-alone, emoji-with-bg) and use it for every single icon. Do NOT mix styles.

### 9. ANIMATION & INTERACTION HINTS (even for static HTML)
Include CSS hover states, transitions, and subtle animation hints even though this is static HTML:
- Cards should have :hover states with transform: translateY(-2px) and box-shadow elevation
- Buttons should have :hover and :active states
- Use transition: all 0.2s ease for smooth interactions
- Include @keyframes for any subtle entrance animations (fade-in, slide-up)

### 10. ANTI-PATTERNS — DO NOT:
- Do NOT use generic blue gradient backgrounds
- Do NOT use stock photo-style layouts
- Do NOT use default Tailwind gray-100 or gray-50 backgrounds
- Do NOT use flat, lifeless designs with no depth
- Do NOT use more than 3 font weights
- Do NOT use inconsistent icon styles across sections
- Do NOT use arbitrary spacing values — everything must be on the 8px grid
- Do NOT use generic placeholder content — every element must serve a purpose

## OUTPUT FORMAT — Return ONLY valid JSON (DON'T repeat the same structure):
{
  "designConcept": "UNIQUE design concept description",
  "layoutStyle": "one of the layout options above",
  "heroMoment": "description of the first thing the viewer sees with specific CSS",
  "visualHierarchy": {
    "1st": "element + CSS technique that draws the eye first",
    "2nd": "element + CSS technique for second emphasis",
    "3rd": "element + CSS technique for third emphasis",
    "4th": "element + CSS technique for fourth emphasis",
    "5th": "element + CSS technique for fifth emphasis"
  },
  "sectionCount": 4,
  "readingFlow": "how the eye moves through this specific layout",
  "spacingSystem": "8px grid — all values are multiples of 8",
  "colorPalette": {
    "primary": "#unique",
    "secondary": "#unique",
    "accent": "#unique",
    "background": "#unique",
    "text": "#unique"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "headingSize": "32-48px",
    "bodySize": "13-16px",
    "headingWeight": "800",
    "subheadingWeight": "600",
    "bodyWeight": "400",
    "style": "modern|corporate|playful|elegant|bold|minimal|tech|creative",
    "fontWeightsUsed": "Exactly 3: 400 (body), 600 (subheadings), 800 (headings)"
  },
  "icons": {
    "style": "emoji-in-circle|emoji-in-square|emoji-alone|emoji-with-bg",
    "consistency": "ALL icons use the same style — no mixing",
    "perSection": ["icon1", "icon2", "icon3", "icon4"]
  },
  "cardStyle": "unique card treatment different from last time",
  "spacing": "8px-grid-based",
  "alignment": "left|center|right",
  "statsStyle": "big-numbers|progress-bars|circular-rings|metric-tiles|icon-badges",
  "decorations": ["2-3 decorative elements unique to this design"],
  "background": "unique background treatment",
  "header": "unique header styling",
  "cta": "unique CTA treatment",
  "specialFeatures": "what makes this design unique and different",
  "animationHints": ["hover states", "transitions", "entrance animations"]
}`;
}

/**
 * STEP 5: GENERATE — Tell AI to generate HTML and CSS code
 * Renders a unique, production-quality infographic every time
 * STEP 6: RENDER IT AS IMAGE
 */
export function buildHTMLGenerationPrompt(
  content: any,
  blueprint: any,
  request: AIGenerationRequest,
): string {
  const { aspectRatio } = request;

  let width = 1080,
    height = 1080;
  switch (aspectRatio) {
    case "9:16":
      width = 1080;
      height = 1920;
      break;
    case "16:9":
      width = 1920;
      height = 1080;
      break;
    case "4:5":
      width = 1080;
      height = 1350;
      break;
    case "A4-P":
      width = 794;
      height = 1123;
      break;
    case "A4-L":
      width = 1123;
      height = 794;
      break;
    case "letter":
      width = 816;
      height = 1056;
      break;
    default:
      width = 1080;
      height = 1080;
  }

  return `You are an EXPERT frontend developer creating a unique, production-quality HTML/CSS infographic.

## STEP 5: GENERATE — Tell AI to generate HTML and CSS code
## STEP 6: RENDER IT AS IMAGE — Must render perfectly in ${width}x${height}px

## CONTENT (Use ALL of this data EXACTLY)
${JSON.stringify(content, null, 2)}

## CRITICAL: ASPECT RATIO REQUIREMENTS - MUST BE FOLLOWED EXACTLY
- The infographic canvas is EXACTLY ${width}x${height}px - this is NON-NEGOTIABLE
- The HTML body must have: width: ${width}px; height: ${height}px; overflow: hidden;
- ALL content must fit within these EXACT dimensions - NO EXCEPTIONS
- If content doesn't fit, reduce font sizes, spacing, or remove elements - DO NOT let it overflow
- For portrait ratios (9:16, 4:5, A4-P): Use vertical flow with compact spacing
- For landscape ratios (16:9, A4-L, letter): Use horizontal flow with side-by-side layouts
- For square ratios (1:1): Use balanced grid layout

## DESIGN BLUEPRINT (Follow this design)
${JSON.stringify(blueprint, null, 2)}

## CANVAS REQUIREMENTS
- EXACT pixel dimensions: ${width}px WIDTH × ${height}px HEIGHT
- MUST fill entire canvas perfectly — NO SCROLLING, NO OVERFLOW
- Content must fit within these exact dimensions

## THIS DESIGN MUST BE UNIQUE
Do NOT create the same layout as any typical infographic. Use the specific design elements from the blueprint:
- Use the EXACT color palette specified
- Use the layout style specified
- Implement the decorative elements specified
- Use the card style specified
- Different section arrangement than generic designs

## MOBILE-RESPONSIVE INTERNAL CSS (MANDATORY)
The generated HTML MUST include ALL of the following responsive CSS:

1. **Viewport meta tag** in the HTML head: <meta name="viewport" content="width=device-width, initial-scale=1.0">

2. **CSS custom properties (variables)** for the entire color palette — define them in :root:
   :root {
     --color-primary: #...;
     --color-secondary: #...;
     --color-accent: #...;
     --color-background: #...;
     --color-text: #...;
   }
   Use these variables throughout the CSS instead of hardcoded hex values.

3. **max-width: 100%** on ALL containers and images to prevent overflow

4. **Media query for tablets**: @media (max-width: 768px) { ... } that adjusts:
   - Font sizes using clamp() for responsive scaling
   - Grid layouts to single column
   - Padding and spacing reduced proportionally
   - Any side-by-side layouts to stacked vertically

5. **Media query for small mobile**: @media (max-width: 320px) { ... } that ensures the infographic is usable and readable at the smallest screen size

6. **CSS Grid and Flexbox** for all layout — use display: grid with responsive grid-template-columns and display: flex with flex-wrap for component-level layouts

7. **clamp() for ALL font sizes** — e.g., font-size: clamp(14px, 2vw, 24px) — never use fixed pixel values for font sizes in the responsive CSS

8. **Touch-friendly tap targets** — any clickable or interactive element must have min-width: 44px and min-height: 44px

9. **max-height: 100vh and overflow: hidden** on the body/html to ensure content fits the viewport without scrolling, but use overflow-y: auto on inner containers if content exceeds the viewport

10. **Gradient text for the title** — use background-clip: text with -webkit-background-clip: text and color: transparent on the main title element

11. **Specific shadow/elevation** — use box-shadow with explicit values: e.g., box-shadow: 0 4px 6px rgba(0,0,0,0.1) for cards, box-shadow: 0 10px 25px rgba(0,0,0,0.15) for hero elements

12. **Self-contained** — the HTML must work standalone with NO external dependencies except Google Fonts import. No external CSS frameworks, no CDN scripts, no external images. Everything must be inline or in a <style> tag.

13. **Wow factor** — include ONE unique visual element that makes this infographic stand out. This could be: an animated gradient border, a parallax-like overlapping effect, a creative clip-path shape, a distinctive pattern background, or an unexpected layout twist. This element must be intentional and purposeful, not decorative fluff.

## DESIGN QUALITY CHECKLIST
✅ Looks like it was designed by a professional designer — NOT like AI-generated boilerplate
✅ Modern, polished, premium appearance — comparable to a Canva Pro or Figma design
✅ Perfect spacing — all values on the 8px grid, padding/margins/gaps all balanced
✅ Strong visual hierarchy — title biggest, stats prominent, sections clear, CTA visible
✅ High color contrast — text readable against backgrounds (WCAG AA minimum)
✅ Gradient accents used tastefully with background-clip: text for headings
✅ Subtle shadows and elevation for depth using explicit box-shadow values
✅ Clean, consistent rounded corners
✅ Icons displayed prominently with consistent style throughout
✅ Statistics as large, bold numbers that pop using font-weight: 800
✅ Each section visually separated with cards, borders, or spacing
✅ Call-to-action as a gradient button that draws attention
✅ No awkward whitespace — every pixel serves a purpose
✅ Google Fonts imported correctly
✅ CSS Grid / Flexbox for all layouts
✅ Responsive: looks great at 320px, 768px, and desktop widths
✅ Uses CSS custom properties for the entire color system
✅ Gradient text on the main title using background-clip: text
✅ Touch-friendly: all interactive elements have min 44px tap targets
✅ Uses clamp() for responsive font sizing
✅ Self-contained — no external dependencies beyond fonts
✅ Has a "wow factor" — one unique visual element that makes it memorable

## HTML STRUCTURE
1. HEADER: Title + subtitle (prominent, eye-catching, gradient text on title)
2. STATISTICS: Visual stat cards with big numbers
3. SECTIONS: 2-3 column grid of content cards with icons
4. TIMELINE (if content has timeline data): Visual timeline
5. CTA: ONLY include if content.callToAction is not empty. Otherwise, skip the CTA section entirely.

## OUTPUT FORMAT
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    :root {
      --color-primary: #...;
      --color-secondary: #...;
      --color-accent: #...;
      --color-background: #...;
      --color-text: #...;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      max-width: 100%;
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    .container {
      max-width: 100%;
      max-height: 100vh;
      overflow: hidden;
    }
    /* COMPLETE RESPONSIVE CSS */
    @media (max-width: 768px) {
      /* Adjust layout for tablets */
    }
    @media (max-width: 320px) {
      /* Adjust layout for small mobile */
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- COMPLETE HTML - all content, all sections, all styling -->
  </div>
</body>
</html>
\`\`\`

OUTPUT ONLY THE HTML. No explanations. Start with <!DOCTYPE html>. End with </html>. Make EVERY design UNIQUE and BEAUTIFUL. It should look like it was designed by a professional, not generated by AI.`;
}

/**
 * STEP 7: EXPORT — Revise design based on user feedback
 */
export function buildDesignRevisionPrompt(
  currentBlueprint: any,
  userFeedback: string,
  content: any,
): string {
  return `You are an expert designer revising an infographic design based on feedback.

## STEP 7: EXPORT — Apply feedback and generate revised design

## CURRENT BLUEPRINT
${JSON.stringify(currentBlueprint, null, 2)}

## CONTENT (unchanged)
${JSON.stringify(content, null, 2)}

## USER FEEDBACK
"${userFeedback}"

## YOUR TASK
Revise the design based on this feedback. Change colors, layout, styling as requested. Return the COMPLETE revised blueprint in the same JSON format.

Return ONLY the revised blueprint JSON.`;
}

/**
 * Image analysis prompt
 */
export function buildImageAnalysisPrompt(imageData: string): string {
  return `Analyze this image and extract detailed information in JSON format. Be thorough and specific about every visual element.

## EXTRACT THE FOLLOWING:

### Colors
- Extract the dominant color palette (5-8 hex colors)
- Identify the background color, primary color, accent color, text color
- Note the color mood (warm, cool, muted, vibrant, pastel, dark, light)

### Text
- Extract any visible text via OCR
- Note the font style (serif, sans-serif, handwritten, decorative)
- Identify the hierarchy of text (headings vs body vs captions)

### Layout
- Describe the overall layout structure (grid, centered, asymmetric, full-bleed)
- Identify the visual hierarchy — what draws the eye first, second, third
- Note the spacing and alignment patterns

### Visual Theme & Mood
- Describe the overall visual theme (minimalist, corporate, playful, elegant, technical, organic)
- Identify the mood/tone (professional, playful, serious, futuristic, warm, cool)
- Note the overall aesthetic style

### Content & Structure
- Identify the subject matter and topic
- Suggest infographic sections based on the image content — what sections would this image translate into?
- Extract any data, charts, or statistics visible
- Identify icons, illustrations, or decorative elements

## OUTPUT FORMAT
{
  "colors": {
    "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "background": "#hex",
    "primary": "#hex",
    "accent": "#hex",
    "text": "#hex",
    "mood": "warm|cool|muted|vibrant|pastel|dark|light"
  },
  "text": {
    "ocrText": "extracted text",
    "fontStyle": "serif|sans-serif|handwritten|decorative",
    "hierarchy": ["heading", "subheading", "body", "caption"]
  },
  "layout": {
    "structure": "grid|centered|asymmetric|full-bleed|split",
    "visualHierarchy": ["1st element", "2nd element", "3rd element"],
    "spacing": "tight|normal|loose",
    "alignment": "left|center|right|mixed"
  },
  "visualTheme": {
    "theme": "minimalist|corporate|playful|elegant|technical|organic|creative",
    "mood": "professional|playful|serious|futuristic|warm|cool",
    "style": "description of the overall aesthetic"
  },
  "suggestedSections": [
    {
      "title": "Section title based on image content",
      "type": "stat|text|timeline|process|comparison",
      "content": "Suggested content for this section"
    }
  ],
  "subject": "string",
  "objects": ["string"],
  "charts": ["string"],
  "icons": ["string"]
}

Image data: ${imageData.substring(0, 100)}...`;
}

export function buildPrompt(request: AIGenerationRequest): string {
  return buildContentAnalysisPrompt(request);
}
