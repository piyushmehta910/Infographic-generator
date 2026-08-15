"use client";

import { Download, Maximize, ZoomIn, ZoomOut, RefreshCw, Eye, Monitor, Smartphone, Tablet, FileImage, FileJson, FileType, Settings } from "lucide-react";
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
    html, aspectRatio, setAspectRatio, zoom, setZoom, onExport, onRegenerate, isGenerating,
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
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 sm:p-6 lg:p-8">
        {html ? (
          <div
            className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/5"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <AIDesignRenderer html={html} aspectRatio={aspectRatio} />
          </div>
        ) : (
          <div className="text-center max-w-md mt-12 lg:mt-24">
            <div className="w-20 h-20 mx-auto bg-brand-gradient/10 rounded-3xl flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">Ready to create</h2>
            <p className="text-surface-400 text-sm leading-relaxed">
              Enter your content, choose a purpose, then click the{" "}
              <span className="text-brand-300 font-medium">Generate</span> button.
              The AI will analyze your input and design a beautiful infographic.
            </p>
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
