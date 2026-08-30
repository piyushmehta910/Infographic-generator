import startMockProvider from "./mock-provider.mjs";
import { generateContent } from "@/services/ai/pipeline";
import type { AIGenerationRequest } from "@/lib/types";

const request: AIGenerationRequest = {
  input: "All about cats: domestication, population, senses.",
  inputType: "text",
  aspectRatio: "1:1",
  aspectRatioWidth: 1000,
  aspectRatioHeight: 1000,
};

function makeOpts(port: number, budgetMs?: number) {
  return {
    apiKey: "test-fake",
    providerId: "custom",
    model: "mock-v1",
    temperature: 0.5,
    maxTokens: 2048,
    storedProviders: [
      { id: "custom", apiKey: "test-fake", model: "mock-v1", baseUrl: "http://127.0.0.1:" + port },
    ],
    memory: [] as any[],
    budgetMs,
    onProgress: (e: any) => {
      console.log("  [progress]", e.type, e.phase || "", e.status || "", e.message || "");
    },
  };
}

async function runCase(name: string, port: number, latencyMs: number, budgetMs?: number) {
  const mock = await startMockProvider(port, latencyMs);
  console.log(`=== ${name} (${latencyMs}ms/call${budgetMs ? ", budget " + budgetMs + "ms" : ""}) ===`);
  const t0 = Date.now();
  let out: any;
  try {
    out = await generateContent(request, makeOpts(port, budgetMs));
  } catch (e) {
    console.log("  THREW:", e);
    mock.server.close();
    return;
  }
  console.log("success=" + out.success + " time=" + (Date.now() - t0) + "ms usedFallback=" + out.usedFallback);
  console.log("provider:", out.provider, "model:", out.model);
  if (out.steps) for (const s of out.steps) console.log("  " + s.name + " " + s.status + " " + s.durationMs + "ms");
  console.log("error:", out.error || "none");
  console.log("warnings:", out.warnings || "none");
  mock.server.close();
}

async function main() {
  // Fast: full pipeline, both phases run, well under budget.
  await runCase("FAST", 4321, 100);
  // Simulate Vercel's 50s budget with 16s/call models. The combined phase eats
  // ~34s of budget, triggering the HTML budget guard, then the single-shot
  // handoff renders the blueprint -> HTML in one call within the SAME budget.
  // This is the exact scenario that used to sever the SSE stream.
  await runCase("VERCEL-SLOW (16s/call, 50s budget)", 4322, 16_000, 50_000);
  // Slow on the generous local budget: everything completes normally.
  await runCase("SLOW (16s/call, local budget)", 4323, 16_000);
  process.exit(0);
}

main().catch((e) => { console.error("UNCAUGHT:", e); process.exit(1); });