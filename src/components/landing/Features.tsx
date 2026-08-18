"use client";

import { BarChart3, Palette, Zap, Download, Lock, Layers } from "lucide-react";
import { Reveal } from "./Reveal";

const FEAT_BARS = [45, 70, 52, 85, 62, 95];
const FORMATS = ["PNG", "JPG", "SVG", "PDF", "JSON"];
const PURPOSE_CHIPS = ["📱 Social", "📊 Slides", "📄 Report", "📚 Edu", "📢 Ads", "✨ Custom"];

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-surface-300 mb-4">
            <Layers className="w-3.5 h-3.5 text-brand-300" /> Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight text-balance">
            Everything you need to <span className="text-gradient">look professional</span>
          </h2>
          <p className="text-surface-400 mt-4 leading-relaxed">
            AI handles layout, color, and typography. You just add content and export.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-4">
          <Reveal className="lg:col-span-2" delay={0}>
            <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-brand-300 mb-4">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Data-Driven</span>
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Real data, visualized</h3>
              <p className="text-sm text-surface-400 leading-relaxed max-w-md">
                Paste text, CSV, or a URL and the AI extracts stats, builds timelines, and turns
                numbers into charts you can actually present.
              </p>
              <div className="mt-6 flex items-end gap-2 h-32 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                {FEAT_BARS.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md ${
                      i === FEAT_BARS.length - 1
                        ? "bg-gradient-to-t from-brand-600 to-emerald-400"
                        : "bg-gradient-to-t from-brand-900 to-brand-500"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <Palette className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">No design skills</span>
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Professional by default</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Cohesive palettes, clean grids, and premium typography — every single time.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-brand-300 mb-4">
                <Zap className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Fast generation</span>
              </div>
              <div className="font-display font-bold text-4xl text-white mb-2">~30s</div>
              <p className="text-sm text-surface-400 leading-relaxed">
                Three-step AI pipeline: analyze, blueprint, render. Ready before your coffee cools.
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.15}>
            <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <Download className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Export anywhere</span>
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Publish-ready files</h3>
              <p className="text-sm text-surface-400 leading-relaxed max-w-md mb-6">
                High-resolution exports that fit social, print, and decks. Download and go.
              </p>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <span
                    key={f}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-white/[0.05] border border-white/10 text-surface-200"
                  >
                    .{f.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-brand-300 mb-4">
                <Lock className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Bring your own key</span>
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Private by design</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Your API key and content never touch our servers. All generation runs on
                your chosen AI provider.
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.2}>
            <div className="card-glow rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-brand-300 mb-2 lg:mb-0">
                  <Layers className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Built for every use</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PURPOSE_CHIPS.map((p) => (
                    <span
                      key={p}
                      className="px-4 py-2 rounded-full text-sm bg-white/[0.04] border border-white/10 text-surface-200 hover:border-brand-400/40 hover:text-white transition-colors"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}