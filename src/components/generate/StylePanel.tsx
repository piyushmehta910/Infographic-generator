"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeId } from "@/lib/types";

interface StylePanelProps {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  density: "compact" | "balanced" | "spacious";
  setDensity: (d: "compact" | "balanced" | "spacious") => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasContent: boolean;
}

const THEME_OPTIONS: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: "modern", name: "Modern", colors: ["#8b5cf6", "#6366f1", "#0f172a"] },
  { id: "dark", name: "Dark", colors: ["#0f172a", "#334155", "#8b5cf6"] },
  { id: "light", name: "Light", colors: ["#f8fafc", "#e2e8f0", "#6366f1"] },
  { id: "minimal", name: "Minimal", colors: ["#ffffff", "#e2e8f0", "#0f172a"] },
  { id: "corporate", name: "Corporate", colors: ["#1e293b", "#3b82f6", "#94a3b8"] },
  { id: "gradient", name: "Gradient", colors: ["#7c3aed", "#ec4899", "#f59e0b"] },
  { id: "midnight-blue", name: "Midnight Blue", colors: ["#0b1e3a", "#1e40af", "#60a5fa"] },
  { id: "glassmorphism", name: "Glassmorphism", colors: ["#1e293b", "#8b5cf6", "#c4b5fd"] },
  { id: "material", name: "Material", colors: ["#263238", "#00bcd4", "#ff9800"] },
  { id: "neumorphism", name: "Neumorphism", colors: ["#e0e5ec", "#a3b1c6", "#5b6770"] },
];

const DENSITY_OPTIONS: { id: "compact" | "balanced" | "spacious"; name: string }[] = [
  { id: "compact", name: "Compact" },
  { id: "balanced", name: "Balanced" },
  { id: "spacious", name: "Spacious" },
];

export default function StylePanel(p: StylePanelProps) {
  const { theme, setTheme, density, setDensity, onRegenerate, isGenerating, hasContent } = p;

  return (
    <aside className="w-72 xl:w-80 flex-shrink-0 overflow-y-auto border-l border-white/5 bg-surface-900/60">
      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white">Design</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={!hasContent || isGenerating}
            title="Regenerate layout"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline ml-1">Regenerate</span>
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Color theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all touch-target ${
                  theme === th.id
                    ? "border-brand-400 bg-brand-900/20"
                    : "border-surface-700 hover:border-surface-500"
                }`}
                title={th.name}
              >
                <div className="flex -space-x-1">
                  {th.colors.map((c) => (
                    <span
                      key={c}
                      className="w-4 h-4 rounded-full ring-2 ring-surface-900"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-surface-200 truncate">{th.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Density
          </label>
          <div className="flex gap-1 bg-surface-800/60 p-1 rounded-xl">
            {DENSITY_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDensity(d.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium touch-target transition-all ${
                  density === d.id
                    ? "bg-brand-gradient text-white"
                    : "text-surface-400 hover:text-white"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-surface-500 leading-relaxed">
            Design and density changes apply to the next generation.
          </p>
        </div>
      </div>
    </aside>
  );
}