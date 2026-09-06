/**
 * Stresses the response-extraction / validation path (response.ts) with
 * realistic LLM outputs — the stage where "empty design" failures originate.
 * Run: npx tsx scripts/dev/test-content.ts
 */
import { extractJSON, extractHTML, sanitizeHTML } from "../../src/services/ai/response";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    pass++;
    console.log(`  OK    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? " — " + extra : ""}`);
  }
}

// ---- extractJSON (Phase 1 content+blueprint parsing) ----
console.log("extractJSON:");
const cleanJson = JSON.stringify({
  content: { title: "T", sections: [{ id: "s1", title: "A", content: "b", bullets: [], icon: "x", type: "text" }], statistics: [] },
  blueprint: { designSystem: { aspectRatio: "1:1" } },
});
check("plain JSON", !!extractJSON(cleanJson).content);
check("fenced ```json", !!extractJSON("```json\n" + cleanJson + "\n```").content);
check("prose + fenced json", !!extractJSON("Here is the result:\n```json\n" + cleanJson + "\n```\nDone.").content);
check("trailing commas", !!extractJSON('{"content":{"title":"T","sections":[],"statistics":[]},"blueprint":null,}').content);
try {
  const t = extractJSON(cleanJson.slice(0, cleanJson.length - 40));
  console.log("        repaired:", JSON.stringify(t).slice(0, 90));
  check("truncated JSON (stream cutoff)", !!t);
} catch (e: any) {
  check("truncated JSON (stream cutoff)", false, e.message.slice(0, 120));
}
check("<think> blocks stripped", !!extractJSON("<think>hmm let me think</think>" + cleanJson).content);
try {
  extractJSON("");
  check("empty input rejected", false, "did not throw");
} catch {
  check("empty input rejected", true);
}

// ---- extractHTML (Phase 3 / single-shot validation) ----
console.log("extractHTML:");
const fullDoc = `<!DOCTYPE html>
<html><head><style>body{background:#0f172a}.card{border-radius:16px;padding:24px}</style></head>
<body><div class="header"><h1>Title</h1></div><div class="card">Stat</div></body></html>`;
const fencedDoc = "```html\n" + fullDoc + "\n```";
const thinkDoc = "<think>I will design a dark theme...</think>\n" + fencedDoc;
const truncatedDoc = fullDoc.slice(0, fullDoc.indexOf("</body>")); // stream cutoff mid-document
const snippet = `<style>.card{background:#1e293b;border-radius:12px}</style>
<div class="card"><h2>Section</h2><p>Body text here.</p></div>`;

for (const [name, input] of [
  ["full document", fullDoc],
  ["markdown-fenced document", fencedDoc],
  ["<think> reasoning + fenced document", thinkDoc],
  ["truncated document (no closing tags)", truncatedDoc],
] as const) {
  const out = sanitizeHTML(extractHTML(input));
  check(
    name,
    out.length >= 100 && /<(div|section|main|article|header|card)\b/i.test(out) && out.includes("<h1>Title</h1>"),
    `len=${out.length}`,
  );
}

check(
  "CSS snippet without <html>",
  (() => {
    const sn = sanitizeHTML(extractHTML(snippet));
    return sn.length >= 100 && sn.includes("<!DOCTYPE html>");
  })(),
);
check("refusal text rejected", extractHTML("I cannot fulfill this request.") === "");
check("empty input rejected", extractHTML("") === "");

// XSS stripped by sanitizer
const xss = sanitizeHTML(
  extractHTML(fullDoc.replace('<div class="card">Stat</div>', '<div class="card" onclick="steal()">Stat</div><script>alert(1)</script>')),
);
check("sanitizer strips script + onclick", !xss.includes("<script") && !xss.includes("onclick"));

// Realistic modern free-model output: prose + explanation AROUND the fence
const noisy = "Sure! Here is your infographic:\n\n" + fencedDoc + "\n\nLet me know if you want changes.";
check("prose around fenced block", sanitizeHTML(extractHTML(noisy)).includes("<h1>Title</h1>"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
