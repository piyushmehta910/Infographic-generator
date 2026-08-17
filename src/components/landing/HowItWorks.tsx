"use client";

import { FileText, SlidersHorizontal, Sparkles, Download } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: <FileText className="w-5 h-5" />,
    step: "01",
    title: "Paste content",
    desc: "Text, article URL, CSV data, or an image.",
  },
  {
    icon: <SlidersHorizontal className="w-5 h-5" />,
    step: "02",
    title: "Pick your style",
    desc: "Purpose, color theme, density, and format.",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    step: "03",
    title: "AI generates",
    desc: "Analyzes, structures, and designs a unique visual.",
  },
  {
    icon: <Download className="w-5 h-5" />,
    step: "04",
    title: "Export",
    desc: "Download as PNG, JPG, SVG, PDF, or JSON.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 scroll-mt-20 border-t border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-surface-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" /> How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight text-balance">
            From idea to infographic <span className="text-gradient">in four steps</span>
          </h2>
          <p className="text-surface-400 mt-4 leading-relaxed">
            No templates to browse. No drag-and-drop. Just describe, and let the AI do the rest.
          </p>
        </Reveal>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="hidden lg:block absolute top-11 left-[12%] right-[12%] h-px bg-gradient-to-r from-brand-500/0 via-brand-400/40 to-emerald-400/0" />
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.1}>
              <div className="relative text-center p-6 rounded-2xl border border-white/[0.06] bg-navy-950/60 card-glow h-full">
                <div className="relative z-10 w-11 h-11 mx-auto rounded-xl bg-brand-gradient/20 border border-brand-400/25 text-brand-300 flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-brand-400 tracking-widest mb-1.5">{s.step}</div>
                <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
                <p className="text-xs text-surface-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}