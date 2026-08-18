"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const PROVIDERS = [
  { name: "OpenAI", color: "#10b981", tag: "GPT-4o" },
  { name: "Google Gemini", color: "#60a5fa", tag: "Gemini 2.0" },
  { name: "Anthropic Claude", color: "#fb923c", tag: "Claude 3.5" },
  { name: "OpenRouter", color: "#a78bfa", tag: "100+ models" },
  { name: "Groq", color: "#f87171", tag: "Instant" },
];

export function Providers() {
  return (
    <section id="providers" className="py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-surface-300 mb-4">
            <KeyRound className="w-3.5 h-3.5 text-brand-300" /> Your keys, your choice
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight text-balance">
            Works with the <span className="text-gradient">AI you already use</span>
          </h2>
          <p className="text-surface-400 mt-4 leading-relaxed">
            Connect any provider with your own API key. Smart fallback tries your other keys
            automatically when one fails.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="card-glow rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                </div>
                <div className="font-semibold text-white text-sm leading-tight">{p.name}</div>
                <div className="text-[11px] text-surface-500 mt-1 font-mono">{p.tag}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-surface-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Keys are stored in your browser only — never on our servers.
          </div>
        </Reveal>
      </div>
    </section>
  );
}