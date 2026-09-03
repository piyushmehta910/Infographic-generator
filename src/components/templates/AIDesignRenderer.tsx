"use client";

import React from "react";
import { AspectRatio } from "@/lib/types";

interface AIDesignRendererProps {
  html: string;
  aspectRatio: AspectRatio;
}

export const AIDesignRenderer: React.FC<AIDesignRendererProps> = ({
  html,
  aspectRatio,
}) => {
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
        srcDoc={html}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "hidden",
        }}
        title="AI Generated Infographic"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default AIDesignRenderer;
