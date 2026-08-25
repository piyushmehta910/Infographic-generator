"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize, ZoomIn, ZoomOut, RefreshCw, Eye, FileImage, FileJson, FileType,
  Loader2, AlertTriangle, Scaling, Square,
} from "lucide-react";
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
  hasContent: boolean;
  progress?: { label: string; elapsed: string } | null;
  onCancel?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const DIM_MIN = 200;
const DIM_MAX = 4000;

export default function CanvasView(p: CanvasViewProps) {
  const {
    html, aspectRatio, setAspectRatio, zoom, setZoom, onExport, onRegenerate,
    isGenerating, hasContent, progress, onCancel, error, onRetry,
  } = p;

  const areaRef = useRef<HTMLDivElement>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState(800);
  const [customH, setCustomH] = useState(800);

  const exportOptions = [
    { id: "png" as const, label: "PNG", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "jpg" as const, label: "JPG", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "svg" as const, label: "SVG", icon: <FileType className="w-3.5 h-3.5" /> },
    { id: "pdf" as const, label: "PDF", icon: <FileImage className="w-3.5 h-3.5" /> },
    { id: "json" as const, label: "JSON", icon: <FileJson className="w-3.5 h-3.5" /> },
  ];

  /** Scale the canvas to fill the visible area (clamped). */
  const fitToView = useCallback(() => {
    const area = areaRef.current;
    if (!area || !html) return;
    const pad = 48;
    const scale = Math.min(
      Math.max((area.clientWidth - pad) / aspectRatio.width, 0),
      Math.max((area.clientHeight - pad) / aspectRatio.height, 0),
    );
    if (scale > 0) {
      setZoom(Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale * 100))));
    }
  }, [html, aspectRatio.width, aspectRatio.height, setZoom]);

  // Fit whenever a fresh infographic arrives.
  useEffect(() => {
    if (!html) return;
    const raf = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(raf);
  }, [html, fitToView]);

  // Ctrl/⌘ + wheel zooms (native listener so we can preventDefault).
  useEffect(() => {
    const area = areaRef.current;
    if (!area || !html) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const next = zoom + (e.deltaY < 0 ? 10 : -10);
      setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, [html, zoom, setZoom]);

  const applyCustom = () => {
    const w = Math.round(customW);
    const h = Math.round(customH);
    if (w < DIM_MIN || w > DIM_MAX || h < DIM_MIN || h > DIM_MAX) return;
    setAspectRatio({
      id: "custom",
      label: `Custom ${w}×${h}`,
      ratio: `${(w / gcd(w, h)).toFixed(w % h === 0 ? 0 : 2)}:${(h / gcd(w, h)).toFixed(h % w === 0 ? 0 : 2)}`,
      width: w,
      height: h,
    });
    setCustomOpen(false);
  };

  const customInvalid =
    customW < DIM_MIN || customW > DIM_MAX || customH < DIM_MIN || customH > DIM_MAX;

  return (
    <main id="generate-app" className="flex-1 overflow-auto flex flex-col bg-navy-950">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 py-3 flex items-center justify-between gap-4 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {/* Aspect ratio presets — every preset reachable, plus custom size */}
          <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg p-0.5 overflow-x-auto max-w-full">
            {Object.values(ASPECT_RATIOS)
              .filter((ar) => ar.id !== "custom")
              .map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar)}
                  aria-pressed={aspectRatio.id === ar.id}
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
            <button
              onClick={() => {
                if (aspectRatio.id === "custom" && !customOpen) return;
                setCustomOpen((v) => !v);
              }}
              aria-pressed={aspectRatio.id === "custom"}
              className={`px-2.5 py-1.5 rounded text-[11px] font-medium touch-target transition-all whitespace-nowrap ${
                aspectRatio.id === "custom"
                  ? "bg-brand-gradient text-white shadow-sm"
                  : "text-surface-400 hover:text-white"
              }`}
              title="Custom pixel size"
            >
              Custom
            </button>
          </div>

          {/* Zoom controls */}
          {html && (
            <div className="hidden md:flex items-center gap-1 bg-surface-800/60 rounded-lg px-2 py-0.5">
              <button onClick={() => p.setZoom(Math.max(ZOOM_MIN, zoom - 10))} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-surface-300 w-10 text-center font-medium">{zoom}%</span>
              <button onClick={() => p.setZoom(Math.min(ZOOM_MAX, zoom + 10))} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={fitToView} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Fit to view">
                <Scaling className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => p.setZoom(100)} className="p-1.5 text-surface-400 hover:text-white touch-target" title="Actual size (100%)">
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!hasContent || isGenerating} title="Regenerate">
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

      {/* Custom size row */}
      {customOpen && (
        <div className="flex-shrink-0 border-b border-white/5 px-4 py-2.5 flex flex-wrap items-center gap-3 bg-navy-950/80">
          <span className="text-xs font-semibold text-surface-300">Canvas size (px)</span>
          <label className="flex items-center gap-1.5 text-xs text-surface-400">
            W
            <input
              type="number"
              min={DIM_MIN}
              max={DIM_MAX}
              value={customW}
              onChange={(e) => setCustomW(parseInt(e.target.value, 10) || 0)}
              aria-label="Custom width in pixels"
              className={`w-20 px-2 py-1.5 bg-navy-900 border rounded-lg text-xs text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                customW < DIM_MIN || customW > DIM_MAX ? "border-red-400/60" : "border-white/10"
              }`}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-surface-400">
            H
            <input
              type="number"
              min={DIM_MIN}
              max={DIM_MAX}
              value={customH}
              onChange={(e) => setCustomH(parseInt(e.target.value, 10) || 0)}
              aria-label="Custom height in pixels"
              className={`w-20 px-2 py-1.5 bg-navy-900 border rounded-lg text-xs text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                customH < DIM_MIN || customH > DIM_MAX ? "border-red-400/60" : "border-white/10"
              }`}
            />
          </label>
          <button
            onClick={applyCustom}
            disabled={customInvalid}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-gradient text-white disabled:opacity-40"
          >
            Apply
          </button>
          <span className={`text-[11px] ${customInvalid ? "text-red-300" : "text-surface-500"}`}>
            {customInvalid ? `${DIM_MIN}–${DIM_MAX}px allowed` : "Tip: Ctrl/⌘ + scroll to zoom"}
          </span>
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={areaRef}
        className="relative flex-1 overflow-auto flex items-start justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_60%)]"
      >
        {error && !html ? (
          <div className="text-center max-w-md mt-8 lg:mt-16">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-xl" />
              <div className="relative w-20 h-20 mx-auto bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-400/30">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">Generation failed</h2>
            <p className="text-red-200/90 text-sm leading-relaxed mb-6 break-words">{error}</p>
            <div className="flex items-center justify-center gap-3">
              {onRetry && (
                <Button onClick={onRetry}>
                  <RefreshCw className="w-4 h-4" />
                  <span className="ml-1">Try again</span>
                </Button>
              )}
            </div>
            <p className="text-xs text-surface-500 mt-6">
              Check your API key in Settings, or pick a different provider.
            </p>
          </div>
        ) : html ? (
          <div
            className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10"
            style={{ zoom: zoom / 100 }}
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
              Enter your content, then hit{" "}
              <span className="text-brand-300 font-medium">Generate</span>. The AI analyzes
              your input and designs a publication-ready infographic.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["Paste your text", "Hit Generate"].map((hint, i) => (
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

        {/* Regeneration overlay — keeps the previous design visible underneath */}
        {isGenerating && html && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950/70 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <p className="text-sm font-medium text-surface-100" aria-live="polite">
                {progress?.label ?? "Working…"}
              </p>
              <p className="text-xs tabular-nums text-surface-500">{progress?.elapsed}</p>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-400/40 text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <Square className="w-3 h-3 fill-current" /> Cancel
                </button>
              )}
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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
