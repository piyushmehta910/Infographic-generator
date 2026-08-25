import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateContent } from "@/services/ai/pipeline";
import { GenerateContentOptions } from "@/services/ai/pipeline";
import { AIProviderId } from "@/lib/types";

// ============================================================
// Server-side generation proxy.
// The full 4-phase pipeline runs HERE (Node fetch), so browsers
// never talk to the AI providers directly — this eliminates the
// CORS / mixed-content / ad-blocker failures that broke client-
// only generation. The user's API key travels only in the request
// body and is never stored server-side.
// ============================================================

export const runtime = "nodejs";
export const maxDuration = 120;

const storedProviderSchema = z.object({
  id: z.string().min(1).max(40),
  apiKey: z.string().max(500).default(""),
  model: z.string().max(200).default(""),
  baseUrl: z
    .string()
    .max(2000)
    .refine((v) => {
      if (!v) return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, "baseUrl must be a valid http(s) URL")
    .optional(),
});

const bodySchema = z.object({
  request: z.object({
    input: z.string().max(24000),
    inputType: z.string().optional(),
    aspectRatio: z.string().max(20).optional(),
    aspectRatioWidth: z.number().int().positive().max(10000).optional(),
    aspectRatioHeight: z.number().int().positive().max(10000).optional(),
    font: z.string().max(40).optional(),
    language: z.string().max(20).optional(),
    audience: z.string().max(120).optional(),
    userIntent: z.string().max(600).optional(),
  }),
  options: z.object({
    apiKey: z.string().max(500).default(""),
    providerId: z.string().default("openrouter"),
    model: z.string().max(200).default(""),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(64).max(16000).optional(),
    storedProviders: z.array(storedProviderSchema).max(8).default([]),
    // Entries are strictly re-validated by SessionMemory downstream.
    memory: z.array(z.record(z.unknown())).max(40).default([]),
  }),
});

/** Same SSRF rules as /api/test-provider: no private/reserved base URLs. */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        error: `Invalid request${issue?.path?.length ? ` at ${issue.path.join(".")}` : ""}: ${issue?.message || "validation failed"}`,
      },
      { status: 400 },
    );
  }

  const { request: req, options } = parsed.data;

  // Defense-in-depth: drop custom-provider base URLs pointing at
  // private/reserved addresses before they reach the providers.
  const storedProviders = options.storedProviders.filter((p) => {
    if (p.id !== "custom" && !p.baseUrl) return Boolean(p.apiKey);
    if (!p.baseUrl) return Boolean(p.apiKey);
    try {
      return !isPrivateHost(new URL(p.baseUrl).hostname);
    } catch {
      return false;
    }
  });

  let result;
  try {
    result = await generateContent(req as never, {
      apiKey: options.apiKey,
      providerId: options.providerId as AIProviderId,
      model: options.model,
      temperature: options.temperature ?? 0.5,
      maxTokens: options.maxTokens ?? 2048,
      storedProviders: storedProviders.map((p) => ({
        id: p.id as AIProviderId,
        apiKey: p.apiKey,
        model: p.model,
        baseUrl: p.baseUrl,
      })),
      memory: options.memory as unknown as GenerateContentOptions["memory"],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error.", errorType: "upstream_error" },
      { status: 500 },
    );
  }

  if (!result.success) {
    const statusMap: Record<string, number> = {
      rate_limit: 429,
      auth_failed: 401,
      invalid_request: 400,
      timeout: 504,
      upstream_error: 502,
    };
    const status = statusMap[result.errorType ?? "upstream_error"] ?? 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
