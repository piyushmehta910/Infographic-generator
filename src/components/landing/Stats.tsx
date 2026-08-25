"use client";

import { Zap, Server, Download, Lock } from "lucide-react";
import { Reveal } from "./Reveal";

const STATS = [
  { icon: <Zap className="w-5 h-5" />, value: "4", label: "AI pipeline phases" },
  { icon: <Server className="w-5 h-5" />, value: "5", label: "AI providers" },
  { icon: <Download className="w-5 h-5" />, value: "5", label: "Export formats" },
  { icon: <Lock className="w-5 h-5" />, value: "0", label: "Accounts required" },
];

export function Stats() {
  return (
    <section className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06]">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`bg-navy-950/80 p-6 flex items-center gap-4 ${
                  i % 2 === 1 ? "lg:border-l lg:border-white/[0.06]" : ""
                } ${i >= 2 ? "border-t border-white/[0.06] lg:border-t-0" : ""}`}
              >
                <div className="w-11 h-11 rounded-xl bg-brand-gradient/15 text-brand-300 flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-white">{s.value}</div>
                  <div className="text-xs text-surface-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}