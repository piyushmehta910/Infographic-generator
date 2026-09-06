export function extractJSON(text: string): any {
  if (!text || !text.trim()) throw new Error("The AI returned an empty response");
  // Reasoning models (DeepSeek R1, Qwen etc.) often wrap reasoning in <think>…</think> blocks.
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Tolerate unclosed code fences: ```json {"a":1 (stream cutoffs)
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (fenced && fenced[1].includes("{")) cleaned = fenced[1].trim();
  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error(`No JSON object found in AI response: "${cleaned.slice(0, 160)}"`);
  }
  // Balanced scan from the first brace; string-aware so braces inside
  // strings don't miscount. If the response was truncated mid-object,
  // append the missing closers instead of failing outright.
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  let end = -1;
  // Positions (within `cleaned`) of the last structural comma/colon seen
  // OUTSIDE string literals — used by the truncation repair below.
  let lastComma = -1;
  let lastColon = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") { stack.push("}"); lastColon = -1; }
    else if (ch === "[") { stack.push("]"); lastComma = -1; lastColon = -1; }
    else if (ch === ",") { lastComma = i; lastColon = -1; }
    else if (ch === ":") { lastColon = i; lastComma = -1; }
    else if (ch === "}") {
      stack.pop();
      lastComma = -1; lastColon = -1;
      if (stack.length === 0) {
        end = i;
        break;
      }
    } else if (ch === "]") {
      stack.pop();
      lastComma = -1; lastColon = -1;
      if (stack.length === 0) {
        end = i;
        break;
      }
    }
  }
  /** Repair candidates for a truncated object, tried in order. */
  const closers = stack.slice().reverse().join("");
  const base = cleaned.slice(start);
  const repairCandidates: string[] = [];
  if (inStr) {
    // Cut inside a string literal: close the quote (dropping a dangling escape).
    const quoteClosed = (esc ? base.replace(/\\$/, "") : base) + '"';
    repairCandidates.push(quoteClosed + closers); // cut inside a VALUE string
    repairCandidates.push(quoteClosed + ":null" + closers); // cut inside a KEY
  } else {
    repairCandidates.push(base + closers);
  }
  if (lastColon !== -1) {
    // Cut right after "key": — supply the missing value.
    repairCandidates.push(base.slice(0, lastColon + 1) + "null" + closers);
  }
  if (lastComma !== -1) {
    // Cut mid-way after a comma — drop the dangling fragment and close up.
    repairCandidates.push(base.slice(0, lastComma) + closers);
  }
  let jsonStr = end !== -1 ? cleaned.slice(start, end + 1) : "";
  if (end === -1) {
    const fixedClosers = repairCandidates.map(
      (s) => s.replace(/,\s*([}\]])/g, "$1").replace(/,\s*$/, ""),
    );
    for (const candidate of fixedClosers) {
      try {
        jsonStr = candidate;
        const parsed = JSON.parse(candidate);
        return parsed;
      } catch {
        /* try the next repair strategy */
      }
    }
    if (!jsonStr) jsonStr = base + closers;
  }
  // Trailing commas are the most common LLM JSON mistake.
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1").replace(/,\s*$/, "");
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Attempt fallback repair: fix unescaped control characters in strings
    try {
      const sanitizedStr = jsonStr.replace(/[\n\r\t]/g, " ");
      return JSON.parse(sanitizedStr);
    } catch {
      throw new Error(`Failed to parse JSON. Response: ${text.substring(0, 300)}...`);
    }
  }
}

export function extractHTML(text: string): string {
  if (!text || !text.trim()) return "";
  // Strip <think>...</think> blocks from reasoning models
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Extract from markdown code fences if present
  const codeBlockMatch = cleaned.match(/```(?:html|css|xml)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeBlockMatch && codeBlockMatch[1].trim().length > 0) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Reject safety responses, moderation output, and one-word answers
  if (
    /^\s*user safety:\s*safe\s*$/i.test(cleaned) ||
    /^\s*(safe|unsafe|refused|ok)\s*$/i.test(cleaned) ||
    /^\s*i cannot (fulfill|generate|assist)\b/i.test(cleaned)
  ) {
    return "";
  }

  // If it already is a complete HTML document, ensure proper DOCTYPE and return
  if (/<html[\s>]/i.test(cleaned) || /<!DOCTYPE\s+html/i.test(cleaned)) {
    let html = cleaned;
    const docStart = html.search(/<!DOCTYPE|<html/i);
    if (docStart !== -1) html = html.slice(docStart);
    if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<!doctype")) {
      html = `<!DOCTYPE html>\n${html}`;
    }
    // Auto-close missing tags if stream was truncated
    if (!/<\/body>/i.test(html)) html += "\n</body>";
    if (!/<\/html>/i.test(html)) html += "\n</html>";

    // Verify it contains actual structure (not just empty html tags)
    const hasSubstance = /<(div|section|main|article|h[1-6]|p|svg|header|card)\b/i.test(html);
    return hasSubstance ? html : "";
  }

  // If text does not contain any HTML elements or CSS rules, it is plain text, not an infographic!
  const hasHtmlTags = /<(div|section|main|article|h[1-6]|p|span|svg|style|header|ul|li)\b/i.test(cleaned);
  const hasCssRules = /(:root|\.infographic|\.card|@import|[a-zA-Z0-9_-]+\s*\{)/i.test(cleaned);
  if (!hasHtmlTags && !hasCssRules) {
    return "";
  }

  // The model returned a partial snippet or raw CSS + HTML markup.
  // Extract any <style> blocks or raw CSS rules (:root { ... }, * { ... }, etc.)
  let css = "";
  let bodyMarkup = cleaned;

  // 1. Extract explicit <style> blocks
  const styleMatch = bodyMarkup.match(/<style[\s\S]*?<\/style>/gi);
  if (styleMatch) {
    for (const s of styleMatch) {
      css += "\n" + s.replace(/<\/?style[^>]*>/gi, "");
      bodyMarkup = bodyMarkup.replace(s, "");
    }
  }

  // 2. Extract leading raw CSS rules if model output started with `:root { ... }` or `@import`
  const rawCssMatch = bodyMarkup.match(/^\s*(@import[^;]+;|:root\s*\{[\s\S]*?\}(?:\s*[a-zA-Z0-9_#.-]+\s*\{[\s\S]*?\})*)/i);
  if (rawCssMatch) {
    css += "\n" + rawCssMatch[0];
    bodyMarkup = bodyMarkup.slice(rawCssMatch[0].length);
  }

  // 3. Extract any external <link rel="stylesheet"> fonts
  let links = "";
  const linkMatches = bodyMarkup.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi);
  if (linkMatches) {
    for (const l of linkMatches) {
      links += "\n" + l;
      bodyMarkup = bodyMarkup.replace(l, "");
    }
  }

  // Clean remaining body markup
  bodyMarkup = bodyMarkup.trim();
  if (!bodyMarkup || !/<[a-z][\s\S]*>/i.test(bodyMarkup)) {
    return "";
  }

  // Default baseline CSS if model omitted baseline resets
  const baselineCss = `* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Plus Jakarta Sans', Inter, -apple-system, sans-serif; overflow: hidden; width: 100%; height: 100%; }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${links}
  <style>
    ${baselineCss}
    ${css}
  </style>
</head>
<body>
  ${bodyMarkup}
</body>
</html>`;
}

// Strip ```html ... ``` or ``` ... ``` wrappers (client-side cleanup).
export function stripMarkdown(html: string): string {
  return html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// Dependency-free sanitizer: remove scripts, event handlers, and javascript: URLs.
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s*javascript\s*:\s*/gi, "");
}

// ---- Deterministic canvas & visibility enforcement ----
// Models frequently ignore the exact canvas size (viewport units, missing
// overflow lock, tiny fonts, low-contrast palettes). These are enforceable
// without a browser, so they are corrected here — server-side, every time.

function normalizeHex(color: string): string | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return hex.toLowerCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = normalizeHex(fgHex);
  const bg = normalizeHex(bgHex);
  if (!fg || !bg) return 21; // non-hex colors: assume fine, don't touch
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Forces the generated HTML onto the exact canvas and improves visibility:
 * 1. Converts viewport units (vw/vh/vmin/vmax) to exact px for this canvas.
 * 2. Bumps sub-11px font sizes to an 11px readability floor.
 * 3. Fixes the base text/background pairing when contrast fails WCAG AA.
 * 4. Hard-locks html/body to the canvas with overflow hidden.
 */
export function enforceCanvas(
  html: string,
  width: number,
  height: number,
  palette?: { background?: string; text?: string } | null,
): string {
  if (!html || !html.trim()) return html;
  let out = html;

  // 1. Viewport units → px (the render frame is a fixed W×H box).
  out = out.replace(/(-?\d+(?:\.\d+)?)vmin\b/gi, (_, n: string) => `${((Number(n) / 100) * Math.min(width, height)).toFixed(1)}px`);
  out = out.replace(/(-?\d+(?:\.\d+)?)vmax\b/gi, (_, n: string) => `${((Number(n) / 100) * Math.max(width, height)).toFixed(1)}px`);
  out = out.replace(/(-?\d+(?:\.\d+)?)vh\b/gi, (_, n: string) => `${((Number(n) / 100) * height).toFixed(1)}px`);
  out = out.replace(/(-?\d+(?:\.\d+)?)vw\b/gi, (_, n: string) => `${((Number(n) / 100) * width).toFixed(1)}px`);

  // 2. Readability floor for px font sizes.
  out = out.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi, (m, n: string) =>
    Number(n) >= 11 ? m : "font-size: 11px",
  );

  // 3. Contrast guard on the design system's base pairing.
  let contrastFix = "";
  if (palette?.background && palette?.text) {
    const rawBg = palette.background.trim();
    const bg = normalizeHex(rawBg);
    // NOTE: contrastRatio() itself re-normalizes (it expects '#'-prefixed
    // colors), so pass the RAW palette values here — not the stripped hex.
    if (bg && contrastRatio(palette.text, rawBg) < 4.5) {
      // Pick whichever of the two extreme anchors reads best on the background.
      const fixed = contrastRatio("#111111", rawBg) >= contrastRatio("#f8fafc", rawBg) ? "#111111" : "#f8fafc";
      contrastFix = `\n  html { background: #${bg}; }\n  body { color: ${fixed} !important; }`;
    }
  }

  // 4. Hard canvas lock — wins over whatever the model wrote.
  const lock = `<style data-canvas-lock>
  html, body { width: ${width}px !important; height: ${height}px !important; max-width: ${width}px !important; max-height: ${height}px !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; box-sizing: border-box !important; }
  img, svg, video, canvas { max-width: 100% !important; }${contrastFix}
</style>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${lock}\n</head>`);
  } else if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body[^>]*>/i, (m) => `${m}\n${lock}`);
  } else {
    out = `${lock}\n${out}`;
  }
  return out;
}