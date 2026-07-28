"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  InfographicContent,
  Theme,
  AspectRatio,
  TemplateSettings,
} from "@/lib/types";
import { BlankTemplate } from "./BlankTemplate";

const templateComponents: Record<string, React.FC<any>> = {
  blank: BlankTemplate,
};

interface TemplateRendererProps {
  content: InfographicContent;
  theme: Theme;
  aspectRatio: AspectRatio;
  settings: TemplateSettings;
  templateId: string;
  onElementClick?: (elementId: string) => void;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  templateId,
  onElementClick,
}) => {
  const TemplateComponent = templateComponents[templateId] || BlankTemplate;

  // Calculate scale to fit within the preview container
  // Use a fixed container size for preview - the canvas inner size is the aspect ratio
  const MAX_PREVIEW_WIDTH = 750;
  const MAX_PREVIEW_HEIGHT = 550;

  const scale = useMemo(() => {
    const widthScale = MAX_PREVIEW_WIDTH / aspectRatio.width;
    const heightScale = MAX_PREVIEW_HEIGHT / aspectRatio.height;
    return Math.min(widthScale, heightScale, 1);
  }, [aspectRatio.width, aspectRatio.height]);

  const scaledWidth = aspectRatio.width * scale;
  const scaledHeight = aspectRatio.height * scale;

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        position: "relative",
        overflow: "hidden",
        borderRadius: `${settings.roundedCorners}px`,
        boxShadow: settings.shadow
          ? `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.15)`
          : "0 4px 20px rgba(0,0,0,0.1)",
        border: settings.border ? `1px solid ${theme.colors.border}` : "none",
      }}
      className="template-canvas-container"
    >
      <div
        style={{
          width: `${aspectRatio.width}px`,
          height: `${aspectRatio.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        className="template-canvas"
        id="infographic-canvas"
      >
        <TemplateComponent
          content={content}
          theme={theme}
          aspectRatio={aspectRatio}
          settings={settings}
          onElementClick={onElementClick}
        />
      </div>
    </div>
  );
};

export default TemplateRenderer;
