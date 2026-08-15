"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AIDesignRenderer } from "@/components/templates/AIDesignRenderer";
import { generateContent } from "@/services/ai/provider";
import { getAspectRatio } from "@/services/template/templateEngine";
import { AIGenerationRequest } from "@/lib/types";

interface DemoPreset {
  label: string;
  input: string;
  purpose: string;
}

const demoPresets: DemoPreset[] = [
  {
    label: "Blog post",
    input:
      "AI is reshaping product design. Top 2025 trends: adaptive interfaces, voice-driven workflows, ambient personalization, and ethical AI guardrails. Product teams now ship features 3x faster.",
    purpose: "statistics/data",
  },
  {
    label: "Sales report",
    input:
      "Q3 revenue: $2.1M (+42% YoY). Enterprise ARR $850K, Mid-market $1.25M. Top deals: Acme ($120K), Globex ($95K), Hooli ($80K). Conversion rate improved to 23%.",
    purpose: "comparison vs",
  },
  {
    label: "Social media stats",
    input:
      "Instagram Reels drive 40% higher engagement than static posts. TikTok reaches 1B monthly users. 1 in 3 buyers discover products via short video. Video content ROI averages 20:1.",
    purpose: "statistics/data",
  },
];

const genSteps = ["Analyzing content…", "Structuring data…", "Designing layout…"];

export default function LiveDemo() {
  const [preset, setPreset] = useState<DemoPreset>(demoPresets[0]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [html, setHtml] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setHtml(null);
    setStep(0);
    const interval = setInterval(() => setStep((s) => (s + 1) % genSteps.length), 700);
    try {
      const request: AIGenerationRequest = {
        input: preset.input,
        inputType: "text",
        purpose: preset.purpose,
        aspectRatio: "1:1",
        font: "inter",
        language: "en",
        audience: "general",
        userIntent: "",
      };
      // No API key on the landing page -> the provider's local fallback
      // (generateLocalContent) produces a real, styled HTML infographic.
      const res = await generateContent(request, "", "openai", "", 0.7, 2048);
      if (res.success && res.generatedHtml) setHtml(res.generatedHtml);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

    const reset = () => {
    setHtml(null);
    setPreset(demoPresets[0]);
  };

  return (
    <section id="demo" className="py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          See it in action
        </h2>
        <p className="text-surface-300">
          Pick a preset, hit generate, and watch InfoGraphic AI build a real
          infographic in seconds — no API key required for this demo.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {demoPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPreset(p);
                reset();
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all touch-target ${
                preset.label === p.label
                  ? "bg-brand-gradient text-white shadow-lg shadow-brand-900/40"
                  : "glass-card text-surface-300 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <Button
            variant={html ? "secondary" : "primary"}
            size="lg"
            disabled={loading}
            onClick={html ? reset : run}
            className="px-10"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating…
              </>
            ) : html ? (
              "Generate another"
            ) : (
              <>
                <Play className="w-5 h-5" /> Generate infographic
              </>
            )}
                    </Button>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-brand-gradient/20 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
              </div>
              <p className="text-white font-medium">Designing layout…</p>
              <div className="mt-5 h-2 bg-surface-800 rounded-full overflow-hidden w-48 mx-auto">
                <motion.div
                  className="h-full bg-brand-gradient"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
            </motion.div>
          )}

          {html && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 mb-8"
            >
              <div className="absolute top-3 left-3 z-10 text-xs font-medium text-surface-200/70">
                Generated by InfoGraphic AI — demo
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-brand-500/5" />
                <svg viewBox="0 0 200 24" className="absolute top-6 right-6 w-28 h-7" fill="none">
                  <text x="50%" y="50%" fontSize="7" fill="white" fillOpacity="0.08" textAnchor="middle">
                    DEMO
                  </text>
                </svg>
              </div>
              <div className="relative flex justify-center">
                <AIDesignRenderer html={html} aspectRatio={getAspectRatio("1:1")} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center mt-10">
        <Button
          variant="cta"
          onClick={() => {
            const el = document.getElementById("generate-app");
            if (el) el.scrollIntoView({ behavior: "smooth" });
            else window.location.assign("/generate");
          }}
        >
          Get full resolution exports — try the full app
        </Button>
      </div>
    </section>
  );
}
