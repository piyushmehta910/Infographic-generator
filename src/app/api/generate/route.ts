import { NextRequest } from "next/server";
import { z } from "zod";
import { generateContent } from "@/services/ai/pipeline";
import { GenerateContentOptions } from "@/services/ai/pipeline";
import { AIProviderId } from "@/lib/types";

// ============================================================
// Server-side generation proxy with REAL-TIME PROGRESS STREAMING.
//
// The full 4-phase pipeline runs HERE (Node fetch), so browsers
// never talk to the AI providers directly — this eliminates the
// CORS / mixed-content / ad-blocker failures that broke client-
// only generation. The user's API key travels only in the request
// body and is never stored server-side.
//
// The response is an SSE stream (`text/event-stream`):
//   event: progress   data: {type:"phase_start",phase:"content",…}
//   event: result     data: <full AIGenerationResult JSON>
// Client cancellation propagates via request.signal into every
// upstream provider fetch.
// ============================================================

export const runtime = "nodejs";
// Next.js requires a static literal here — conditional expressions are
// rejected.  60s covers every Vercel Hobby tier (non-Fluid and Fluid);
// budget in pipeline.ts is derived dynamically via process.env.VERCEL.
export const maxDuration = 60;

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

const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(8000),
  timestamp: z.number().optional(),
  revisionId: z.string().optional(),
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
    chatHistory: z.array(chatMessageSchema).max(20).optional(),
    refinementPrompt: z.string().max(4000).optional(),
    previousContent: z.record(z.unknown()).optional(),
    previousBlueprint: z.record(z.unknown()).optional(),
    previousHtml: z.string().max(100000).optional(),
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

// --- Best-effort per-IP throttle: max 6 generations / rolling minute. ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (rateBuckets.size > 10_000) {
    for (const [key, times] of rateBuckets) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(key);
    }
  }
  return false;
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid request body.", errorType: "invalid_request" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      {
        success: false,
        errorType: "invalid_request",
        error: `Invalid request${issue?.path?.length ? ` at ${issue.path.join(".")}` : ""}: ${issue?.message || "validation failed"}`,
      },
      { status: 400 },
    );
  }

  if (isRateLimited(clientIp(request))) {
    return Response.json(
      { success: false, errorType: "rate_limit", error: "Too many generations — please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
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

  const encoder = new TextEncoder();
  // Cancellation uses the STREAM's cancel() (true client disconnect) rather
  // than request.signal: some Next.js versions abort request.signal
  // spuriously mid-response, which would silently swallow the result frame.
  const upstreamAbort = new AbortController();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      // Periodic comment frames keep proxies/CDNs from treating the
      // connection as idle and dropping it during long quiet phases.
      const heartbeat = setInterval(() => send("ping", {}), 15_000);
      try {
        const result = await generateContent(req as never, {
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
          signal: upstreamAbort.signal,
          onProgress: (event) => send("progress", event),
        });
        send("result", result);
      } catch {
        send("result", {
          success: false,
          errorType: "upstream_error",
          error: "Internal server error.",
        });
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      upstreamAbort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
