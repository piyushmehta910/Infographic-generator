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

/**
 * SSRF guard for custom-provider base URLs: only public http(s) origins are
 * allowed. Blocks loopback, link-local (incl. cloud metadata), RFC1918
 * ranges, and credential-embedded URLs.
 */
function validateBaseUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return "Base URL must be a string.";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Base URL is not a valid URL.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Base URL must use http or https.";
  }
  if (url.username || url.password) {
    return "Base URL must not embed credentials.";
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blocked =
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
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^::1$/.test(host) ||
    /^f[cd][0-9a-f]{2}:/i.test(host);
  if (blocked) {
    return "Base URL points to a private or reserved address.";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { providerId, apiKey, model, baseUrl } = body as {
    providerId: AIProviderId;
    apiKey: string;
    model: string;
    baseUrl?: string;
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
  if (providerId === "custom") {
    const baseUrlError = validateBaseUrl(baseUrl);
    if (baseUrlError) {
      return NextResponse.json(
        { success: false, error: baseUrlError },
        { status: 400 },
      );
    }
  }

  const started = Date.now();
  try {
    const text = await provider.generate(
      "Reply with exactly: OK",
      apiKey,
      model || "",
      0.2,
      50,
      baseUrl,
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