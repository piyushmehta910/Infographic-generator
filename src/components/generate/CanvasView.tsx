"use client";

import { Download, Maximize, ZoomIn, ZoomOut, RefreshCw, Eye } from "lucide-react";
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
    html,
    aspectRatio,
    setAspectRatio,
    zoom,
    setZoom,
    onExport,
    onRegenerate,
    isGenerating,
  } = p;

  return (
    <main
      id="generate-app"
      className="flex-1 overflow-auto flex flex-col bg-navy-950"
    >
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-surface-400">
            Canvas: {aspectRatio.label}
          </span>
          <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg p-1">
            {Object.values(ASPECT_RATIOS).slice(0, 6).map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar)}
                className={`px-3 py-1.5 rounded text-xs font-medium touch-target transition-all ${
                  aspectRatio.id === ar.id
                    ? "bg-brand-gradient text-white"
                    : "text-surface-400 hover:text-white"
                }`}
                title={ar.label}
              >
                {ar.ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={!html || isGenerating}
            title="Regenerate"
          >
            <RefreshCw className="w-4 h-5" />
          </Button>
          <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg px-2">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 10))}
              className="p-1.5 text-surface-300 hover:text-white touch-target"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-5" />
            </button>
            <span className="text-xs text-surface-300 w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 text-surface-300 hover:text-white touch-target"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 text-surface-300 hover:text-white touch-target"
              title="Fit"
            >
                            <Maximize className="w-4 h-5" />
            </button>
          </div>
          {html && (
            <Button variant="outline" size="sm" onClick={() => onExport("png")}>
              <Download className="w-4 h-5" /> PNG
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        {html ? (
          <div
            className="shadow-2xl rounded-xl overflow-hidden"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <AIDesignRenderer html={html} aspectRatio={aspectRatio} />
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto bg-brand-gradient/10 rounded-3xl flex items-center justify-center mb-6">
              <Eye className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">
              Ready to create
            </h2>
            <p className="text-surface-300 text-sm">
              Enter your content and pick a purpose, then click Generate in the
              left panel.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
