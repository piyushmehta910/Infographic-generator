'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InfographicContent, Theme, AspectRatio, TemplateSettings } from '@/lib/types';
import { ModernTemplate } from './ModernTemplate';
import { BusinessTemplate } from './BusinessTemplate';
import { TimelineTemplate } from './TimelineTemplate';

const templateComponents: Record<string, React.FC<any>> = {
  modern: ModernTemplate,
  business: BusinessTemplate,
  timeline: TimelineTemplate,
  comparison: ModernTemplate,
  education: ModernTemplate,
  medical: ModernTemplate,
  technology: ModernTemplate,
  startup: ModernTemplate,
  marketing: ModernTemplate,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableSpace, setAvailableSpace] = useState({ width: 800, height: 600 });
  const TemplateComponent = templateComponents[templateId] || ModernTemplate;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setAvailableSpace({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    return Math.min(
      availableSpace.width / aspectRatio.width,
      availableSpace.height / aspectRatio.height,
      1
    );
  }, [aspectRatio.width, aspectRatio.height, availableSpace.height, availableSpace.width]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
      className="template-canvas-wrapper flex items-center justify-center overflow-auto"
    >
      <div
        style={{
          width: `${aspectRatio.width}px`,
          height: `${aspectRatio.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
          borderRadius: `${settings.roundedCorners}px`,
          boxShadow: settings.shadow
            ? `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.1)`
            : 'none',
          border: settings.border ? `1px solid ${theme.colors.border}` : 'none',
          flexShrink: 0,
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