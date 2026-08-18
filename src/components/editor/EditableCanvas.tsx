"use client";

// ============================================================
// Phase 3.5/4.5: Editable Fabric.js canvas. The generated HTML is
// parsed into editable objects once (best-effort); from then on the
// user edits objects directly — no re-running Phase 3.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { buildFabricFromHTML } from "@/lib/editor/htmlToFabric";
import {
  exportCanvasPNG,
  exportCanvasJPG,
  exportCanvasSVG,
  exportCanvasPDF,
  exportCanvasJSON,
} from "@/lib/editor/export";
import {
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignCenterVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Lock,
  RefreshCw,
  Camera,
} from "lucide-react";

type FabricModule = typeof import("fabric");
type FabricCanvas = InstanceType<FabricModule["Canvas"]>;
type FabricObject = InstanceType<FabricModule["Object"]>;

interface EditableCanvasProps {
  html: string;
  width: number;
  height: number;
  canvasState?: unknown;
  rebuildToken?: number;
  onStateChange?: (state: unknown) => void;
  onThumbnail?: (dataUrl: string) => void;
  active?: boolean;
}

const HISTORY_LIMIT = 50;

export default function EditableCanvas({
  html,
  width,
  height,
  canvasState,
  rebuildToken = 0,
  onStateChange,
  onThumbnail,
  active = true,
}: EditableCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localBuildToken, setLocalBuildToken] = useState(0);
  const [busy, setBusy] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasSelection, setHasSelection] = useState(false);
  const [scale] = useState(() =>
    Math.min(900 / width, 620 / height, 1),
  );

  const scaledW = Math.round(width * scale);
  const scaledH = Math.round(height * scale);

  const saveHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      historyRef.current.push(JSON.stringify(c.toJSON()));
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
      redoRef.current = [];
      if (onStateChange) onStateChange(c.toJSON());
    }, 300);
  }, [onStateChange]);

// --- build / rebuild from HTML ---------------------------------
  const builtRef = useRef(false);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let attempts = 0;

    const run = async () => {
      const c = canvasRef.current;
      if (!c) {
        if (attempts++ < 100 && !cancelled) setTimeout(run, 100);
        return;
      }
      setBusy(true);

      if (!builtRef.current && canvasState) {
        // First build from persisted canvas state (project reopened in edit mode).
        try {
          c.clear();
          await c.loadFromJSON(canvasState as any);
          c.requestRenderAll();
        } catch {
          // Corrupt state — fall through to parsing from HTML.
          builtRef.current = false;
        }
      }
      if (!builtRef.current) {
        const { objects, warnings: w } = await buildFabricFromHTML(html, width, height);
        if (cancelled) return;
        c.clear();
        objects.forEach((o) => c.add(o));
        c.requestRenderAll();
        setWarnings(w);
        historyRef.current = [];
        redoRef.current = [];
        if (onStateChange) onStateChange(c.toJSON());
      }
      builtRef.current = true;
      setBusy(false);
    };
    run();

    return () => {
      cancelled = true;
    };
    // html/canvasState are read at build time (initial), rebuilds are explicit
    // via rebuildToken / localBuildToken so manual edits are never lost.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildToken, localBuildToken, active]);

  // --- canvas lifecycle ------------------------------------------
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

let disposed = false;
    (async () => {
      const { Canvas } = await import("fabric");
      if (disposed || !canvasElRef.current) return;

      const c = new Canvas(canvasElRef.current, {
        preserveObjectStacking: true,
        selection: true,
      });
      canvasRef.current = c;

      const onModified = () => saveHistory();
      c.on("object:modified", onModified);
      c.on("object:added", onModified);
      c.on("object:removed", onModified);
      c.on("object:moving", () => snapObjects(c));
      c.on("object:scaling", () => snapObjects(c));
      c.on("selection:created", () => setHasSelection(true));
      c.on("selection:updated", () => setHasSelection(true));
      c.on("selection:cleared", () => setHasSelection(false));
    })();

    return () => {
      disposed = true;
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function snapObjects(c: FabricCanvas) {
    c.getActiveObjects().forEach((o) => {
      o.set({
        left: Math.round(o.left / 8) * 8,
        top: Math.round(o.top / 8) * 8,
      });
    });
  }

  // --- toolbar actions -------------------------------------------
  const align = useCallback(
    (dir: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => {
      const c = canvasRef.current;
      if (!c) return;
      const objs = c.getActiveObjects();
      if (objs.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      objs.forEach((o) => {
        const b = o.getBoundingRect();
        minX = Math.min(minX, b.left);
        minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.left + b.width);
        maxY = Math.max(maxY, b.top + b.height);
      });
      objs.forEach((o) => {
        const b = o.getBoundingRect();
        switch (dir) {
          case "left": o.left = minX; break;
          case "centerX": o.left = minX + (maxX - minX) / 2 - b.width / 2; break;
          case "right": o.left = maxX - b.width; break;
          case "top": o.top = minY; break;
          case "centerY": o.top = minY + (maxY - minY) / 2 - b.height / 2; break;
          case "bottom": o.top = maxY - b.height; break;
        }
        o.setCoords();
      });
      c.requestRenderAll();
      saveHistory();
    },
    [saveHistory],
  );

  const duplicate = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    if (active.length === 0) return;
    const clones: FabricObject[] = [];
    for (const o of active) {
      const clone = await o.clone();
      clone.set({ left: (o.left ?? 0) + 24, top: (o.top ?? 0) + 24, selectable: true, evented: true });
      c.add(clone);
      clones.push(clone);
    }
c.discardActiveObject();
    const { ActiveSelection } = await import("fabric");
    const sel = new ActiveSelection(clones, { canvas: c });
    c.setActiveObject(sel);
    c.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const deleteSelected = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
    saveHistory();
  }, [saveHistory]);

  const toggleLock = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const objs = c.getActiveObjects();
    const anyLocked = objs.some((o) => o.lockMovementX);
    objs.forEach((o) => {
      o.lockMovementX = !anyLocked;
      o.lockMovementY = !anyLocked;
      o.lockScalingX = !anyLocked;
      o.lockScalingY = !anyLocked;
      o.lockRotation = !anyLocked;
      o.selectable = !anyLocked;
    });
    c.discardActiveObject();
    c.requestRenderAll();
    setHasSelection(false);
  }, []);

  const undo = useCallback(async () => {
    const c = canvasRef.current;
    if (!c || historyRef.current.length === 0) return;
    redoRef.current.push(JSON.stringify(c.toJSON()));
    const state = historyRef.current.pop();
    if (state) {
      await c.loadFromJSON(JSON.parse(state));
      c.requestRenderAll();
    }
  }, []);

  const redo = useCallback(async () => {
    const c = canvasRef.current;
    if (!c || redoRef.current.length === 0) return;
    historyRef.current.push(JSON.stringify(c.toJSON()));
    const state = redoRef.current.pop();
    if (state) {
      await c.loadFromJSON(JSON.parse(state));
      c.requestRenderAll();
    }
  }, []);

  const captureThumbnail = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !onThumbnail) return;
    const dataUrl = c.toDataURL({ format: "jpeg", quality: 0.5, multiplier: 0.5 });
    onThumbnail(dataUrl.length < 400_000 ? dataUrl : "");
  }, [onThumbnail]);

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "svg" | "pdf" | "json") => {
      const c = canvasRef.current;
      if (!c) return;
      switch (format) {
        case "png": await exportCanvasPNG(c, 2); break;
        case "jpg": await exportCanvasJPG(c, 2); break;
        case "svg": await exportCanvasSVG(c); break;
        case "pdf": await exportCanvasPDF(c, width, height); break;
        case "json": await exportCanvasJSON(c); break;
      }
    },
    [width, height],
  );

  const tb = "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-surface-300 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 bg-surface-800/60 rounded-xl p-1.5">
        <button className={tb} title="Undo" onClick={undo} disabled={!hasSelection && historyRef.current.length === 0}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button className={tb} title="Redo" onClick={redo}>
          <Redo2 className="w-4 h-4" />
        </button>
        <span className="w-px h-6 bg-white/10 mx-1" />
        <button className={tb} title="Align left" onClick={() => align("left")} disabled={!hasSelection}>
          <AlignLeft className="w-4 h-4" />
        </button>
        <button className={tb} title="Align center X" onClick={() => align("centerX")} disabled={!hasSelection}>
          <AlignCenterHorizontal className="w-4 h-4" />
        </button>
        <button className={tb} title="Align right" onClick={() => align("right")} disabled={!hasSelection}>
          <AlignRight className="w-4 h-4" />
        </button>
        <button className={tb} title="Align top" onClick={() => align("top")} disabled={!hasSelection}>
          <ArrowUp className="w-4 h-4" />
        </button>
        <button className={tb} title="Align middle Y" onClick={() => align("centerY")} disabled={!hasSelection}>
          <AlignCenterVertical className="w-4 h-4" />
        </button>
        <button className={tb} title="Align bottom" onClick={() => align("bottom")} disabled={!hasSelection}>
          <ArrowDown className="w-4 h-4" />
        </button>
        <span className="w-px h-6 bg-white/10 mx-1" />
        <button className={tb} title="Duplicate" onClick={duplicate} disabled={!hasSelection}>
          <Copy className="w-4 h-4" />
        </button>
        <button className={tb} title="Lock / unlock" onClick={toggleLock} disabled={!hasSelection}>
          <Lock className="w-4 h-4" />
        </button>
        <button className={tb} title="Delete" onClick={deleteSelected} disabled={!hasSelection}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
        <span className="w-px h-6 bg-white/10 mx-1" />
        <button
          className={tb}
          title="Re-parse from AI HTML (discards manual edits)"
          onClick={() => setLocalBuildToken((t) => t + 1)}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button className={tb} title="Capture thumbnail" onClick={captureThumbnail}>
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          {warnings.map((w) => (
            <div key={w}>• {w}</div>
          ))}
        </div>
      )}

      <div
        className="relative mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white"
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <canvas ref={canvasElRef} width={width} height={height} />
        </div>
        {busy && (
          <div className="absolute inset-0 bg-navy-950/70 flex items-center justify-center">
            <div className="text-sm text-surface-300">Parsing design into editable objects…</div>
          </div>
        )}
      </div>

      {!busy && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-gradient text-white hover:brightness-110"
            onClick={() => handleExport("png")}
          >
            PNG
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/70 text-surface-300 hover:text-white"
            onClick={() => handleExport("jpg")}
          >
            JPG
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/70 text-surface-300 hover:text-white"
            onClick={() => handleExport("svg")}
          >
            SVG
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/70 text-surface-300 hover:text-white"
            onClick={() => handleExport("pdf")}
          >
            PDF
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/70 text-surface-300 hover:text-white"
            onClick={() => handleExport("json")}
          >
            JSON
          </button>
          <span className="ml-auto text-[11px] text-surface-500">
            Double-click text to edit • drag to move • shift-drag to rotate
          </span>
        </div>
      )}
    </div>
  );
}

