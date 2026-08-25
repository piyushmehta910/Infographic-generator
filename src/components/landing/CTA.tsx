"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-400/20 bg-gradient-to-br from-brand-950/80 via-navy-900 to-navy-950 p-10 sm:p-16 text-center">
            <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-brand-500/20 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 w-[320px] h-[320px] rounded-full bg-emerald-500/15 blur-[110px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Free to start
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight text-balance mb-4">
                Your next infographic is <span className="text-gradient">one paste away</span>
              </h2>
              <p className="text-surface-300 max-w-xl mx-auto mb-8 leading-relaxed">
                No templates, no design skills, no sign-up. Paste your content and let AI design
                it beautifully.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/generate"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:brightness-110 hover:scale-[1.03] transition-all shadow-lg shadow-brand-500/30"
                >
                  Start Creating Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-surface-200 font-medium text-sm hover:bg-white/5 transition-all"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}