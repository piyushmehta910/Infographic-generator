import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/services/ai/pipeline";
import { AIGenerationRequest } from "@/lib/types";
import { GenerateContentOptions } from "@/services/ai/pipeline";

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

export async function POST(request: NextRequest) {
  let body: {
    request: AIGenerationRequest;
    options: GenerateContentOptions;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { request: req, options } = body;
  if (!req || !options) {
    return NextResponse.json(
      { success: false, error: "Missing request or options." },
      { status: 400 },
    );
  }

  const result = await generateContent(req, {
    apiKey: options.apiKey || "",
    providerId: options.providerId || "openrouter",
    model: options.model || "",
    temperature: options.temperature ?? 0.5,
    maxTokens: options.maxTokens ?? 2048,
    storedProviders: Array.isArray(options.storedProviders)
      ? options.storedProviders.filter((p: any) => p && typeof p.id === "string")
      : [],
  });

  return NextResponse.json(result);
}