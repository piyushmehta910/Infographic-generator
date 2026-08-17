"use client";

import { Megaphone, GraduationCap, LineChart, Rocket } from "lucide-react";
import { Reveal } from "./Reveal";

const USE_CASES = [
  {
    icon: <Megaphone className="w-5 h-5" />,
    title: "Marketers",
    desc: "Social posts and campaign visuals in your brand's colors, ready in seconds.",
    color: "text-brand-300",
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "Educators",
    desc: "Turn dense lessons into clean, memorable study visuals and explainers.",
    color: "text-emerald-400",
  },
  {
    icon: <LineChart className="w-5 h-5" />,
    title: "Analysts",
    desc: "Transform reports and spreadsheets into charts stakeholders actually read.",
    color: "text-brand-200",
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "Founders",
    desc: "Pitch decks, one-pagers, and product explainers without a designer.",
    color: "text-emerald-300",
  },
];

export function UseCases() {
  return (
    <section className="py-16 sm:py-24 border-t border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-surface-300 mb-4">
            <Rocket className="w-3.5 h-3.5 text-brand-300" /> Who it&apos;s for
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight text-balance">
            Built for <span className="text-gradient">everyone who communicates</span>
          </h2>
          <p className="text-surface-400 mt-4 leading-relaxed">
            If you have a message and an audience, you have a use case.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.title} delay={i * 0.08}>
              <div className="card-glow h-full rounded-2xl border border-white/[0.06] bg-navy-950/60 p-6">
                <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 ${u.color}`}>
                  {u.icon}
                </div>
                <h3 className="font-semibold text-white mb-1.5">{u.title}</h3>
                <p className="text-xs text-surface-400 leading-relaxed">{u.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}