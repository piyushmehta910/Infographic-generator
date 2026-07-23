'use client';

import React, { useMemo } from 'react';
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
  const TemplateComponent = templateComponents[templateId] || ModernTemplate;

  const scale = useMemo(() => {
    return Math.min(800 / aspectRatio.width, 600 / aspectRatio.height, 1);
  }, [aspectRatio.width, aspectRatio.height]);

  return (
    <div
      style={{
        width: `${aspectRatio.width}px`,
        height: `${aspectRatio.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
        borderRadius: `${settings.roundedCorners}px`,
        boxShadow: settings.shadow
          ? `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.1)`
          : 'none',
        border: settings.border ? `1px solid ${theme.colors.border}` : 'none',
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
  );
};

export default TemplateRenderer;