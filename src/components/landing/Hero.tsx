"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Wand2,
  FileImage,
  ShieldCheck,
} from "lucide-react";

const BARS = [40, 65, 48, 78, 58, 90, 72];

const floatingChips = [
  { className: "top-6 -left-6", label: "AI Generated", icon: <Wand2 className="w-3.5 h-3.5 text-brand-300" />, delay: 0 },
  { className: "top-20 -right-8", label: "PNG ready", icon: <FileImage className="w-3.5 h-3.5 text-emerald-400" />, delay: 1.2 },
  { className: "bottom-8 -left-8", label: "100% yours", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, delay: 2 },
];

export function Hero() {
  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-grid [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full bg-brand-500/15 blur-[140px] animate-pulse-slow" />
        <div className="absolute top-1/3 -left-40 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[130px] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
          <div className="space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-400/25 bg-brand-500/10 text-brand-200 text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Infographic Generator
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight text-white text-balance"
            >
              Beautiful infographics <span className="text-gradient">in seconds</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-surface-300 leading-relaxed max-w-lg"
            >
              Turn blog posts, data, or rough ideas into publication-ready infographics.
              No design skills. No templates. Just your content and AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:brightness-110 hover:scale-[1.03] transition-all shadow-lg shadow-brand-500/30"
              >
                Start Creating Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-surface-200 font-medium text-sm hover:bg-white/5 hover:border-white/20 transition-all"
              >
                <PlayCircle className="w-4 h-4 text-brand-300" /> See how it works
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No account required. Bring your own AI key — nothing is stored on a server.
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Export to PNG, JPG, SVG, PDF, or JSON with one click.
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto max-w-xl">
              <div className="absolute -inset-6 rounded-[2rem] bg-brand-500/20 blur-3xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-navy-900/90 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="ml-2 text-[11px] text-surface-400 font-mono">infographic-preview.html</div>
                </div>

                <div className="p-5 sm:p-6 bg-gradient-to-br from-navy-800 via-navy-900 to-brand-950/60">
                  <div className="text-[10px] uppercase tracking-widest text-brand-300 font-semibold mb-1">Q3 Growth Report</div>
                  <div className="font-display font-bold text-white text-xl mb-4">Revenue is accelerating</div>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { value: "95%", label: "Effectiveness", color: "text-brand-300" },
                      { value: "3.2x", label: "Engagement", color: "text-emerald-400" },
                      { value: "200M+", label: "Users", color: "text-brand-200" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white/[0.05] border border-white/[0.06] p-3">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-surface-400 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-medium text-surface-300">Monthly growth</span>
                      <span className="text-[10px] text-emerald-400 font-medium">+214%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {BARS.map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                          className={`flex-1 rounded-t-md ${
                            i === BARS.length - 1
                              ? "bg-gradient-to-t from-brand-600 to-emerald-400"
                              : "bg-gradient-to-t from-brand-900 to-brand-500"
                          }`}
                          style={{ minHeight: 8 }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-surface-400">
                    <div className="flex -space-x-2">
                      {["bg-brand-500", "bg-emerald-500", "bg-pink-500"].map((c) => (
                        <div key={c} className={`w-6 h-6 rounded-full border-2 border-navy-900 ${c}`} />
                      ))}
                    </div>
                    Designed by AI · 1:1 · Modern theme
                  </div>
                </div>
              </div>

              {floatingChips.map((chip) => (
                <motion.div
                  key={chip.label}
                  className={`absolute ${chip.className} flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-800/90 border border-white/10 shadow-xl backdrop-blur-md text-xs font-medium text-surface-200 animate-float`}
                  style={{ animationDelay: `${chip.delay}s` }}
                >
                  {chip.icon} {chip.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}