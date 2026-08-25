import http from "node:http";

const CONTENT_RESPONSE = {
  correctedContent: {
    title: "All About Cats",
    subtitle: "Fascinating facts about felines",
    sections: [
      { id: "s1", title: "Domestication", content: "Cats were first domesticated around 7500 BCE in the Near East.", bullets: [], icon: "growth", type: "text" },
      { id: "s2", title: "Population", content: "There are over 600 million domestic cats worldwide.", bullets: [], icon: "chart", type: "text" },
      { id: "s3", title: "Senses", content: "Cats have a hearing range up to 64 kHz and night vision eight times better than humans.", bullets: [], icon: "spark", type: "mixed" },
    ],
    statistics: [
      { id: "st1", value: "600M+", label: "Global cats", icon: "trend" },
      { id: "st2", value: "7500 BCE", label: "First domesticated", icon: "clock" },
    ],
    suggestedIcons: ["growth", "chart", "spark", "target"],
    suggestedColors: {},
  },
};

const BLUEPRINT_RESPONSE = {
  designSystem: {
    aspectRatio: "1:1",
    canvasDimensions: { width: 1000, height: 1000, responsiveBehavior: "scale_down" },
    designIntent: "modern",
    shapeLanguage: { borderRadius: "16px", cardStyle: "elevated", cornerTreatment: "rounded" },
  },
  designConcept: "Clean infographic about cats",
  layoutStyle: "magazine-grid",
  heroMoment: "Big cat stat in header",
  visualHierarchy: { "1st": "Title", "2nd": "Stats", "3rd": "Sections" },
  sectionCount: 3,
  readingFlow: "Top to bottom",
  spacingSystem: "8px grid",
  colorPalette: { primary: "#7C3AED", secondary: "#10B981", accent: "#F59E0B", background: "#0F172A", text: "#F8FAFC" },
  colorDetails: {
    gradients: [{ name: "hero", type: "linear", direction: "135deg", stops: ["#7C3AED 0%", "#10B981 100%"], usage: "header" }],
    neutrals: { surface: "#0F172A", surfaceVariant: "#1E293B", textSecondary: "#94A3B8", border: "#334155" },
    contrastValidation: { titleOnBackground: "pass", bodyOnSurface: "pass", accentOnPrimary: "pass", wcagAACompliant: true },
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingSize: "48px",
    bodySize: "16px",
    headingWeight: "800",
    subheadingWeight: "600",
    bodyWeight: "400",
    typeScale: { hero: "64px", h1: "48px", h2: "28px", body: "16px", caption: "12px" },
  },
  icons: { style: "crisp-svg", consistency: "same stroke", perSection: ["growth", "chart", "spark", "target"] },
  layoutGrid: {
    gridType: "12-column",
    sectionsPlacement: [
      { sectionId: 1, gridArea: "1/1/span 1/-1", backgroundTreatment: "gradient", minHeight: "20%" },
      { sectionId: 2, gridArea: "2/1/span 1/7", backgroundTreatment: "none", minHeight: "30%" },
      { sectionId: 3, gridArea: "2/7/span 1/7", backgroundTreatment: "none", minHeight: "30%" },
    ],
  },
  cssArchitecture: { approach: "inline", methodology: "BEM" },
};

function generateHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Inter,system-ui,sans-serif; background:#0F172A; color:#F8FAFC; width:1000px; height:1000px; overflow:hidden; }
.header { background:linear-gradient(135deg,#7C3AED,#10B981); padding:48px; border-radius:0; }
h1 { font-size:48px; font-weight:800; }
p.subtitle { font-size:16px; margin-top:8px; opacity:0.9; }
.stats { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:32px 48px; }
.stat-card { background:#1E293B; border-radius:16px; padding:24px; box-shadow:0 4px 24px rgba(0,0,0,0.3); }
.stat-value { font-size:36px; font-weight:800; color:#7C3AED; }
.stat-label { font-size:14px; color:#94A3B8; margin-top:4px; }
.sections { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; padding:24px 48px; }
.section { background:#1E293B; border-radius:16px; padding:24px; box-shadow:0 4px 24px rgba(0,0,0,0.3); }
h2 { font-size:20px; font-weight:600; margin-bottom:8px; color:#10B981; }
.section p { font-size:14px; line-height:1.6; color:#CBD5E1; }
</style>
</head>
<body>
<div class="header">
  <h1>All About Cats</h1>
  <p class="subtitle">Fascinating facts about felines</p>
</div>
<div class="stats">
  <div class="stat-card"><div class="stat-value">600M+</div><div class="stat-label">Global cats</div></div>
  <div class="stat-card"><div class="stat-value">7500 BCE</div><div class="stat-label">First domesticated</div></div>
</div>
<div class="sections">
  <div class="section"><h2>Domestication</h2><p>Cats were first domesticated around 7500 BCE in the Near East.</p></div>
  <div class="section"><h2>Population</h2><p>There are over 600 million domestic cats worldwide.</p></div>
  <div class="section"><h2>Senses</h2><p>Cats have a hearing range up to 64 kHz and night vision eight times better than humans.</p></div>
</div>
</body>
</html>`;
}

function pickContent(prompt) {
  // Check for HTML prompt FIRST — it contains the full blueprint JSON (with
  // "designSystem") embedded as context, so checking "designSystem" first
  // would mis-route HTML requests back to the blueprint response.
  if (prompt.includes("<!DOCTYPE")) return generateHTML();
  if (prompt.includes("designSystem")) return JSON.stringify(BLUEPRINT_RESPONSE);
  return JSON.stringify(CONTENT_RESPONSE);
}

export default function startMockProvider(port, latencyMs) {
  port = port ?? 4321;
  latencyMs = latencyMs ?? 10;
  let calls = 0;
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || !req.url?.includes("chat/completions")) {
      res.writeHead(404);
      return res.end("not found");
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    calls++;
    const prompt = (() => {
      try { return JSON.parse(body).messages?.[1]?.content || ""; } catch { return ""; }
    })();
    await new Promise((r) => setTimeout(r, latencyMs));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: pickContent(prompt) } }] }));
  });
  return new Promise((resolve) =>
    server.listen(port, () => {
      console.log(`Mock provider listening on http://127.0.0.1:${port} (${latencyMs}ms latency)`);
      resolve({ server, get calls() { return calls; } });
    }),
  );
}
