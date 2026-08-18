import { NextRequest, NextResponse } from "next/server";
import { providerMap } from "@/services/ai/providers";
import { AIProviderId } from "@/lib/types";

// ============================================================
// Test a provider connection with the user's key (server-side).
// Returns the exact provider response or the precise error so
// setup problems are diagnosable instead of "generating nothing".
// ============================================================

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { providerId, apiKey, model } = body as {
    providerId: AIProviderId;
    apiKey: string;
    model: string;
  };

  if (!providerId || !apiKey) {
    return NextResponse.json(
      { success: false, error: "Missing provider or API key." },
      { status: 400 },
    );
  }
  const provider = providerMap[providerId];
  if (!provider) {
    return NextResponse.json(
      { success: false, error: "Unknown provider." },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const text = await provider.generate(
      "Reply with exactly: OK",
      apiKey,
      model || "",
      0.2,
      50,
    );
    return NextResponse.json({
      success: true,
      providerId,
      model: model || "",
      ms: Date.now() - started,
      sample: text.slice(0, 300),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      providerId,
      model: model || "",
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}