export function extractJSON(text: string): any {
  if (!text || !text.trim()) throw new Error("The AI returned an empty response");
  // Reasoning models often wrap their answer in <think>…</think> blocks.
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Tolerate unclosed code fences: ```json {"a":1  (stream cutoffs)
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
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
    throw new Error(`Failed to parse JSON. Response: ${text.substring(0, 300)}...`);
  }
}

export function extractHTML(text: string): string {
  let html = text.trim();
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) html = codeBlockMatch[1].trim();
  if (!html.startsWith("<!") && !html.startsWith("<html") && !html.startsWith("<div") && !html.startsWith("<section")) {
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${html}</body></html>`;
  }
  if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<!doctype")) html = `<!DOCTYPE html>\n${html}`;
  return html;
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