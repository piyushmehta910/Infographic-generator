"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize, ZoomIn, ZoomOut, RefreshCw, Eye, FileImage, FileJson, FileType,
  Loader2, AlertTriangle, Scaling, Square, History, ChevronDown, Download,
  FileText, Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AIDesignRenderer } from "@/components/templates/AIDesignRenderer";
import { AspectRatio, GenerationRevision } from "@/lib/types";

export type ExportFormat = "png" | "jpg" | "pdf" | "svg" | "json";

const EXPORT_FORMATS: { id: ExportFormat; label: string; hint: string; icon: typeof FileImage }[] = [
  { id: "png", label: "PNG", hint: "High-res image", icon: FileImage },
  { id: "jpg", label: "JPG", hint: "Compressed image", icon: FileImage },
  { id: "pdf", label: "PDF", hint: "Print / document", icon: FileText },
  { id: "svg", label: "SVG", hint: "Vector (editable)", icon: FileType },
  { id: "json", label: "JSON", hint: "Raw HTML markup", icon: FileJson },
];

interface CanvasViewProps {
  html: string | null;
  aspectRatio: AspectRatio;
  setAspectRatio?: (ar: AspectRatio) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onExport: (format: ExportFormat) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasContent: boolean;
  progress?: { label: string; elapsed: string } | null;
  onCancel?: () => void;
  error?: string | null;
  onRetry?: () => void;
  revisions?: GenerationRevision[];
  currentRevisionId?: string | null;
  onSelectRevision?: (rev: GenerationRevision) => void;
  /** Currently-exporting format (drives spinner + disabled state). */
  exporting?: ExportFormat | null;
  /** Ref to the renderer iframe, used to capture the live render. */
  frameRef?: React.MutableRefObject<HTMLIFrameElement | null>;
}

const ZOOM_MIN = 25;
const ZOOM_MAX = 300;

export default function CanvasView(p: CanvasViewProps) {
  const {
    html, aspectRatio, zoom, setZoom, onExport, onRegenerate,
    isGenerating, hasContent, progress, onCancel, error, onRetry,
    revisions = [], currentRevisionId, onSelectRevision,
    exporting = null, frameRef,
  } = p;

  const areaRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Close the export menu on outside click / Escape.
  useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (ev: MouseEvent) => {
      if (!exportBtnRef.current?.contains(ev.target as Node)) setExportOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  const handlePickExport = useCallback(
    (format: ExportFormat) => {
      setExportOpen(false);
      onExport(format);
    },
    [onExport],
  );

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

  return (
    <main id="generate-app" className="flex-1 overflow-auto flex flex-col bg-navy-950">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-4 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
          {/* Revisions history pills */}
          {revisions.length > 1 && (
            <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg p-0.5 border border-white/5 flex-shrink-0">
              <span className="text-[10px] font-semibold text-surface-400 px-1.5 flex items-center gap-1">
                <History className="w-3 h-3 text-brand-400" /> Rev
              </span>
              {revisions.map((rev, idx) => {
                const active = (currentRevisionId ? rev.revisionId === currentRevisionId : idx === revisions.length - 1);
                return (
                  <button
                    key={rev.revisionId}
                    type="button"
                    onClick={() => onSelectRevision?.(rev)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      active
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-surface-400 hover:text-surface-200 hover:bg-surface-700/50"
                    }`}
                    title={`Switch to Version ${idx + 1}: ${rev.prompt}`}
                  >
                    v{idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          {/* Zoom controls */}
          {html && (
            <div className="flex items-center gap-1 bg-surface-800/60 rounded-lg px-2 py-0.5 border border-white/5 flex-shrink-0">
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

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!hasContent || isGenerating} title="Regenerate">
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span className="ml-1">Regenerate</span>
          </Button>
          {html && (
              <div className="relative flex-shrink-0">
                <Button
                  ref={exportBtnRef}
                  variant="primary"
                  size="sm"
                  onClick={() => setExportOpen((o) => !o)}
                  disabled={Boolean(exporting)}
                  title="Export this infographic"
                  aria-haspopup="menu"
                  aria-expanded={exportOpen}
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="ml-1">
                    {exporting ? "Exporting…" : "Export"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                </Button>

                {exportOpen && (
                  <div
                    role="menu"
                    className="absolute top-full right-0 mt-2 z-30 w-56 rounded-xl border border-white/10 bg-surface-900/95 backdrop-blur-xl shadow-2xl p-1.5 origin-top-right animate-in"
                  >
                    <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                      Export as
                    </p>
                    {EXPORT_FORMATS.map((f) => {
                      const Icon = f.icon;
                      const isBusy = exporting === f.id;
                      return (
                        <button
                          key={f.id}
                          role="menuitem"
                          disabled={Boolean(exporting)}
                          onClick={() => handlePickExport(f.id)}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all ${
                            isBusy
                              ? "text-brand-300"
                              : "text-surface-200 hover:bg-white/5 hover:text-white disabled:opacity-40"
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            {isBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                            ) : (
                              <Icon className="w-4 h-4 text-surface-300" />
                            )}
                          </span>
                          <span className="flex-1 text-left min-w-0">
                            <span className="block text-sm font-medium">{f.label}</span>
                            <span className="block text-[11px] text-surface-500 truncate">{f.hint}</span>
                          </span>
                          {isBusy && <Check className="w-3.5 h-3.5 text-brand-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
          )}
        </div>
      </div>

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
          <>
            {error && !isGenerating && (
              <div className="w-full max-w-xl mx-auto mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-red-300">Regeneration failed</p>
                  <p className="mt-0.5 text-red-200/80 break-words">{error}</p>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-all flex-shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}
            <div
              style={{
                width: `${aspectRatio.width * (zoom / 100)}px`,
                height: `${aspectRatio.height * (zoom / 100)}px`,
              }}
              className="flex-shrink-0 relative my-auto"
            >
              <div
                style={{
                  width: `${aspectRatio.width}px`,
                  height: `${aspectRatio.height}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
                className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10 absolute top-0 left-0"
              >
                <AIDesignRenderer html={html} aspectRatio={aspectRatio} frameRef={frameRef} />
              </div>
            </div>
          </>
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
        <div className="sm:hidden flex-shrink-0 border-t border-white/5 px-4 py-3 flex items-center justify-center relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setExportOpen((o) => !o)}
            disabled={Boolean(exporting)}
            className="w-full max-w-xs"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-1">{exporting ? "Exporting…" : "Export"}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
          </Button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 w-56 rounded-xl border border-white/10 bg-surface-900/95 backdrop-blur-xl shadow-2xl p-1.5 origin-bottom-right animate-in"
            >
              <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                Export as
              </p>
              {EXPORT_FORMATS.map((f) => {
                const Icon = f.icon;
                const isBusy = exporting === f.id;
                return (
                  <button
                    key={f.id}
                    role="menuitem"
                    disabled={Boolean(exporting)}
                    onClick={() => handlePickExport(f.id)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      isBusy
                        ? "text-brand-300"
                        : "text-surface-200 hover:bg-white/5 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                      ) : (
                        <Icon className="w-4 h-4 text-surface-300" />
                      )}
                    </span>
                    <span className="flex-1 text-left min-w-0">
                      <span className="block text-sm font-medium">{f.label}</span>
                      <span className="block text-[11px] text-surface-500 truncate">{f.hint}</span>
                    </span>
                    {isBusy && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
