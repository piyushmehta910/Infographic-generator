"use client";

import { Maximize, ZoomIn, ZoomOut, RefreshCw, Eye, FileImage, FileJson, FileType } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AIDesignRenderer } from "@/components/templates/AIDesignRenderer";
import { AspectRatio } from "@/lib/types";
import { ASPECT_RATIOS } from "@/lib/constants";

interface CanvasViewProps {
  html: string | null;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onExport: (format: "png" | "jpg" | "pdf" | "svg" | "json") => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function CanvasView(p: CanvasViewProps) {
  const {
    html, aspectRatio, setAspectRatio, zoom, onExport, onRegenerate, isGenerating,
  } = p;

  const exportOptions = [
    { id: "png" as const, label: "PNG", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "jpg" as const, label: "JPG", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "svg" as const, label: "SVG", icon: <FileType className="w-3.5 h-3.5" /> },
    { id: "pdf" as const, label: "PDF", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "json" as const, label: "JSON", icon: <FileJson className="w-3.5 h-3.5" /> },
  ];

  return (
    <main id="generate-app" className="flex-1 overflow-auto flex flex-col bg-navy-950">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 py-3 flex items-center justify-between gap-4 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Aspect ratio presets */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-800/60 rounded-lg p-0.5">
            {Object.values(ASPECT_RATIOS).slice(0, 6).map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-medium touch-target transition-all ${
                  aspectRatio.id === ar.id
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-surface-400 hover:text-white"
                }`}
                title={ar.label}
              >
                {ar.ratio}
              </button>
            ))}
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg px-2 py-0.5">
            <button onClick={() => p.setZoom(Math.max(25, zoom - 10))} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Zoom out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-surface-300 w-10 text-center font-medium">{zoom}%</span>
            <button onClick={() => p.setZoom(Math.min(200, zoom + 10))} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Zoom in">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => p.setZoom(100)} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Fit 100%">
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!html || isGenerating} title="Regenerate">
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1">Regenerate</span>
          </Button>
          {html && (
            <div className="flex items-center gap-1">
              <div className="h-6 w-px bg-white/5" />
              {exportOptions.map((opt) => (
                <Button key={opt.id} variant="ghost" size="sm" onClick={() => onExport(opt.id)} title={`Export as ${opt.label}`}>
                  {opt.icon}
                  <span className="hidden sm:inline ml-1">{opt.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_60%)]">
        {html ? (
          <div
            className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <AIDesignRenderer html={html} aspectRatio={aspectRatio} />
          </div>
        ) : (
          <div className="text-center max-w-md mt-8 lg:mt-16">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-brand-gradient/20 blur-xl" />
              <div className="relative w-20 h-20 mx-auto bg-brand-gradient/10 rounded-3xl flex items-center justify-center border border-brand-400/20">
                <Eye className="w-8 h-8 text-brand-400" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-3">Ready to create</h2>
            <p className="text-surface-400 text-sm leading-relaxed mb-8">
              Enter your content, pick a purpose, then hit{" "}
              <span className="text-brand-300 font-medium">Generate</span>. The AI analyzes
              your input and designs a publication-ready infographic.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["Paste your text", "Pick a purpose", "Hit Generate"].map((hint, i) => (
                <div key={hint} className="flex items-center gap-2">
                  {i > 0 && <div className="h-px w-4 bg-surface-700" />}
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-800/70 text-surface-300 border border-white/5">
                    {hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile export bar */}
      {html && (
        <div className="sm:hidden flex-shrink-0 border-t border-white/5 px-4 py-3 flex items-center justify-center gap-2">
          {exportOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onExport(opt.id)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-surface-800/60 text-surface-300 hover:text-white transition-all"
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
