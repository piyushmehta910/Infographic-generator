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

function makeOpts(port) {
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
    onProgress: (e: any) => {
      console.log("  [progress]", e.type, e.phase || "", e.status || "", e.message || "");
    },
  };
}

async function main() {
  // Slow test: 16s per call. Content + blueprint = 32s. HTML retry loop may exceed budget.
  const mock = await startMockProvider(4321, 16_000);
  console.log("=== SLOW (16s/call, budget 110s) ===");
  const t0 = Date.now();
  const slow = await generateContent(request, makeOpts(4321));
  console.log("success=" + slow.success + " time=" + (Date.now() - t0) + "ms usedFallback=" + slow.usedFallback);
  console.log("provider:", slow.provider, "model:", slow.model);
  if (slow.steps) for (const s of slow.steps) console.log("  " + s.name + " " + s.status + " " + s.durationMs + "ms");
  console.log("error:", slow.error || "none");
  console.log("warnings:", slow.warnings || "none");
  mock.server.close();
  process.exit(0);
}

main().catch((e) => { console.error("UNCAUGHT:", e); process.exit(1); });
