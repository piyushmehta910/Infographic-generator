"use client";

import { RefreshCw, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { BUILT_IN_TEMPLATES } from "@/services/template/templateEngine";
import { TemplateConfig } from "@/lib/types";

interface StylePanelProps {
  layout: string;
  setLayout: (id: string) => void;
  density: "compact" | "balanced" | "spacious";
  setDensity: (d: "compact" | "balanced" | "spacious") => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasContent: boolean;
}

const themes = [
  { id: "dark", name: "Dark", colors: ["#0f172a", "#8b5cf6", "#10b981"] },
  { id: "bold", name: "Bold", colors: ["#0f172a", "#ec4899", "#f59e0b"] },
  { id: "minimal", name: "Minimal", colors: ["#0f172a", "#6473ff", "#cbd5e1"] },
  { id: "creative", name: "Creative", colors: ["#0f172a", "#a78bfa", "#14b8a0"] },
  { id: "corporate", name: "Corporate", colors: ["#0f172a", "#3b82f6", "#94a3b8"] },
];

const fonts = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "playful", name: "Playful" },
];

const densities: { id: "compact" | "balanced" | "spacious"; name: string }[] = [
  { id: "compact", name: "Compact" },
  { id: "balanced", name: "Balanced" },
  { id: "spacious", name: "Spacious" },
];

export default function StylePanel(p: StylePanelProps) {
  const { layout, setLayout, density, setDensity, onRegenerate, isGenerating, hasContent } = p;
  const templates: TemplateConfig[] = BUILT_IN_TEMPLATES;
  return (
    <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 overflow-y-auto border-l border-white/5">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white">Style</h2>
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!hasContent || isGenerating} title="Regenerate layout">
            <RefreshCw className="w-4 h-5" /> Regenerate
          </Button>
        </div>
        {/* Layout selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Layout</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => setLayout(t.id)}
                className={`group relative rounded-lg border-2 transition-all touch-target ${
                  layout === t.id ? "border-brand-400 bg-brand-900/20" : "border-surface-700 hover:border-surface-500"
                }`}
                title={t.name}
              >
                <div className="aspect-[4/3] bg-surface-800 rounded flex items-center justify-center">
                  <span className="text-[10px] text-surface-400 group-hover:text-surface-200">{t.name}</span>
                </div>
                {layout === t.id && <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gradient rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        {/* Color theme */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Color theme</label>
          <div className="flex flex-col gap-2">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => setLayout(th.id)}
                className="flex items-center gap-3 text-left p-2 rounded-lg hover:bg-surface-800/50 transition-colors touch-target"
              >
                <div className="flex gap-1">
                  {th.colors.map((c) => (
                    <span key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-sm text-surface-200">{th.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Typography</label>
          <div className="flex flex-wrap gap-2">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => setLayout(f.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium touch-target bg-surface-800/60 text-surface-200 hover:text-white hover:bg-surface-800 transition-colors"
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Density</label>
          <div className="flex gap-1 bg-surface-800/60 p-1 rounded-xl">
            {densities.map((d) => (
              <button
                key={d.id}
                onClick={() => setDensity(d.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium touch-target transition-all ${
                  density === d.id ? "bg-brand-gradient text-white" : "text-surface-400 hover:text-white"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className="mt-4 p-4 border-white/5">
          <div className="flex items-center gap-3 text-sm text-surface-200">
            <LayoutGrid className="w-5 h-5 text-brand-400" />
            <span>
              {hasContent ? "Style changes apply to the next generation." : "Pick a style before generating."}
            </span>
          </div>
                </GlassCard>
      </div>
    </aside>
  );
}
