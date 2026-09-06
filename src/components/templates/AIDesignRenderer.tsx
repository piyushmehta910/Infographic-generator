"use client";

import React, { useCallback, useRef } from "react";
import { AspectRatio } from "@/lib/types";

interface AIDesignRendererProps {
  html: string;
  aspectRatio: AspectRatio;
}

/**
 * Renders AI-generated HTML at the exact canvas size inside a sandboxed
 * iframe. If the generated content is taller/wider than the canvas (models
 * sometimes overflow despite server-side enforcement), the body is scaled
 * down with a transform so EVERYTHING stays visible instead of being
 * silently clipped.
 */
export const AIDesignRenderer: React.FC<AIDesignRendererProps> = ({
  html,
  aspectRatio,
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const fitToFrame = useCallback(() => {
    try {
      const doc = frameRef.current?.contentDocument;
      if (!doc || !doc.body) return;

      const measure = () => {
        const docEl = doc.documentElement;
        const overflowX = docEl.scrollWidth > aspectRatio.width;
        const overflowY = docEl.scrollHeight > aspectRatio.height;
        if (!overflowX && !overflowY) {
          doc.body.style.transform = "";
          doc.body.style.width = "";
          return;
        }
        let scale = Math.min(
          aspectRatio.width / docEl.scrollWidth,
          aspectRatio.height / docEl.scrollHeight,
        );
        scale = Math.max(Math.min(scale, 1), 0.05);
        // Widen the body so the scaled content still fills the canvas width
        // (transform shrinks visually but layout width stays behind it).
        doc.body.style.width = `${aspectRatio.width / scale}px`;
        // Content may reflow wider → re-measure height once and adjust.
        const sh2 = docEl.scrollHeight;
        if (sh2 > aspectRatio.height / scale) {
          scale = Math.max((aspectRatio.height / sh2) * scale, 0.05);
          doc.body.style.width = `${aspectRatio.width / scale}px`;
        }
        doc.body.style.transformOrigin = "top left";
        doc.body.style.transform = `scale(${scale})`;
      };

      // Measure after layout, after webfonts, and once more as a safety net.
      measure();
      doc.fonts?.ready.then(measure).catch(() => {});
      const t = setTimeout(measure, 400);
      return () => clearTimeout(t);
    } catch {
      /* same-origin srcDoc — never expected to throw; ignore */
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
        ref={frameRef}
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
