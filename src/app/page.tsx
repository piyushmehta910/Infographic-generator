"use client";
import { ArrowRight, Sparkles, BarChart3, Palette, Zap, Image, Layout, Download, CheckCircle2, Github, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: "Data-Driven", desc: "Turn text, CSV, URLs into rich infographics." },
    { icon: <Palette className="w-5 h-5" />, title: "No Design Skills", desc: "AI handles layout, colors, and typography." },
    { icon: <Zap className="w-5 h-5" />, title: "Fast Generation", desc: "Get a publication-ready infographic in 30 seconds." },
    { icon: <Download className="w-5 h-5" />, title: "Export Anywhere", desc: "Download as PNG, JPG, PDF, SVG, or JSON." },
  ];
  const steps = [
    { step: "01", icon: <Image className="w-5 h-5" />, title: "Paste Content", desc: "Text, URL, CSV, or image." },
    { step: "02", icon: <Layout className="w-5 h-5" />, title: "Pick Style", desc: "Aspect ratio & design intent." },
    { step: "03", icon: <Sparkles className="w-5 h-5" />, title: "AI Generates", desc: "Analyzes, structures & designs." },
    { step: "04", icon: <Download className="w-5 h-5" />, title: "Export", desc: "PNG, PDF, SVG, or JSON." },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-surface-100 font-body overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-white">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-xs font-bold">IG</div>
            <span className="hidden sm:inline">InfoGraphic AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-surface-300">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="/generate" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-gradient text-white text-sm font-medium hover:brightness-110 transition-all"><Sparkles className="w-3.5 h-3.5" /> Create Free</Link>
          </nav>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-surface-300 hover:text-white" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-navy-950 p-4 flex flex-col gap-3 text-sm">
            <Link href="/#features" onClick={() => setMobileOpen(false)} className="text-surface-300 hover:text-white py-1">Features</Link>
            <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className="text-surface-300 hover:text-white py-1">How it works</Link>
            <Link href="/generate" onClick={() => setMobileOpen(false)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-gradient text-white font-medium mt-2"><Sparkles className="w-4 h-4" /> Create Free</Link>
          </div>
        )}
      </header>
<main>
        {/* Hero section */}
        <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 min-h-[85vh] flex items-center">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-[100px]" />
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-400/20 bg-brand-400/5 text-brand-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> AI-Powered Infographic Generator
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-balance">
                  Beautiful infographics <br />
                  <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-emerald-400 bg-clip-text text-transparent">in 30 seconds</span>
                </h1>
                <p className="text-base sm:text-lg text-surface-300 leading-relaxed max-w-lg">
                  Turn blog posts, data, or rough ideas into publication-ready infographics.
                  No design skills. Just your content and AI.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/generate" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-brand-500/25">
                    Start Creating Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/generate" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-surface-200 font-medium text-sm hover:bg-white/5 transition-all">
                    Watch Demo <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs text-surface-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No account required. Bring your own API key or use our built-in generator.
                </p>
              </div>
              <div className="relative hidden lg:block">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-navy-800 to-navy-900 shadow-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                      <div className="text-2xl font-bold text-brand-300">95%</div>
                      <div className="h-2 rounded-full bg-white/5 mt-2"><div className="w-[95%] h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" /></div>
                      <div className="text-xs text-surface-400 mt-2">Effectiveness</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                      <div className="text-2xl font-bold text-emerald-400">3.2x</div>
                      <div className="h-2 rounded-full bg-white/5 mt-2"><div className="w-[80%] h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" /></div>
                      <div className="text-xs text-surface-400 mt-2">Engagement</div>
                    </div>
                    <div className="col-span-2 rounded-xl bg-white/5 p-3 border border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-sm">📈</div>
                      <div className="flex-1 text-xs text-surface-300">Revenue grew 200% year-over-year, driven by new product lines and expanded market reach.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

{/* Features */}
        <section id="features" className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">Everything you need</h2>
              <p className="text-surface-400 max-w-xl mx-auto">AI handles the heavy lifting. You get a beautiful, data-rich infographic every time.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <div key={i} className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-brand-gradient/20 text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
                  <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-surface-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-16 sm:py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">How it works</h2>
              <p className="text-surface-400 max-w-xl mx-auto">Four simple steps from idea to finished infographic.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {steps.map((s, i) => (
                <div key={i} className="text-center p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="w-10 h-10 mx-auto rounded-full bg-brand-gradient/20 text-brand-400 flex items-center justify-center mb-3">{s.icon}</div>
                  <div className="text-xs font-bold text-brand-400 mb-1">{s.step}</div>
                  <h3 className="font-semibold text-white text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-surface-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">Ready to create your infographic?</h2>
            <p className="text-surface-400 mb-6">No templates. No design skills. Just your content and AI.</p>
            <Link href="/generate" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg shadow-brand-500/25">
              <Sparkles className="w-4 h-4" /> Start Creating Free
            </Link>
            <p className="text-xs text-surface-500 mt-4">Bring your own AI key or use our built-in generator. No credit card required.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-brand-gradient flex items-center justify-center text-[8px] font-bold">IG</div>
            <span>InfoGraphic AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Built with Next.js + Tailwind + AI</span>
            <a href="https://github.com/piyushmehta910/Infographic-generator" target="_blank" rel="noopener noreferrer" className="hover:text-surface-300 transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}