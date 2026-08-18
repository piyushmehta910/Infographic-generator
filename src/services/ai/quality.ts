import { stripMarkdown } from "./response";

// Post-generation validation.
export function validateInfographicHTML(rawHtml: string, expectedWidth: number, expectedHeight: number) {
  const t = stripMarkdown(rawHtml);
  const checks = {
    hasDoctype: /<!doctype\s+html/i.test(t),
    hasHtmlTag: /<html/i.test(t),
    hasSubstance: t.split(/\s+/).length > 10,
    noPlaceholders: !/lorem ipsum|sample text|your content here|\bplaceholder\b|example stat|dummy data|#todo/i.test(t),
    noMarkdown: !t.includes("```"),
    // Accept the canvas size as literal px, as a width/height CSS rule, or via a
    // wrapper that sets both. Free models often omit the exact px value, so
    // requiring it verbatim caused valid designs to be rejected.
    correctSize:
      (t.includes(`${expectedWidth}px`) &&
        (t.includes(`${expectedHeight}px`) ||
          new RegExp(`(?:max-)?width\\s*:\\s*${expectedWidth}px`, "i").test(t))) ||
      ((t.includes(`${expectedWidth}px`) || t.includes(`${expectedHeight}px`)) &&
        /(?:max-)?(?:width|height)\s*:\s*\d+px/i.test(t)) ||
      (new RegExp(`width\\s*:\\s*${expectedWidth}px`, "i").test(t) &&
        new RegExp(`height\\s*:\\s*${expectedHeight}px`, "i").test(t)),
    noExternalImages: !/<img[^>]+src\s*=\s*["']http/i.test(t),
    noScriptTags: !/<script/i.test(t),
    noEventHandlers: !/\son\w+\s*=/i.test(t),
    hasStyleBlock: /<style[\s\S]*?<\/style>/i.test(t),
    hasColorAndShape:
      /(?:#[0-9a-f]{3,8}\b|rgba?\(|hsl\(|(?:background|color)\s*:)/i.test(t) &&
      /(?:border-?radius|box-shadow|padding|margin|grid-template|display\s*:\s*(?:flex|grid)|position\s*:\s*(?:absolute|relative|fixed))/i.test(t),
    hasStructuredLayout:
      /<(?:div|section|main|article|header|footer|aside|table|ul|ol)\b/i.test(t) &&
      /<(?:h[1-6]|p|span|li|td|th)\b/i.test(t),
  };
  const critical =
    checks.hasDoctype &&
    checks.hasHtmlTag &&
    checks.noPlaceholders &&
    checks.noMarkdown &&
    checks.hasSubstance &&
    checks.hasStyleBlock &&
    checks.hasColorAndShape &&
    checks.hasStructuredLayout;
  return { pass: critical, checks };
}

// Build a targeted revision prompt from the failing validation checks.
export function buildRetrySuffix(checks: Record<string, boolean>, width: number, height: number): string {
  const fixes: string[] = [];
  if (!checks.noPlaceholders)
    fixes.push("The output still contains PLACEHOLDER text (lorem ipsum / sample / example / your content here / etc). Replace ALL of it with real content from the original input.");
  if (!checks.hasDoctype || !checks.hasHtmlTag)
    fixes.push("Return a complete, valid HTML document that starts with <!DOCTYPE html> and contains <html>.");
  if (!checks.noMarkdown)
    fixes.push("No markdown fences or explanations. Output the raw HTML only.");
  if (!checks.correctSize)
    fixes.push(`The outer container MUST be exactly ${width}px x ${height}px with overflow:hidden and nothing clipped or overlapping.`);
  if (!checks.hasSubstance)
    fixes.push("The document appears empty. Include all outline sections and real content.");
  if (!checks.hasStyleBlock || !checks.hasColorAndShape || !checks.hasStructuredLayout) {
    fixes.push(
      "Your previous output was plain prose, NOT a designed infographic. " +
        "Rewrite it as a real visual layout: include a <style> block with actual CSS, " +
        "a non-flat background (gradient/color), styled cards with border-radius & shadow, " +
        "and a grid/flex layout. Structure content with <div>/<section> containers, headings, " +
        "and cards — never a bare wall of <p> paragraphs. Always honor the exact canvas size.",
    );
  }
  const base = [
    "",
    "REVISION: Your previous output was rejected by automated validation.",
    ...fixes,
    "Use the design contract's palette, typography, spacing and background verbatim.",
    "Visualize every statistic. No CTA buttons. No emoji icons.",
  ];
  return base.join("\n");
}

// Grade the visual richness of generated HTML to pick the best among attempts.
export function scoreInfographicHTML(rawHtml: string): { score: number; metrics: Record<string, number | boolean> } {
  const t = stripMarkdown(rawHtml);
  const styleTag = t.match(/<style[\s\S]*?<\/style>/i)?.[0] || "";
  const allText = styleTag + " " + t;

  const cssProps = (styleTag.match(/[a-zA-Z-]+\s*:/g) || []).length;
  const colors = (allText.match(/#[0-9a-f]{3,8}\b/gi) || []).length;
  const gradients = (allText.match(/gradient/gi) || []).length;
  const cards = (allText.match(/border-?radius|box-shadow|backdrop-filter/gi) || []).length;
  const containers = (t.match(/<(?:div|section|main|article|header|footer|aside|table)\b/gi) || []).length;
  const headings = (t.match(/<h[1-6]\b/gi) || []).length;
  const bodyWords = t.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w: string) => w.length > 2).length;
  const hasViz = /progress|bar|donut|circle|ring|chart|radial|linear|width:\s*\d+%/i.test(t);
  const hasStyle = styleTag.length > 50;

  let score = 0;
  score += Math.min(cssProps / 12, 1) * 20;
  score += Math.min(colors / 4, 1) * 15;
  score += Math.min((gradients * 2) / 3, 1) * 10;
  score += Math.min(cards / 4, 1) * 15;
  score += Math.min(containers / 3, 1) * 10;
  score += Math.min(headings / 2, 1) * 5;
  score += bodyWords > 30 ? 10 : bodyWords > 15 ? 6 : bodyWords > 5 ? 3 : 1;
  score += hasViz ? 10 : 0;
  score += hasStyle ? 5 : 0;

  return { score: Math.round(score), metrics: { cssProps, colors, gradients, cards, containers, headings, bodyWords, hasViz, hasStyle } };
}

// Build a targeted improvement hint for low-scoring attempts.
export function buildQualitySuffix(metrics: Record<string, number | boolean>, attempt: number, prevScore: number): string {
  const hints: string[] = ["", `### QUALITY IMPROVEMENT (attempt ${attempt + 1}, previous score ${prevScore}/100)`];
  if ((metrics.cssProps as number) < 12) hints.push("- Add MUCH more CSS: define layout (grid/flex), spacing, colors, and styling for every element in a rich <style> block.");
  if ((metrics.colors as number) < 4) hints.push("- Use at least 4 distinct colors from a cohesive palette (primary, secondary, accent, background, text).");
  if ((metrics.gradients as number) === 0) hints.push("- Add a gradient background (not flat) or gradient accents on cards so the design looks premium.");
  if ((metrics.cards as number) < 4) hints.push("- Style each section inside a card with border-radius, box-shadow, and a colored background.");
  if ((metrics.containers as number) < 3) hints.push("- Structure with <div>/<section> containers in a grid/flex layout for a clean visual hierarchy.");
  hints.push("- Visualize EVERY statistic as a progress bar, big number with accent, or simple CSS bar.");
  hints.push("- Use a non-white, non-flat background (gradient, mesh, or pattern).");
  return hints.join("\n");
}