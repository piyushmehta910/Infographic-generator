import { NextRequest, NextResponse } from "next/server";
import { AI_PROVIDERS } from "@/lib/constants";
import { AIModelOption } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 15;

interface CachedModels {
  timestamp: number;
  models: AIModelOption[];
}

let openRouterCache: CachedModels | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "openrouter";

  if (provider !== "openrouter") {
    const found = AI_PROVIDERS.find((p) => p.id === provider);
    return NextResponse.json({
      success: true,
      provider,
      models: found?.models || [],
      source: "static",
    });
  }

  // Check cache for OpenRouter
  if (openRouterCache && Date.now() - openRouterCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      provider: "openrouter",
      models: openRouterCache.models,
      source: "cache",
    });
  }

  const staticModels = AI_PROVIDERS.find((p) => p.id === "openrouter")?.models || [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        provider: "openrouter",
        models: staticModels,
        source: "static_fallback",
      });
    }

    const data = await res.json();
    const rawModels: Array<{
      id: string;
      name: string;
      description?: string;
      context_length?: number;
      top_provider?: { max_completion_tokens?: number };
      pricing?: { prompt?: string; completion?: string };
    }> = data?.data || [];

    // Filter for generative free models (exclude safety classifiers, guardrails, embeddings, audio)
    const freeRaw = rawModels.filter((m) => {
      const isFree =
        m.id.includes(":free") ||
        (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
      if (!isFree) return false;
      const lower = m.id.toLowerCase();
      // Exclude non-generative / classification / filter models
      if (
        lower.includes("safety") ||
        lower.includes("guard") ||
        lower.includes("moderation") ||
        lower.includes("classifier") ||
        lower.includes("embed") ||
        lower.includes("rerank") ||
        lower.includes("clip") ||
        lower.includes("whisper") ||
        lower.includes("audio")
      ) {
        return false;
      }
      return true;
    });

    if (freeRaw.length === 0) {
      return NextResponse.json({
        success: true,
        provider: "openrouter",
        models: staticModels,
        source: "static_fallback",
      });
    }

    const dynamicModels: AIModelOption[] = [];

    // Always include openrouter/free first
    dynamicModels.push({
      id: "openrouter/free",
      name: "OpenRouter Auto Free (Recommended)",
      contextWindow: 200000,
      maxOutput: 8192,
      isFree: true,
      description: "Intelligently routes to the highest-capacity active free model on OpenRouter.",
    });

    for (const m of freeRaw) {
      if (m.id === "openrouter/free") continue;
      dynamicModels.push({
        id: m.id,
        name: `${m.name || m.id.split("/")[1] || m.id} (Free)`,
        contextWindow: m.context_length || 131072,
        maxOutput: m.top_provider?.max_completion_tokens || 8192,
        isFree: true,
        description: m.description ? m.description.slice(0, 160) : "Active free tier model on OpenRouter.",
      });
    }

    // Add paid auto router at end
    dynamicModels.push({
      id: "openrouter/auto",
      name: "OpenRouter Auto (Paid Tier)",
      contextWindow: 128000,
      maxOutput: 8192,
      isFree: false,
      description: "Routes across all paid models (requires credits on your OpenRouter account).",
    });

    openRouterCache = {
      timestamp: Date.now(),
      models: dynamicModels,
    };

    return NextResponse.json({
      success: true,
      provider: "openrouter",
      models: dynamicModels,
      source: "live",
    });
  } catch {
    return NextResponse.json({
      success: true,
      provider: "openrouter",
      models: staticModels,
      source: "static_fallback",
    });
  }
}
