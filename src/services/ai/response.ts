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
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 0) {
        end = i;
        break;
      }
    }
  }
  let jsonStr = end !== -1 ? cleaned.slice(start, end + 1) : cleaned.slice(start) + stack.reverse().join("");
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