import { z } from "zod";

// ============================================================
// Zod schemas for validating AI-generated outlines (Step 1).
// Prevents malformed AI output from reaching the HTML generator.
// See infographic-complete-system-v2.md §3.
// ============================================================

const SectionSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1, "section title must not be empty"),
  content: z.string().min(1, "section content must not be empty"),
  bullets: z.array(z.string()).optional(),
  icon: z.string().optional().nullable(),
  type: z.enum(["text", "image", "bullets", "mixed"]).optional(),
});

const StatSchema = z.object({
  id: z.string().min(1).optional(),
  value: z.string().min(1, "stat value must not be empty"),
  label: z.string().min(1, "stat label must not be empty"),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  icon: z.string().optional(),
});

export const CorrectedContentSchema = z.object({
  title: z.string().min(1, "title must not be empty"),
  subtitle: z.string().optional().nullable(),
  sections: z.array(SectionSchema).min(2, "need at least 2 sections"),
  statistics: z.array(StatSchema).optional(),
  timeline: z.array(z.any()).optional(),
  suggestedIcons: z.array(z.string()).optional(),
  suggestedColors: z.record(z.string()).optional(),
  callToAction: z.string().optional(),
  language: z.string().optional(),
});

export const OutlineResultSchema = z.object({
  isComplete: z.boolean().optional(),
  correctedContent: CorrectedContentSchema,
});

/**
 * Validate the Step 1 AI output. Returns { ok, errors }.
 * Used to trigger a single stricter retry of Pass 1 when malformed.
 */
export function validateOutline(
  raw: unknown,
): { ok: boolean; errors: string[] } {
  const result = OutlineResultSchema.safeParse(raw);
  if (result.success) return { ok: true, errors: [] };
  // Return only the first few readable issues.
  const errors = result.error.issues
    .slice(0, 6)
    .map((i) => i.path.join(".") + ": " + i.message);
  return { ok: false, errors };
}

export type CorrectedContent = z.infer<typeof CorrectedContentSchema>;
