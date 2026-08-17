import {
  AIProviderId,
  InfographicContent,
  AIGenerationRequest,
  AIGenerationResult,
} from "@/lib/types";
import { getCanvasDimensions, getCanvasOrientation } from "@/lib/canvas";

/**
 * Local, API-key-free generator. Produces a premium, richly designed
 * infographic from raw text when no AI provider is configured or every
 * provider attempt fails. Results are tagged with `usedFallback: true` so
 * callers can distinguish fabricated output from real AI generation.
 */
export function generateLocalContent(
  request: AIGenerationRequest,
  providerId: AIProviderId,
  model: string,
  startTime: number,
): AIGenerationResult {
  const text = request.input || "Your Infographic";
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const title = sentences[0]?.trim().substring(0, 80) || "Your Infographic";

  const sections = sentences.slice(0, 4).map((s, i) => ({
    id: `section-${i}`,
    title: `Key Point ${i + 1}`,
    content: s.trim().substring(0, 300),
    bullets: [],
    icon: ["chart", "trend-up", "lightbulb", "target"][i],
    type: "text" as const,
  }));

  const stats = text.match(/\d+[%]?/g);
  const statistics = stats
    ? stats.slice(0, 4).map((num, i) => ({
        id: `stat-${i}`,
        value: num,
        label: ["Growth", "Impact", "Reach", "Rate"][i] || `Metric ${i + 1}`,
        prefix: "",
        suffix: num.includes("%") ? "" : "%",
      }))
    : [
        { id: "stat-1", value: "95%", label: "Effectiveness", prefix: "", suffix: "" },
        { id: "stat-2", value: "3x", label: "Improvement", prefix: "", suffix: "" },
        { id: "stat-3", value: "50M+", label: "Users", prefix: "", suffix: "" },
      ];

  const content: InfographicContent = {
    title,
    subtitle: `${words.length} words · ${sections.length} insights`,
    sections,
    statistics,
    timeline: [],
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
    icons: ["bar-chart", "arrow-up", "lightbulb", "target"],
    callToAction: "",
  };

  const { width: cw, height: ch } = getCanvasDimensions(
    request.aspectRatio,
    request.aspectRatioWidth,
    request.aspectRatioHeight,
  );
  const layout = getCanvasOrientation(request.aspectRatio, request.aspectRatioWidth, request.aspectRatioHeight);

  const titleTag = content.title || "Infographic";
  const subtitleText = content.subtitle || "";

  // Build stat bars (CSS-only progress bars)
  const statBars = statistics
    .slice(0, 3)
    .map((s) => {
      const pct = parseInt(s.value) || 75;
      return `<div class="stat-item">
      <div class="stat-header"><span class="stat-label">${s.label}</span><span class="stat-val">${s.value}</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>
    </div>`;
    })
    .join("");

  // Build section cards with color-coded accent line
  const accentColors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
  const sectionCards = sections
    .slice(0, 4)
    .map((s, i) => {
      return `<div class="sec-card">
      <div class="sec-accent" style="background:${accentColors[i % 4]}"></div>
      <div class="sec-body"><h3>${s.title}</h3><p>${s.content}</p></div>
    </div>`;
    })
    .join("");

  // Decorative circles (3 for portrait, 2 for other orientations)
  const decorationCircles =
    layout === "portrait"
      ? `<div class="deco-circle dc1"></div><div class="deco-circle dc2"></div><div class="deco-circle dc3"></div>`
      : `<div class="deco-circle dc1"></div><div class="deco-circle dc2"></div>`;

  // Generate a premium local infographic (NO scripts, pure CSS)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:${cw}px;height:${ch}px;overflow:hidden;
  font-family:'Inter',system-ui,sans-serif;
  background:linear-gradient(145deg,#0f172a 0%,#1e293b 40%,#0f172a 100%);
  color:#f1f5f9;
  display:flex;flex-direction:column;
  padding:${layout === "portrait" ? "56px 48px" : layout === "wide" ? "40px 56px" : "48px"};
  position:relative;
}
/* Decorative background circles */
.deco-circle{position:absolute;border-radius:50%;pointer-events:none;z-index:0}
.dc1{width:480px;height:480px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);top:-120px;right:-120px}
.dc2{width:360px;height:360px;background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%);bottom:-80px;left:-80px}
.dc3{width:240px;height:240px;background:radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
/* Hero */
.hero{position:relative;z-index:1;margin-bottom:${layout === "portrait" ? "40px" : "28px"}}
.hero h1{font-family:'Space Grotesk',system-ui,sans-serif;font-size:${layout === "wide" ? "52px" : "48px"};font-weight:700;line-height:1.1;
  background:linear-gradient(135deg,#f8fafc 0%,#cbd5e1 40%,#8b5cf6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;
  letter-spacing:-0.5px}
.hero .sub{font-size:16px;color:#94a3b8;font-weight:400;letter-spacing:0.3px}
.hero .divider{width:80px;height:3px;background:linear-gradient(90deg,#8b5cf6,#3b82f6);border-radius:6px;margin-top:16px}
.hero .word-badge{display:inline-block;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);border-radius:999px;padding:4px 14px;font-size:12px;color:#a78bfa;font-weight:500;margin-top:14px}
/* Stats area */
.stats-area{position:relative;z-index:1;margin-bottom:${layout === "portrait" ? "36px" : "24px"}}
.stats-area .stats-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:600;margin-bottom:14px}
.stat-item{margin-bottom:14px}
.stat-item:last-child{margin-bottom:0}
.stat-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.stat-label{font-size:13px;color:#94a3b8;font-weight:500}
.stat-val{font-size:15px;font-weight:700;color:#f1f5f9;font-family:'Space Grotesk',system-ui,sans-serif}
.stat-track{width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden}
.stat-fill{height:8px;border-radius:999px;background:linear-gradient(90deg,#8b5cf6,#3b82f6,#10b981);transition:width 0.3s ease;min-width:4%}
/* Sections grid */
.sections-area{position:relative;z-index:1;flex:1;overflow:hidden}
.the-grid{display:grid;grid-template-columns:${layout === "wide" ? "repeat(4,1fr)" : "1fr 1fr"};gap:${layout === "portrait" ? "12px" : "14px"}}
.sec-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.sec-accent{height:4px;flex-shrink:0}
.sec-body{padding:${layout === "portrait" ? "14px 16px" : "16px 18px"};flex:1}
.sec-body h3{font-family:'Space Grotesk',system-ui,sans-serif;font-size:15px;font-weight:600;color:#e2e8f0;margin-bottom:6px}
.sec-body p{font-size:13px;line-height:1.6;color:#94a3b8;font-weight:400;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
/* Footer */
.footer-bar{position:relative;z-index:1;padding-top:${layout === "portrait" ? "30px" : "18px"};font-size:11px;color:#475569;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);margin-top:auto}
</style>
</head>
<body>
${decorationCircles}
<div class="hero">
  <h1>${titleTag}</h1>
  ${subtitleText ? `<p class="sub">${subtitleText}</p>` : ""}
  <div class="divider"></div>
  <div class="word-badge">${words.length} words &middot; ${sections.length} insights</div>
</div>
<div class="stats-area">
  <p class="stats-title">Key Metrics</p>
  <div class="stats-rich">${statBars}</div>
</div>
<div class="sections-area">
  <div class="the-grid">${sectionCards}</div>
</div>
<div class="footer-bar">
  <span>&copy; Infographic Generator</span>
  <span>${request.aspectRatio || "1:1"} &middot; ${cw}&times;${ch}px</span>
</div>
</body>
</html>`;

  return {
    success: true,
    content,
    generatedHtml: html,
    provider: "local" as AIProviderId,
    model: "local-generator",
    processingTime: Date.now() - startTime,
    usedFallback: true,
  };
}