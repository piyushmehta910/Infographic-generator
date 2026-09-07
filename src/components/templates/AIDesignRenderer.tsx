"use client";

import React, { useCallback, useRef } from "react";
import { AspectRatio } from "@/lib/types";

interface AIDesignRendererProps {
  html: string;
  aspectRatio: AspectRatio;
  /** Optional ref to the inner iframe so the parent can capture the live render for export. */
  frameRef?: React.MutableRefObject<HTMLIFrameElement | null>;
}

/**
 * Renders AI-generated HTML inside a canvas-sized iframe. The model is asked
 * to produce an exact W×H design, but output often comes back smaller or
 * larger than the canvas. This fits the rendered content to the frame in a
 * CONTAIN style (never crops content): it measures the real content extents
 * and applies a uniform CSS transform (scale up small designs, scale down big
 * ones), then paints the iframe background to the design's own background so
 * any letterbox blends in instead of showing stark white bars.
 */
export const AIDesignRenderer: React.FC<AIDesignRendererProps> = ({
  html,
  aspectRatio,
  frameRef,
}) => {
  const ownFrameRef = useRef<HTMLIFrameElement>(null);
  const activeRef = frameRef ?? ownFrameRef;

  const fitToFrame = useCallback(() => {
    try {
      const doc = activeRef.current?.contentDocument;
      if (!doc || !doc.body) return;

      const root = doc.documentElement;
      const body = doc.body;
      const W = aspectRatio.width;
      const H = aspectRatio.height;

      // Measure the TRUE content extents. The enforceCanvas lock pins body to
      // W×H with overflow:hidden, which hides both overflow AND underfill.
      // Temporarily release the clip so children give real natural bounds.
      body.style.setProperty("transform", "none", "important");
      root.style.setProperty("overflow", "visible", "important");

      const extents = (): { w: number; h: number } => {
        let maxX = 0;
        let maxY = 0;
        let meaningful = 0;
        for (const el of Array.from(body.children)) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 || r.height > 0) {
            maxX = Math.max(maxX, r.right);
            maxY = Math.max(maxY, r.bottom);
            meaningful++;
          }
        }
        // Purely measure child extents — do NOT clamp to root.clientWidth
        // (which is pinned to the canvas), otherwise width underfill is
        // never detected. The scroll-size fallback is used only when there
        // are no meaningful children (e.g. an empty design).
        return {
          w: Math.max(meaningful ? maxX : root.scrollWidth, 1),
          h: Math.max(meaningful ? maxY : root.scrollHeight, 1),
        };
      };

      const apply = () => {
        // Release the clip + transform each pass so measurements always see
        // NATURAL (untransformed) extents — re-measure after webfont/load
        // would otherwise double-apply the scale.
        body.style.setProperty("transform", "none", "important");
        root.style.setProperty("overflow", "visible", "important");

        const { w, h } = extents();
        // Uniform contain-fit: never crop, fill as much of the frame as the
        // design's aspect allows (both up-scaling and down-scaling).
        let scale = Math.min(W / w, H / h);
        scale = Math.max(Math.min(scale, 2), 0.05);

        const isIdentity = Math.abs(scale - 1) <= 0.005;
        body.style.setProperty("transform-origin", "0 0", "important");
        if (isIdentity) {
          body.style.removeProperty("transform");
        } else {
          body.style.setProperty("transform", `scale(${scale})`, "important");
        }
        root.style.setProperty("overflow", "hidden", "important");

        // Blend any letterbox into the design instead of stark white. Dig for
        // a non-transparent background: body, then its first-layer children.
        let bg = getComputedStyle(body).backgroundColor;
        if (!bg || /rgba\(0, 0, 0, 0\)/.test(bg)) {
          for (const el of Array.from(body.children)) {
            const c = getComputedStyle(el).backgroundColor;
            if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) {
              bg = c;
              break;
            }
          }
        }
        if (bg && !/rgba\(0, 0, 0, 0\)/.test(bg)) {
          root.style.setProperty("background", bg, "important");
        } else if (w < W || h < H) {
          root.style.setProperty("background", "#ffffff", "important");
        }
      };

      apply();
      doc.fonts?.ready.then(apply).catch(() => {});
      // Re-measure a few times to settle webfont-driven reflow.
      [120, 400].forEach((ms) => setTimeout(apply, ms));
    } catch {
      /* same-origin srcDoc; ignore */
    }
  }, [aspectRatio.width, aspectRatio.height]);

  return (
    <div
      style={{
        width: `${aspectRatio.width}px`,
        height: `${aspectRatio.height}px`,
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        background: "#ffffff",
      }}
      className="template-canvas-container"
    >
      <iframe
        ref={activeRef}
        srcDoc={html}
        onLoad={fitToFrame}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "hidden",
        }}
        title="AI Generated Infographic"
      />
    </div>
  );
};

export default AIDesignRenderer;
