import { AIGenerationRequest } from "@/lib/types";

function cleanStr(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s || s === "..." || s.toLowerCase().includes("placeholder") || s.toLowerCase() === "tbd" || s.toLowerCase() === "lorem ipsum") return fallback;
  return s;
}

/**
 * Last-resort outline built straight from the user's text when the AI's
 * structured analysis is unusable (empty/malformed JSON). Keeps generation
 * alive with real source-derived sections instead of failing outright.
 */
export function heuristicOutlineFromInput(input: string): any {
  const lines = (input || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 80) || "Your Infographic";
  const body = lines.slice(1).join(" ");
  const sentences = body
    .split(/[.!?]+\s/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
    .slice(0, 4);
  const points = sentences.length ? sentences : [body.slice(0, 220) || "Key insight distilled from your content."];
  return {
    correctedContent: {
      title,
      subtitle: "Generated from your source content",
      sections: points.map((p, i) => ({
        id: `section-${i + 1}`,
        title: `Point ${i + 1}`,
        content: p.slice(0, 220),
        bullets: [] as string[],
        icon: ["growth", "spark", "chart", "target"][i % 4],
        type: "mixed",
      })),
    },
  };
}

export function normalizeContent(cr: any, request: AIGenerationRequest) {
  const src = cr?.correctedContent ?? {};
  const inputTitle = (request.input || "").split(/\s+/).filter(Boolean).slice(0, 8).join(" ") || "Your Infographic";
  const title = cleanStr(src.title, inputTitle);
  const subtitle = cleanStr(src.subtitle, "Key insights, visualized at a glance");

  let sections = Array.isArray(src.sections) ? src.sections : [];
  sections = sections
    .map((s: any, i: number) => ({
      id: s?.id || `section-${i + 1}`,
      title: cleanStr(s?.title, `Insight ${i + 1}`),
      content: cleanStr(s?.content, "High-impact insight backed by clear, concise facts."),
      bullets: Array.isArray(s?.bullets) ? s.bullets.filter((b: unknown) => typeof b === "string" && b.trim()).map((b: unknown) => String(b)) : [],
      icon: cleanStr(s?.icon, ["growth", "spark", "chart", "target"][i % 4]),
      type: (s?.type === "text" || s?.type === "mixed" ? s.type : "mixed") as "text" | "mixed",
    }))
    .filter((s: any) => s.title && s.content)
    .slice(0, 6);

  if (sections.length === 0) {
    sections = [
      { id: "section-1", title: "The Big Picture", content: subtitle, bullets: [], icon: "chart", type: "mixed" as const },
      { id: "section-2", title: "Why It Matters", content: inputTitle, bullets: [], icon: "target", type: "mixed" as const },
      { id: "section-3", title: "Key Takeaways", content: "Actionable points distilled from your source content.", bullets: ["Clear and concise", "Easy to scan", "Ready to share"], icon: "bulb", type: "mixed" as const },
    ];
  }

  let statistics = Array.isArray(src.statistics) ? src.statistics : [];
  statistics = statistics
    .map((s: any, i: number) => ({
      id: s?.id || `stat-${i + 1}`,
      value: cleanStr(s?.value, `${20 - i * 5}%`),
      label: cleanStr(s?.label, `Metric ${i + 1}`),
      icon: cleanStr(s?.icon, "trend"),
    }))
    .filter((s: any) => s.value && s.label)
    .slice(0, 4);

  const timeline = Array.isArray(src.timeline) ? src.timeline.filter((t: any) => t).slice(0, 5) : [];
  const icons =
    Array.isArray(src.suggestedIcons) && src.suggestedIcons.length
      ? src.suggestedIcons.slice(0, 4)
      : sections.map((s: any) => s.icon);
  const suggestedColors =
    src.suggestedColors && typeof src.suggestedColors === "object" ? src.suggestedColors : {};
  const heroStat =
    src.heroStat && typeof src.heroStat === "object"
      ? { value: cleanStr(src.heroStat.value, ""), label: cleanStr(src.heroStat.label, "") }
      : undefined;
  const tone =
    src.toneAnalysis && typeof src.toneAnalysis === "object" ? src.toneAnalysis : undefined;
  const colorPsychology =
    src.colorPsychologyRecommendation && typeof src.colorPsychologyRecommendation === "object"
      ? src.colorPsychologyRecommendation
      : undefined;

  return {
    title,
    subtitle,
    sections,
    statistics,
    timeline,
    suggestedIcons: icons,
    suggestedColors,
    heroStat,
    tone,
    colorPsychology,
    callToAction: "",
    language: cleanStr(src.language, "English"),
  };
}