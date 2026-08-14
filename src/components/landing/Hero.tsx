import { Play, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const TRUST = [
  "No credit card required",
  "5 free generations",
  "Export PNG/PDF",
];

const stats = [
  { value: "2,000+", label: "Creators" },
  { value: "50,000+", label: "Infographics" },
  { value: "4.9/5", label: "Rating" },
];

export default function Hero() {
  const brands = ["Brand", "Product", "Growth", "Design", "Marketing"];
  return (
    <section
      id="main-content"
      className="pt-24 pb-10 md:pt-32 md:pb-16 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-900/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-24 w-[28rem] h-96 rounded-full bg-emerald-900/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-indigo-900/20 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white text-balance leading-tight">
              Generate Data-Driven Infographics <br className="hidden sm:block" />
              in 30 Seconds — No Design Skills Needed
            </h1>
            <p className="mt-6 text-lg text-surface-300 max-w-2xl text-balance">
              Turn blog posts, CSV data, or rough ideas into publication-ready
              infographics. Used by 2,000+ marketers and educators.
            </p>

                      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="/generate"
              className="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 bg-brand-gradient text-white shadow-lg shadow-brand-900/40 hover:brightness-110 hover:scale-[1.02] h-14 px-8 text-lg touch-target"
            >
              Start Creating Free <Play className="w-5 h-5" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 glass-panel text-surface-100 border border-surface-400/20 hover:bg-white/10 h-14 px-8 text-lg touch-target"
            >
              <Play className="w-5 h-5" /> Watch Demo
            </a>
          </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-surface-400">
              {TRUST.map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="blur-3xl w-72 h-72 bg-brand-500/10 rounded-full" />
            </div>
            <div className="relative w-full max-w-sm">
              <div className="absolute -top-4 -right-4 -z-10">
                <Logo className="h-10 w-10 opacity-20" />
              </div>
              <div className="glass-panel rounded-3xl p-8 border border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center mb-6">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-xl text-white mb-3">
                  Generate in 30 seconds
                </h3>
                <p className="text-surface-300 text-sm mb-5">
                  Paste content, pick a style, and AI delivers a
                  publication-ready infographic.
                </p>
                <div className="space-y-2 text-xs text-surface-400">
                  {["AI content extraction", "12 smart layouts", "One-click export"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="social-proof"
        className="mt-24 pt-10 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap justify-center items-center gap-10 opacity-50">
              {brands.map((l) => (
                <div
                  key={l}
                  className="h-6 w-28 rounded bg-surface-400/30"
                />
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-12 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-surface-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
