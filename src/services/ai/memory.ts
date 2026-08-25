// ============================================================
// Small working-memory layer for the generation pipeline.
// Each phase's output is distilled into compact memory entries and
// injected into every downstream prompt, so the AI:
//   - remembers decisions it already made (palette, fonts, layout)
//   - keeps facts/stats consistent across phases and retries
//   - fixes its own past mistakes on the next attempt
// The memory is also returned in the result so the client can carry
// it forward into the next generation (e.g. "Regenerate with a new
// theme" still remembers the content and design decisions).
// ============================================================

export type MemoryKind = "source" | "fact" | "decision" | "correction" | "note";

export interface MemoryEntry {
  kind: MemoryKind;
  label: string;
  detail: string;
}

const MAX_ENTRIES = 14;
const MAX_DETAIL = 260;


export class SessionMemory {
  private entries: MemoryEntry[] = [];

  constructor(seed: MemoryEntry[] = []) {
    // Normalise and validate any seed entries to avoid runtime errors later.
    this.entries = (Array.isArray(seed) ? seed : [])
      .filter((e): e is MemoryEntry => Boolean(e) && typeof e.kind === "string" && typeof e.label === "string")
      .map((e) => ({
        kind: (['source','fact','decision','correction','note'].includes(e.kind) ? e.kind as MemoryKind : 'note'),
        label: String(e.label).trim(),
        detail: String(e.detail ?? '').trim(),
      }))
      .slice(-MAX_ENTRIES);
  }

  add(kind: MemoryKind, label: string, detail: string): void {
    const text = (detail || "").replace(/\s+/g, " ").trim().slice(0, MAX_DETAIL);
    // Skip adding if this entry is identical to the most recent one (prevent duplicate noise).
    const last = this.entries[this.entries.length - 1];
    if (last && last.kind === kind && last.label === label && last.detail === text) {
      return;
    }
    this.entries.push({ kind, label, detail: text });
    if (this.entries.length > MAX_ENTRIES) this.entries.shift();
  }

  hasEntries(): boolean {
    return this.entries.length > 0;
  }

  /**
   * Compact block appended to prompts. Kept small on purpose so it never
   * crowds out the real instruction (a "small memory system").
   */
  context(): string {
    if (this.entries.length === 0) return "";
    const lines = this.entries.map(
      (e) => `- ${e.kind.toUpperCase()}: ${e.label}${e.detail ? " — " + e.detail : ""}`,
    );
    return [
      "## WORKING MEMORY (facts and decisions already established — stay consistent, do not contradict them)",
      lines.join("\n"),
    ].join("\n");
  }

  toJSON(): MemoryEntry[] {
    return [...this.entries];
  }
}

export function summarizeSource(input: string): string {
  const text = (input || "").replace(/\s+/g, " ").trim();
  if (!text) return "User provided no source text.";
  const words = text.split(" ");
  const snippet =
    words.length > 40
      ? words.slice(0, 40).join(" ") + "…"
      : text;
  return `User input (${words.length} words): ${snippet}`;
}

export function summarizeContent(content: any): string {
  const title = typeof content?.title === "string" ? content.title : "Untitled";
  const sections = Array.isArray(content?.sections) ? content.sections.length : 0;
  const stats = Array.isArray(content?.statistics) ? content.statistics.length : 0;
  const hero = content?.heroStat?.value ? ` Hero stat: ${content.heroStat.value}.` : "";
  const colors = content?.suggestedColors
    ? ` Suggested palette: ${JSON.stringify(content.suggestedColors)}.`
    : "";
  return `Title "${title}" — ${sections} sections, ${stats} statistics.${hero}${colors}`;
}

export function summarizeBlueprint(blueprint: any): string {
  if (!blueprint || typeof blueprint !== "object") return "";
  const palette = blueprint.colorPalette
    ? ` Palette ${JSON.stringify(blueprint.colorPalette)}.`
    : "";
  const typography = blueprint.typography?.headingFont
    ? ` Fonts: ${blueprint.typography.headingFont} / ${blueprint.typography.bodyFont || "Inter"}.`
    : "";
  const layout = blueprint.layoutStyle ? ` Layout: ${blueprint.layoutStyle}.` : "";
  return `Design concept: ${blueprint.designConcept || "n/a"}.${layout}${palette}${typography}`;
}